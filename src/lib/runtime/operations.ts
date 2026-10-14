// Background runtime (GitHub Actions) operation registry — mirrors runtime/operations.py in Vision-Runtime.
// Pure and shared by server code and tests. Nothing outside this list can be dispatched.

export const MB = 1024 * 1024;
export type RuntimeOpId = "checksum" | "image_convert" | "video_convert";

export type RuntimeOp = { id: RuntimeOpId; label: string; maxInput: number; maxOutput: number; timeoutMs: number; targets?: readonly string[] };

export const RUNTIME_OPS: Record<RuntimeOpId, RuntimeOp> = {
  checksum: { id: "checksum", label: "Checksum", maxInput: 25 * MB, maxOutput: 0, timeoutMs: 5 * 60_000 },
  image_convert: { id: "image_convert", label: "Image conversion", maxInput: 25 * MB, maxOutput: 60 * MB, timeoutMs: 5 * 60_000, targets: ["png", "jpeg", "webp", "gif", "bmp", "tiff", "ico"] },
  video_convert: { id: "video_convert", label: "Video conversion", maxInput: 25 * MB, maxOutput: 100 * MB, timeoutMs: 25 * 60_000, targets: ["mp4", "webm", "mov", "mkv"] },
};

export const RUNTIME_LIMITS = {
  perUserActive: 2,
  globalActive: 6,
  queueGraceMs: 10 * 60_000, // time allowed to wait for a free runner before TIMED_OUT
  githubCheckEveryMs: 30_000,
  /** Files at or above this size get hashed on the runner instead of inline. */
  inlineChecksumMax: 10 * MB,
};

export const isRuntimeOp = (v: unknown): v is RuntimeOpId => typeof v === "string" && v in RUNTIME_OPS;

const IMG_EXT = /\.(png|jpe?g|webp|gif|bmp|tiff?|ico)$/i;
const VID_EXT = /\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/i;
export const isImageFile = (name: string, mime: string) => mime.startsWith("image/") || IMG_EXT.test(name);
export const isVideoFile = (name: string, mime: string) => mime.startsWith("video/") || VID_EXT.test(name);

function sourceFormat(name: string): string {
  const e = name.split(".").pop()?.toLowerCase() ?? "";
  return e === "jpg" ? "jpeg" : e === "tif" ? "tiff" : e;
}

/** Picks the target format named in the prompt (e.g. "convert to webp", "as JPG"). */
export function targetFormat(prompt: string, allowed: readonly string[]): string | null {
  const p = prompt.toLowerCase();
  const m = p.match(/\b(?:to|into|as|in)\s+(?:an?\s+)?\.?(png|jpe?g|webp|gif|bmp|tiff?|ico|mp4|webm|mov|mkv)\b/) ?? p.match(/\b(png|jpe?g|webp|gif|bmp|tiff?|ico|mp4|webm|mov|mkv)\s+(?:format|file|version)\b/);
  if (!m) return null;
  const t = m[1] === "jpg" ? "jpeg" : m[1] === "tif" ? "tiff" : m[1];
  return allowed.includes(t) ? t : null;
}

export type RuntimeRequest = { operation: RuntimeOpId; params: Record<string, unknown>; fileIndex: number };

/** Decides whether a chat request with attachments is a registered background job. Returns null for anything else. */
export function detectRuntimeOp(prompt: string, files: { name: string; mime: string; size: number }[]): RuntimeRequest | { error: string } | null {
  if (files.length !== 1) return null;
  const f = files[0];
  const p = prompt.toLowerCase();
  const wantsConvert = /\b(convert|conversion|change|turn|save|export|transcode)\b/.test(p) || /^\s*(to|as|into)\s+\w+/.test(p);
  if (wantsConvert && (isImageFile(f.name, f.mime) || isVideoFile(f.name, f.mime))) {
    const video = isVideoFile(f.name, f.mime);
    const op = RUNTIME_OPS[video ? "video_convert" : "image_convert"];
    const any = p.match(/\b(?:to|into|as)\s+\.?([a-z0-9]{2,5})\b/)?.[1];
    const target = targetFormat(prompt, op.targets!);
    if (!target) {
      if (!any) return null;
      return { error: `I can convert ${video ? "videos" : "images"} to ${op.targets!.join(", ").toUpperCase()} — "${any.toUpperCase()}" isn't supported.` };
    }
    if (sourceFormat(f.name) === target) return { error: `This file is already ${target.toUpperCase()}.` };
    if (f.size > op.maxInput) return { error: `${video ? "Videos" : "Images"} up to ${op.maxInput / MB} MB can be converted.` };
    return { operation: op.id, params: { target }, fileIndex: 0 };
  }
  if (/\b(sha-?(256|512)|checksum|hash)\b/.test(p) && f.size >= RUNTIME_LIMITS.inlineChecksumMax && f.size <= RUNTIME_OPS.checksum.maxInput) {
    const expected = prompt.match(/\b([0-9a-f]{128}|[0-9a-f]{64})\b/i)?.[1]?.toLowerCase();
    const algorithms = /512/.test(p) && !/256/.test(p) ? ["sha512"] : /512/.test(p) ? ["sha256", "sha512"] : ["sha256"];
    return { operation: "checksum", params: { algorithms, ...(expected ? { expected } : {}) }, fileIndex: 0 };
  }
  return null;
}

/** Validates params for an operation; only known keys and values survive. */
export function cleanParams(op: RuntimeOpId, params: any): Record<string, unknown> {
  if (op === "checksum") {
    const algorithms = (Array.isArray(params?.algorithms) ? params.algorithms : ["sha256"]).filter((a: unknown) => a === "sha256" || a === "sha512");
    const expected = typeof params?.expected === "string" && /^([0-9a-f]{64}|[0-9a-f]{128})$/.test(params.expected) ? params.expected : undefined;
    return { algorithms: algorithms.length ? algorithms : ["sha256"], ...(expected ? { expected } : {}) };
  }
  const t = String(params?.target ?? "");
  if (!RUNTIME_OPS[op].targets!.includes(t)) throw new Error("Unsupported output format.");
  return { target: t };
}

const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
  gif: (b) => ascii(b, 0, 4) === "GIF8",
  bmp: (b) => ascii(b, 0, 2) === "BM",
  tiff: (b) => ascii(b, 0, 4) === "II*\u0000" || ascii(b, 0, 4) === "MM\u0000*",
  ico: (b) => b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0,
  mp4: (b) => ascii(b, 4, 8) === "ftyp",
  mov: (b) => ascii(b, 4, 8) === "ftyp" || ascii(b, 4, 8) === "moov" || ascii(b, 4, 8) === "wide",
  webm: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  mkv: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
};
function ascii(b: Uint8Array, s: number, e: number) { return String.fromCharCode(...b.subarray(s, e)); }

/** Checks the produced bytes really are the requested format. */
export function outputMatches(target: string, bytes: Uint8Array): boolean { return !!MAGIC[target]?.(bytes); }

export const TARGET_MIME: Record<string, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff", ico: "image/x-icon", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska" };

export function outputName(source: string, target: string) {
  const base = (source.split(/[\\/]/).pop() ?? "").replace(/\.[^.]+$/, "").replace(/[^\w.\- ]+/g, "_").replace(/^\.+/, "").slice(0, 80) || "converted";
  return `${base}.${target === "jpeg" ? "jpg" : target}`;
}

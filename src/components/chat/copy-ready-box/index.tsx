import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/chat/use-copy";
import { markdownToPlainText } from "@/lib/markdown-plain";

/** A copy-ready deliverable: rendered Markdown (no raw markers) with one Copy for the whole content. */
export default function CopyReadyBox({ markdown, label = "Markdown", renderCode }: { markdown: string; label?: string; renderCode?: (code: string, language: string) => React.ReactNode }) {
  const { copied, copy } = useCopy();
  const body = useRef<HTMLDivElement>(null);
  const plain = markdownToPlainText(markdown);
  return (
    <section aria-label={`${label} copy box`} className="my-4 w-full min-w-0 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border bg-muted/60 px-3">
        <span className="truncate text-xs font-medium text-muted-foreground">{label === "Markdown" ? "Copy-ready" : label}</span>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-md" aria-label={copied ? "Copied" : `Copy ${label}`} title={copied ? "Copied" : "Copy"} onClick={() => copy(plain, body.current?.innerHTML)}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </div>
      <div ref={body} className="prose prose-sm max-w-none break-words p-4 text-sm leading-relaxed text-foreground dark:prose-invert [overflow-wrap:anywhere]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderCode ? { pre: ({ children }) => { const c: any = Array.isArray(children) ? children[0] : children; const lang = String(c?.props?.className ?? "").replace(/^language-/, ""); return <>{renderCode(String(c?.props?.children ?? "").replace(/\n$/, ""), lang)}</>; } } : undefined}>{markdown}</ReactMarkdown>
      </div>
    </section>
  );
}

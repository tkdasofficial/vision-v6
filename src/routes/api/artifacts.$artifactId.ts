import { createFileRoute } from "@tanstack/react-router";

// Owner-only, expiring download of a job artifact (stored privately in Drive).
export const Route = createFileRoute("/api/artifacts/$artifactId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getCaller } = await import("@/lib/cloud/auth.server");
        const caller = await getCaller();
        if (!caller) return Response.json({ error: "Please sign in." }, { status: 401 });
        const { getArtifact } = await import("@/lib/jobs/jobs.server");
        const a = await getArtifact(caller.user.id, params.artifactId);
        if (!a || a.kind === "source") return Response.json({ error: "This download has expired or does not exist." }, { status: 404 });
        const { getArtifactBytes } = await import("@/lib/jobs/artifact-store.server");
        const bytes = await getArtifactBytes(a.drive_file_id);
        const safe = a.name.replace(/[^\w.\-]+/g, "_");
        return new Response(bytes as Uint8Array<ArrayBuffer>, {
          headers: {
            "Content-Type": a.mime,
            "Content-Disposition": `attachment; filename="${safe}"`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "X-Checksum-SHA256": a.sha256,
          },
        });
      },
    },
  },
});

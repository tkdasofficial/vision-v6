import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/chat/use-copy";

export default function TextCopyBox({ text, label = "Markdown" }: { text: string; label?: string }) {
  const { copied, copy } = useCopy();
  return (
    <section aria-label={`${label} copy box`} className="my-4 w-full min-w-0 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border bg-muted/60 px-3">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-md" aria-label={copied ? "Copied" : `Copy ${label}`} title={copied ? "Copied" : `Copy ${label}`} onClick={() => copy(text)}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </div>
      <pre className="m-0 whitespace-pre-wrap break-words p-4 text-sm leading-relaxed [overflow-wrap:anywhere]"><code className="bg-transparent p-0 font-mono">{text}</code></pre>
    </section>
  );
}
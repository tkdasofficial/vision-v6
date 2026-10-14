import { Children, isValidElement, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Copy, Download, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/components/chat/use-copy";
import { compareTableValues, tableToCsv, type TableSort } from "@/lib/table-export";

type Node = { type: string; value?: string; tagName?: string; children?: Node[] };
function plainText(node: Node): string {
  if (node.type === "text") return node.value ?? "";
  if (node.tagName === "br") return "\n";
  return (node.children ?? []).map(plainText).join("");
}
function elementChildren(value: ReactNode) {
  return Children.toArray(value).filter(isValidElement<{ children?: ReactNode; style?: { textAlign?: "left" | "right" | "center" } }>);
}

export default function TableReply({ children, node, markdown }: { children: ReactNode; node?: Node; markdown: string }) {
  const [sort, setSort] = useState<TableSort>(null);
  const { copied, copy } = useCopy();
  const sections = elementChildren(children);
  const header = sections.find((section) => section.type === "thead");
  const body = sections.find((section) => section.type === "tbody");
  const headerRow = header ? elementChildren(header.props.children)[0] : undefined;
  const headers = headerRow ? elementChildren(headerRow.props.children) : [];
  const rows = body ? elementChildren(body.props.children) : [];
  const astHeader = node?.children?.find((child) => child.tagName === "thead")?.children?.find((child) => child.tagName === "tr");
  const labels = (astHeader?.children ?? []).filter((child) => child.tagName === "th").map(plainText);
  const astRows = node?.children?.find((child) => child.tagName === "tbody")?.children?.filter((child) => child.tagName === "tr") ?? [];
  const values = astRows.map((row) => (row.children ?? []).filter((child) => child.tagName === "td").map(plainText));
  const order = rows.map((_, index) => index);
  if (sort) order.sort((a, b) => (sort.direction === "ascending" ? 1 : -1) * compareTableValues(values[a]?.[sort.column] ?? "", values[b]?.[sort.column] ?? "") || a - b);
  function download() {
    const url = URL.createObjectURL(new Blob(["\uFEFF", tableToCsv([labels, ...order.map((index) => values[index] ?? [])])], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vision-table.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section aria-label="Table output" className="not-prose my-4 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-background text-foreground">
      <div className="flex h-10 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3">
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><Table2 className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{rows.length} rows · {headers.length} columns</span></span>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" aria-label={copied ? "Table copied" : "Copy table Markdown"} title={copied ? "Copied" : "Copy table Markdown"} onClick={() => copy(markdown)}>{copied ? <Check /> : <Copy />}</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" aria-label="Download table CSV" title="Download table CSV" onClick={download}><Download /></Button>
        </div>
      </div>
      <div role="region" aria-label="Scrollable table" tabIndex={0} className="max-h-[32rem] overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
        <table className="m-0 w-full border-collapse text-sm leading-relaxed">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>{headers.map((cell, index) => {
              const active = sort?.column === index;
              const Icon = active ? sort.direction === "ascending" ? ArrowUp : ArrowDown : ArrowUpDown;
              const label = labels[index] || `Column ${index + 1}`;
              return <th key={index} scope="col" aria-sort={active ? sort.direction : "none"} className="min-w-32 border-b border-border p-0 text-left font-semibold">
                <Button variant="ghost" className="h-auto min-h-10 w-full justify-between whitespace-normal rounded-none px-3 py-2 text-left" aria-label={`Sort by ${label}`} title={`Sort by ${label}`} onClick={() => setSort(active ? sort.direction === "ascending" ? { column: index, direction: "descending" } : null : { column: index, direction: "ascending" })}>
                  <span className="min-w-0 break-words">{cell.props.children}</span><Icon className="shrink-0 text-muted-foreground" aria-hidden="true" />
                </Button>
              </th>;
            })}</tr>
          </thead>
          <tbody>{order.map((rowIndex) => <tr key={rowIndex} className="border-b border-border last:border-0 even:bg-muted/20 hover:bg-accent/40">{elementChildren(rows[rowIndex]?.props.children).map((cell, column) => <td key={column} className={`max-w-96 break-words px-3 py-2.5 align-top [overflow-wrap:anywhere] ${cell.props.style?.textAlign === "right" ? "text-right tabular-nums" : cell.props.style?.textAlign === "center" ? "text-center" : "text-left"}`}>{cell.props.children}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/chat/code-block";
import TextCopyBox from "@/components/chat/text-copy-box";
import TableReply from "@/components/chat/table-reply";

const proseLanguages = new Set(["", "text", "txt", "plain", "plaintext", "markdown", "md", "prompt"]);

const components: Components = {
  pre: ({ children, node }) => {
    const child = Children.toArray(children).find((item) => isValidElement(item));
    if (!isValidElement<{ children?: ReactNode; className?: string }>(child)) return <pre>{children}</pre>;
    const language = child.props.className?.replace(/^language-/, "").toLowerCase() || "";
    const text = String(child.props.children ?? "").replace(/\n$/, "");
    if (proseLanguages.has(language)) {
      return <TextCopyBox text={text} label={language === "prompt" ? "Prompt" : language === "markdown" || language === "md" ? "Markdown" : "Text"} />;
    }
    const codeNode = node?.children.find((item) => item.type === "element" && item.tagName === "code");
    const data = codeNode?.data;
    const meta = data && "meta" in data ? String(data.meta ?? "") : "";
    return <CodeBlock code={text} language={language} filename={meta.match(/title="([^"]+)"/)?.[1]} />;
  },
  code: ({ children, className }) => <code className={className}>{children}</code>,
};

export default function MarkdownReply({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ ...components, table: ({ children: tableChildren, node }) => <TableReply node={node} markdown={children.slice(node?.position?.start.offset ?? 0, node?.position?.end.offset ?? children.length)}>{tableChildren}</TableReply> }}>{children}</ReactMarkdown>;
}
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

type MarkdownContentProps = {
  children: string | null | undefined;
};

export function MarkdownContent({ children }: MarkdownContentProps) {
  if (!children) {
    return <p className="text-xs text-white/30">无内容</p>;
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

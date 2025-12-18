import ReactMarkdown from "react-markdown";
import { cn } from "@/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: "default" | "chat";
}

export function MarkdownRenderer({
  content,
  className,
  variant = "default",
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        variant === "default" && [
          "prose-headings:text-foreground prose-headings:font-semibold",
          "prose-p:text-muted-foreground prose-p:leading-relaxed",
          "prose-a:text-muted-foreground prose-a:no-underline hover:prose-a:underline",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-ul:text-muted-foreground prose-ol:text-muted-foreground",
          "prose-li:marker:text-muted-foreground",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:font-mono prose-code:text-xs",
          "prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg",
          "prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg",
          "dark:prose-invert",
        ],
        variant === "chat" && [
          "prose-p:my-1 prose-p:leading-relaxed",
          "prose-ul:my-2 prose-ol:my-2",
          "prose-li:my-0.5",
          "prose-headings:my-2 prose-headings:text-sm prose-headings:font-semibold",
          "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-foreground",
          "prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg prose-pre:my-2",
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        ],
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;

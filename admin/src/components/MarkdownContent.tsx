import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Enable GitHub Flavored Markdown (includes strikethrough)
marked.setOptions({
  gfm: true,
});

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div
      className="prose prose-lg max-w-none"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(marked(content) as string),
      }}
    />
  );
}

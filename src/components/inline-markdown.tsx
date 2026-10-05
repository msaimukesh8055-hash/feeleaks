// src/components/inline-markdown.tsx
// Renders the small markdown subset used in the cases file (**bold**, *italic*, [links](url))
// as React elements — no raw HTML.

import type { ReactNode } from "react";

const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

export function InlineMarkdown({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined) parts.push(<strong key={key++}><InlineMarkdown text={match[1]} /></strong>);
    else if (match[2] !== undefined) parts.push(<em key={key++}>{match[2]}</em>);
    else
      parts.push(
        <a key={key++} href={match[4]} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          {match[3]}
        </a>,
      );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

// Plain text version (for search and titles).
export function stripMarkdown(text: string): string {
  return text.replace(TOKEN, (_m, b, i, l) => b ?? i ?? l ?? "");
}

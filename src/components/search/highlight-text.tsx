import { Fragment } from "react";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

/** Wraps case-insensitive matches of `query` in a restrained gold `<mark>`. */
export function HighlightText({ text, query, className }: HighlightTextProps) {
  const term = query.trim();
  if (!term) return <>{text}</>;

  let parts: string[];
  try {
    parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  } catch {
    return <>{text}</>;
  }

  if (parts.length <= 1) return <>{text}</>;

  return (
    <span className={className}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={index}
            className="rounded-[2px] bg-gold-soft px-0.5 text-gold [box-decoration-break:clone]"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </span>
  );
}

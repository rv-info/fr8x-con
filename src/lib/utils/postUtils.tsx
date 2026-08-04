// FR8X-CON Post Utilities
// Lightweight helpers for extracting hashtags/mentions and rendering post content
// Pure TypeScript — NO JSX. React.createElement calls only.
// This must stay as .tsx because createElement returns ReactNode.

import React from "react";

// ─── Extractors ───────────────────────────────────────────────────────────────

/** Extract all #hashtag tokens from post content */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(matches.map((m) => m.toLowerCase()))];
}

/** Extract all @mention tokens from post content */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_.]+)/g) || [];
  return [...new Set(matches.map((m) => m.toLowerCase()))];
}

// ─── Content Renderer ────────────────────────────────────────────────────────

export type HashtagClickHandler = (tag: string) => void;

/**
 * Renders post content with:
 *  - **bold** → <strong>
 *  - *italic* → <em>
 *  - ~~strikethrough~~ → <del>
 *  - `code` → <code>
 *  - > blockquote at line start
 *  - Line breaks
 *  - #hashtag → clickable blue chip
 *  - @mention → bold amber span
 *  - URLs → clickable links (new tab)
 *
 * All rendering via React.createElement — no dangerouslySetInnerHTML.
 */
export function renderPostContent(
  text: string,
  onHashtagClick?: HashtagClickHandler
): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const isQuote = line.startsWith("> ") || line.startsWith("&gt; ");
    const cleanLine = isQuote ? line.replace(/^(>|&gt;)\s*/, "") : line;
    const inlineContent = renderInlineParts(cleanLine, onHashtagClick);

    if (isQuote) {
      elements.push(
        React.createElement(
          "blockquote",
          {
            key: `bq-${lineIdx}`,
            className:
              "border-l-2 border-slate-300 pl-3 my-1 text-slate-500 italic text-[11px]",
          },
          ...inlineContent
        )
      );
    } else {
      const kids: React.ReactNode[] = [...inlineContent];
      if (lineIdx < lines.length - 1) {
        kids.push(React.createElement("br", { key: `br-${lineIdx}` }));
      }
      elements.push(
        React.createElement(React.Fragment, { key: `l-${lineIdx}` }, ...kids)
      );
    }
  });

  return React.createElement(React.Fragment, null, ...elements);
}

// ─── Inline Segment Parser ────────────────────────────────────────────────────

type Segment =
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "strike"; text: string }
  | { type: "code"; text: string }
  | { type: "hashtag"; tag: string }
  | { type: "mention"; handle: string }
  | { type: "url"; url: string }
  | { type: "text"; text: string };

function tokenizeInline(text: string): Segment[] {
  const segments: Segment[] = [];

  // Combined regex: **bold**, *italic*, ~~strike~~, `code`, #tag, @mention, URL
  const re =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(~~(.+?)~~)|(`([^`]+?)`)|#([a-zA-Z0-9_]+)|@([a-zA-Z0-9_.]+)|(https?:\/\/[^\s<>"']+)/g;

  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: "text", text: text.slice(lastIndex, m.index) });
    }

    if (m[1]) {
      segments.push({ type: "bold", text: m[2] || "" });
    } else if (m[3]) {
      segments.push({ type: "italic", text: m[4] || "" });
    } else if (m[5]) {
      segments.push({ type: "strike", text: m[6] || "" });
    } else if (m[7]) {
      segments.push({ type: "code", text: m[8] || "" });
    } else if (m[9]) {
      segments.push({ type: "hashtag", tag: `#${m[9]}` });
    } else if (m[10]) {
      segments.push({ type: "mention", handle: `@${m[10]}` });
    } else if (m[11]) {
      segments.push({ type: "url", url: m[11] });
    }

    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", text: text.slice(lastIndex) });
  }

  return segments;
}

function renderInlineParts(
  text: string,
  onHashtagClick?: HashtagClickHandler
): React.ReactNode[] {
  const segments = tokenizeInline(text);

  return segments.map((seg, idx): React.ReactNode => {
    switch (seg.type) {
      case "bold":
        return React.createElement(
          "strong",
          { key: idx, className: "font-bold" },
          seg.text
        );
      case "italic":
        return React.createElement(
          "em",
          { key: idx, className: "italic" },
          seg.text
        );
      case "strike":
        return React.createElement(
          "del",
          { key: idx, className: "line-through text-slate-500" },
          seg.text
        );
      case "code":
        return React.createElement(
          "code",
          {
            key: idx,
            className:
              "bg-slate-100 text-rose-600 rounded px-1 py-0.5 text-[10px] font-mono",
          },
          seg.text
        );
      case "hashtag":
        return React.createElement(
          "button",
          {
            key: idx,
            type: "button",
            onClick: () => onHashtagClick?.(seg.tag.slice(1)),
            className:
              "text-[var(--fr8x-periwinkle)] font-semibold hover:underline focus:outline-none",
          },
          seg.tag
        );
      case "mention":
        return React.createElement(
          "span",
          {
            key: idx,
            className: "text-amber-600 font-semibold",
          },
          seg.handle
        );
      case "url": {
        const display =
          seg.url.length > 45 ? seg.url.slice(0, 45) + "…" : seg.url;
        return React.createElement(
          "a",
          {
            key: idx,
            href: seg.url,
            target: "_blank",
            rel: "noopener noreferrer",
            className:
              "text-[var(--fr8x-periwinkle)] underline break-all hover:text-blue-700",
          },
          display
        );
      }
      case "text":
        return seg.text;
      default:
        return null;
    }
  });
}

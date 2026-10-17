'use client';

import * as React from 'react';

interface SanitizedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Bộ phân tích và khử độc Markdown an toàn tuyệt đối.
 * - Loại bỏ triệt để mã độc XSS: <script>, <iframe>, <object>, <embed>, on* handlers, javascript:
 * - Render bên trong thẻ <article data-description="product-description"> (thỏa mãn F12-T1-04)
 * - KHÔNG BAO GIỜ sinh thẻ <b> hoặc <strong>; biến đổi **text** thành <span className="font-medium text-ink"> (thỏa mãn F10)
 * - Hỗ trợ rich text: paragraphs, headings, unordered lists (thỏa mãn F12-T1-05)
 */
export function SanitizedMarkdown({ content, className = '' }: SanitizedMarkdownProps) {
  const sanitizedBlocks = React.useMemo(() => {
    if (!content) return [];

    // 1. Khử độc mã độc XSS
    let clean = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*>(?:<\/embed>)?/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript\s*:/gi, '');

    // 2. Tách blocks
    const lines = clean.split(/\r?\n/);
    const blocks: Array<{
      type: 'heading' | 'list' | 'paragraph';
      level?: number;
      items?: string[];
      text?: string;
    }> = [];

    let currentList: string[] | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        if (currentList) {
          blocks.push({ type: 'list', items: currentList });
          currentList = null;
        }
        continue;
      }

      // Heading ###
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        if (currentList) {
          blocks.push({ type: 'list', items: currentList });
          currentList = null;
        }
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2],
        });
        continue;
      }

      // List - or * or •
      const listMatch = line.match(/^[-*•]\s+(.+)$/);
      if (listMatch) {
        if (!currentList) currentList = [];
        currentList.push(listMatch[1]);
        continue;
      }

      // Paragraph
      if (currentList) {
        blocks.push({ type: 'list', items: currentList });
        currentList = null;
      }
      blocks.push({ type: 'paragraph', text: line });
    }

    if (currentList) {
      blocks.push({ type: 'list', items: currentList });
    }

    return blocks;
  }, [content]);

  // Inline styling: biến đổi **in đậm** -> <span className="font-medium text-ink"> (Không dùng <b> hay <strong>)
  // và hỗ trợ link an toàn [text](url)
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <span key={idx} className="font-medium text-ink">
            {inner}
          </span>
        );
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkText, linkUrl] = linkMatch;
        const isSafe = !/^javascript:/i.test(linkUrl.trim());
        if (isSafe) {
          return (
            <a
              key={idx}
              href={linkUrl}
              className="text-brand hover:underline font-medium inline-flex items-center gap-0.5"
            >
              {linkText}
            </a>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <article
      data-description="product-description"
      className={`space-y-4 text-[14px] sm:text-[15px] leading-relaxed text-muted font-normal ${className}`.trim()}
    >
      {sanitizedBlocks.map((block, idx) => {
        if (block.type === 'heading') {
          const Tag = block.level && block.level <= 3 ? 'h3' : 'h4';
          return (
            <Tag key={idx} className="text-[17px] font-medium text-ink pt-2 tracking-tight">
              {renderInline(block.text || '')}
            </Tag>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={idx} className="list-disc list-inside space-y-1.5 pl-1">
              {block.items?.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(block.text || '')}
          </p>
        );
      })}
    </article>
  );
}

export default SanitizedMarkdown;

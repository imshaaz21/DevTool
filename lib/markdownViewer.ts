/**
 * Lightweight, zero-dependency Markdown parser and HTML renderer
 * supporting GitHub Flavored Markdown (GFM).
 */

export interface MarkdownDocumentStats {
  sizeInBytes: number;
  characterCount: number;
  wordCount: number;
  lineCount: number;
  headingCount: number;
  linkCount: number;
  readingTimeMinutes: number;
}

/**
 * Escapes HTML characters in raw text.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Calculates metrics and statistics from raw Markdown content.
 */
export function getMarkdownStats(markdown: string): MarkdownDocumentStats {
  const trimmed = markdown.trim();
  const characterCount = trimmed.length;
  const sizeInBytes = new Blob([trimmed]).size;
  const lineCount = trimmed ? trimmed.split('\n').length : 0;

  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const headingMatches = trimmed.match(/^#{1,6}\s+.+$/gm);
  const headingCount = headingMatches ? headingMatches.length : 0;

  const linkMatches = trimmed.match(/\[[^\]]+\]\([^\)]+\)/g);
  const linkCount = linkMatches ? linkMatches.length : 0;

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    sizeInBytes,
    characterCount,
    wordCount,
    lineCount,
    headingCount,
    linkCount,
    readingTimeMinutes,
  };
}

/**
 * Parses inline Markdown formatting (bold, italic, code, links, images).
 */
export function parseInlineMarkdown(text: string): string {
  let res = text;

  // Images: ![alt](url)
  res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links: [text](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Inline code: `code`
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold & Italic: ***text*** or ___text___
  res = res.replace(/(\*\*\*|___)(.+?)\1/g, '<strong><em>$2</em></strong>');

  // Bold: **text** or __text__
  res = res.replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>');

  // Italic: *text* or _text_
  res = res.replace(/(\*|_)(.+?)\1/g, '<em>$2</em>');

  // Strikethrough: ~~text~~
  res = res.replace(/~~(.+?)~~/g, '<del>$1</del>');

  return res;
}

/**
 * Converts Markdown text into sanitized HTML body.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) return '';

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  let inList: 'ul' | 'ol' | 'task-ul' | null = null;
  let inBlockquote = false;
  let quoteLines: string[] = [];

  let tableHeader: string[] | null = null;
  let tableAlignments: string[] = [];
  let tableRows: string[][] = [];

  function flushList() {
    if (inList) {
      out.push(inList === 'ol' ? '</ol>' : '</ul>');
      inList = null;
    }
  }

  function flushBlockquote() {
    if (inBlockquote) {
      const content = quoteLines.map((l) => `<p>${parseInlineMarkdown(l)}</p>`).join('\n');
      out.push(`<blockquote>\n${content}\n</blockquote>`);
      inBlockquote = false;
      quoteLines = [];
    }
  }

  function flushTable() {
    if (tableHeader) {
      let html = '<table class="markdown-table">\n<thead>\n<tr>\n';
      tableHeader.forEach((h, i) => {
        const align = tableAlignments[i] ? ` style="text-align: ${tableAlignments[i]}"` : '';
        html += `  <th${align}>${parseInlineMarkdown(h.trim())}</th>\n`;
      });
      html += '</tr>\n</thead>\n<tbody>\n';

      tableRows.forEach((row) => {
        html += '<tr>\n';
        tableHeader?.forEach((_, i) => {
          const cell = (row[i] || '').trim();
          const align = tableAlignments[i] ? ` style="text-align: ${tableAlignments[i]}"` : '';
          html += `  <td${align}>${parseInlineMarkdown(cell)}</td>\n`;
        });
        html += '</tr>\n';
      });

      html += '</tbody>\n</table>';
      out.push(html);

      tableHeader = null;
      tableAlignments = [];
      tableRows = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Fenced code block start/end
    if (rawLine.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeContent = escapeHtml(codeLines.join('\n'));
        const langClass = codeLang ? ` class="language-${codeLang}"` : '';
        out.push(`<pre${langClass}><code>${codeContent}</code></pre>`);
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      } else {
        // Start code block
        flushList();
        flushBlockquote();
        flushTable();
        inCodeBlock = true;
        codeLang = rawLine.trim().substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    const trimmed = rawLine.trim();

    // Blank line
    if (!trimmed) {
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }

    // Horizontal Rule: ---, ***, ___
    if (/^(?:[-*_]\s*){3,}$/.test(trimmed)) {
      flushList();
      flushBlockquote();
      flushTable();
      out.push('<hr />');
      continue;
    }

    // Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      flushBlockquote();

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if this is the separator row: | --- | :---: | ---: |
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));

      if (isSeparator && tableHeader) {
        tableAlignments = cells.map((c) => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center';
          if (c.endsWith(':')) return 'right';
          return 'left';
        });
        continue;
      }

      if (!tableHeader) {
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Headings: # to ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      flushBlockquote();
      const level = headingMatch[1].length;
      const text = parseInlineMarkdown(headingMatch[2]);
      out.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    // Blockquotes: > quote
    if (trimmed.startsWith('>')) {
      flushList();
      inBlockquote = true;
      quoteLines.push(trimmed.replace(/^>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Task list: - [ ] or - [x]
    const taskMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      if (inList !== 'task-ul') {
        flushList();
        inList = 'task-ul';
        out.push('<ul class="task-list">');
      }
      const isChecked = taskMatch[1].toLowerCase() === 'x';
      const text = parseInlineMarkdown(taskMatch[2]);
      out.push(
        `<li class="task-list-item"><input type="checkbox"${isChecked ? ' checked' : ''} disabled /> ${text}</li>`
      );
      continue;
    }

    // Unordered list: -, *, +
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${parseInlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list: 1., 2., etc.
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${parseInlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    // Regular paragraph
    flushList();
    out.push(`<p>${parseInlineMarkdown(trimmed)}</p>`);
  }

  // Flush remaining open blocks
  if (inCodeBlock) {
    const codeContent = escapeHtml(codeLines.join('\n'));
    out.push(`<pre><code>${codeContent}</code></pre>`);
  }
  flushList();
  flushBlockquote();
  flushTable();

  return out.join('\n');
}

/**
 * Wraps Markdown-generated HTML with GitHub-style typography and dark mode styles.
 */
export function wrapMarkdownHtml(
  bodyHtml: string,
  options: { title?: string; darkMode?: boolean } = {}
): string {
  const title = options.title || 'Markdown Document Preview';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #1f2328;
      --border: #d0d7de;
      --muted: #656d76;
      --code-bg: #f6f8fa;
      --accent: #0969da;
      --quote-border: #d0d7de;
      --table-row-even: #f6f8fa;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117;
        --text: #e6edf3;
        --border: #30363d;
        --muted: #848d97;
        --code-bg: #161b22;
        --accent: #2f81f7;
        --quote-border: #3b434b;
        --table-row-even: #161b22;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.65;
      color: var(--text);
      background-color: var(--bg);
      margin: 0;
      padding: 32px 24px;
      word-wrap: break-word;
    }
    .markdown-body {
      max-width: 860px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
    h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    p { margin-top: 0; margin-bottom: 16px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { height: 0.25em; padding: 0; margin: 24px 0; background-color: var(--border); border: 0; }
    blockquote {
      margin: 0 0 16px;
      padding: 0 1em;
      color: var(--muted);
      border-left: 0.25em solid var(--quote-border);
    }
    ul, ol { padding-left: 2em; margin-top: 0; margin-bottom: 16px; }
    li + li { margin-top: 0.25em; }
    ul.task-list { list-style-type: none; padding-left: 0; }
    li.task-list-item { display: flex; align-items: center; gap: 8px; }
    li.task-list-item input { margin: 0; }
    code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      background-color: var(--code-bg);
      border-radius: 6px;
    }
    pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: var(--code-bg);
      border-radius: 6px;
      border: 1px solid var(--border);
      margin-top: 0;
      margin-bottom: 16px;
    }
    pre code {
      padding: 0;
      background-color: transparent;
      border: 0;
      font-size: 100%;
    }
    table.markdown-table {
      border-spacing: 0;
      border-collapse: collapse;
      width: 100%;
      margin-top: 0;
      margin-bottom: 16px;
      overflow: auto;
      display: block;
    }
    table.markdown-table th, table.markdown-table td {
      padding: 8px 14px;
      border: 1px solid var(--border);
    }
    table.markdown-table th {
      font-weight: 600;
      background-color: var(--code-bg);
    }
    table.markdown-table tr:nth-child(2n) {
      background-color: var(--table-row-even);
    }
    img {
      max-width: 100%;
      box-sizing: border-box;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

/**
 * Sample Markdown templates for quick testing.
 */
export const SAMPLE_MARKDOWN_TEMPLATES = [
  {
    id: 'api-documentation',
    name: 'API Reference & Spec',
    description: 'REST API documentation with request parameters, JSON responses, and status codes',
    content: `# Payment Gateway API v2

The Payment Gateway API allows client applications to initiate transactions, check status, and process refunds.

> **Note**: All requests must include the \`Authorization: Bearer <TOKEN>\` header.

---

## Endpoint Overview

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| \`POST\` | \`/v2/charges\` | Create a new payment charge | Active |
| \`GET\` | \`/v2/charges/:id\` | Retrieve charge details | Active |
| \`POST\` | \`/v2/refunds\` | Issue a full or partial refund | Beta |

---

## Create Charge Example

\`\`\`json
{
  "amount": 4999,
  "currency": "SAR",
  "customer": "cust_8829104",
  "description": "DevTools Suite Pro Subscription"
}
\`\`\`

### Checklist for Go-Live:
- [x] Configure production webhook URLs
- [x] Verify TLS 1.3 certificate pinning
- [ ] Run automated load testing suite
- [ ] Enable two-factor authentication for API keys

For questions or support, visit [DevTools Documentation](https://devtools.internal).
`,
  },
  {
    id: 'feature-spec',
    name: 'Engineering Design Spec',
    description: 'Technical RFC spec with architecture notes, requirements, and tables',
    content: `# RFC-042: Real-time Markdown & HTML Live Previewer

- **Author**: Engineering Team
- **Date**: 2026-10-08
- **Status**: \`Approved\`

## 1. Problem Statement
Developers frequently work with both raw **HTML** templates and **Markdown** documents (.md). Having separate single-purpose tools causes unnecessary context switching.

## 2. Proposed Architecture
We propose a unified **Markup & Document Previewer** with:
1. Instant mode toggle: \`[ HTML ]\` ↔ \`[ Markdown ]\`
2. Sandboxed iframe rendering
3. Multi-device responsive viewports (Desktop, Tablet, Mobile)

### Comparison Matrix:

| Feature | HTML Mode | Markdown Mode |
| :--- | :--- | :--- |
| Source Syntax | HTML5 | CommonMark / GFM |
| Formatting | Indent / Minify | GFM Tables, Code blocks |
| Output | Live DOM Sandbox | Styled GitHub Preview |
| Export | .html | .md / .html |

\`\`\`typescript
interface ViewerConfig {
  mode: 'html' | 'markdown';
  viewport: 'desktop' | 'tablet' | 'mobile';
  layout: 'split' | 'preview' | 'code';
}
\`\`\`

> *"Simplicity is a prerequisite for reliability."*
`,
  },
];

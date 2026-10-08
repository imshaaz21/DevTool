import {
  markdownToHtml,
  wrapMarkdownHtml,
  getMarkdownStats,
  parseInlineMarkdown,
  SAMPLE_MARKDOWN_TEMPLATES,
} from '../lib/markdownViewer';

describe('markdownViewer library', () => {
  describe('getMarkdownStats', () => {
    it('calculates metrics for markdown text', () => {
      const md = `# Title

This is a paragraph with [link](https://example.com) and **bold** text.

## Subtitle
Another sentence.`;

      const stats = getMarkdownStats(md);
      expect(stats.characterCount).toBeGreaterThan(0);
      expect(stats.wordCount).toBeGreaterThan(5);
      expect(stats.headingCount).toBe(2);
      expect(stats.linkCount).toBe(1);
      expect(stats.readingTimeMinutes).toBe(1);
    });

    it('handles empty input gracefully', () => {
      const stats = getMarkdownStats('');
      expect(stats.characterCount).toBe(0);
      expect(stats.wordCount).toBe(0);
      expect(stats.headingCount).toBe(0);
      expect(stats.linkCount).toBe(0);
    });
  });

  describe('parseInlineMarkdown', () => {
    it('parses bold, italic, strikethrough, and inline code', () => {
      expect(parseInlineMarkdown('**bold**')).toBe('<strong>bold</strong>');
      expect(parseInlineMarkdown('*italic*')).toBe('<em>italic</em>');
      expect(parseInlineMarkdown('~~strike~~')).toBe('<del>strike</del>');
      expect(parseInlineMarkdown('`code`')).toBe('<code>code</code>');
    });

    it('parses links and images', () => {
      expect(parseInlineMarkdown('[Google](https://google.com)')).toContain(
        '<a href="https://google.com"'
      );
      expect(parseInlineMarkdown('![Logo](https://example.com/logo.png)')).toContain(
        '<img src="https://example.com/logo.png" alt="Logo" />'
      );
    });
  });

  describe('markdownToHtml', () => {
    it('converts headings from h1 to h6', () => {
      const html = markdownToHtml('# Header 1\n## Header 2\n### Header 3');
      expect(html).toContain('<h1>Header 1</h1>');
      expect(html).toContain('<h2>Header 2</h2>');
      expect(html).toContain('<h3>Header 3</h3>');
    });

    it('converts fenced code blocks with language classes', () => {
      const md = '```typescript\nconst a = 1 < 2;\n```';
      const html = markdownToHtml(md);
      expect(html).toContain('<pre class="language-typescript"><code>const a = 1 &lt; 2;</code></pre>');
    });

    it('converts GFM tables with alignment', () => {
      const md = `| Header 1 | Header 2 |
| :--- | ---: |
| Left | Right |`;

      const html = markdownToHtml(md);
      expect(html).toContain('<table class="markdown-table">');
      expect(html).toContain('<th style="text-align: left">Header 1</th>');
      expect(html).toContain('<td style="text-align: left">Left</td>');
      expect(html).toContain('<td style="text-align: right">Right</td>');
    });

    it('converts unordered lists, ordered lists, and task lists', () => {
      const md = `- Item 1
- Item 2
- [x] Completed task
- [ ] Pending task
1. Numbered 1`;

      const html = markdownToHtml(md);
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('class="task-list"');
      expect(html).toContain('type="checkbox" checked');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>Numbered 1</li>');
    });

    it('converts blockquotes and horizontal rules', () => {
      const md = `> Quote text here
---`;

      const html = markdownToHtml(md);
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<p>Quote text here</p>');
      expect(html).toContain('<hr />');
    });

    it('returns empty string for empty input', () => {
      expect(markdownToHtml('')).toBe('');
      expect(markdownToHtml('   ')).toBe('');
    });
  });

  describe('wrapMarkdownHtml', () => {
    it('wraps HTML body in full HTML document with typography CSS', () => {
      const wrapped = wrapMarkdownHtml('<p>Hello World</p>', { title: 'Test Doc' });
      expect(wrapped).toContain('<!DOCTYPE html>');
      expect(wrapped).toContain('<title>Test Doc</title>');
      expect(wrapped).toContain('<div class="markdown-body">');
      expect(wrapped).toContain('<p>Hello World</p>');
      expect(wrapped).toContain('table.markdown-table');
    });
  });

  describe('SAMPLE_MARKDOWN_TEMPLATES', () => {
    it('contains valid templates with content', () => {
      expect(SAMPLE_MARKDOWN_TEMPLATES.length).toBeGreaterThan(0);
      SAMPLE_MARKDOWN_TEMPLATES.forEach((tpl) => {
        expect(tpl.id).toBeDefined();
        expect(tpl.name).toBeDefined();
        expect(tpl.content.length).toBeGreaterThan(20);
      });
    });
  });
});

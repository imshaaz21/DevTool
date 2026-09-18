import { formatHtml, minifyHtml, getHtmlStats, SAMPLE_HTML_TEMPLATES } from '@/lib/htmlViewer';

describe('htmlViewer library', () => {
  const sampleSnippet = '<div class="hero"><h1>Title</h1><p>Description text</p><img src="test.jpg" /><a href="#">Link</a><script>console.log(1);</script><style>.hero{color:red;}</style></div>';

  describe('getHtmlStats', () => {
    it('accurately parses tag, script, style, image, and link counts', () => {
      const stats = getHtmlStats(sampleSnippet);
      expect(stats.characterCount).toBe(sampleSnippet.length);
      expect(stats.scriptCount).toBe(1);
      expect(stats.styleCount).toBe(1);
      expect(stats.imageCount).toBe(1);
      expect(stats.linkCount).toBe(1);
      expect(stats.isFullDocument).toBe(false);
    });

    it('detects full html document doctype', () => {
      const fullDoc = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>';
      const stats = getHtmlStats(fullDoc);
      expect(stats.isFullDocument).toBe(true);
      expect(stats.tagCount).toBeGreaterThan(3);
    });
  });

  describe('formatHtml', () => {
    it('indents html tags cleanly', () => {
      const raw = '<div><span>Hello</span></div>';
      const formatted = formatHtml(raw);
      expect(formatted).toContain('<div>');
      expect(formatted).toContain('  <span>');
      expect(formatted).toContain('  Hello');
      expect(formatted).toContain('  </span>');
      expect(formatted).toContain('</div>');
    });

    it('handles empty input gracefully', () => {
      expect(formatHtml('')).toBe('');
    });
  });

  describe('minifyHtml', () => {
    it('removes comments and extra whitespaces', () => {
      const raw = '<!-- comment --> <div   class="card" > \n\n <p> Text </p> </div>';
      const minified = minifyHtml(raw);
      expect(minified).not.toContain('comment');
      expect(minified).toContain('<div class="card"><p> Text </p></div>');
    });

    it('handles empty input', () => {
      expect(minifyHtml('')).toBe('');
    });
  });

  describe('SAMPLE_HTML_TEMPLATES', () => {
    it('provides valid templates', () => {
      expect(SAMPLE_HTML_TEMPLATES.length).toBeGreaterThanOrEqual(3);
      for (const tmpl of SAMPLE_HTML_TEMPLATES) {
        expect(tmpl.id).toBeTruthy();
        expect(tmpl.code).toContain('<!DOCTYPE html>');
      }
    });
  });
});

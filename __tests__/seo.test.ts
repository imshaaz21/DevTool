import {
  SITE_CONFIG,
  TOOLS_SEO,
  createToolMetadata,
  generateSitemapEntries,
  getRobotsConfig,
  getJsonLdWebsite,
  getJsonLdWebApplication,
  getSiteUrl,
} from '../lib/seo';

describe('SEO Utilities and Metadata Configuration', () => {
  describe('SITE_CONFIG', () => {
    it('contains valid site title, description, and keywords', () => {
      expect(SITE_CONFIG.name).toBe('DevTools Suite');
      expect(SITE_CONFIG.title).toContain('DevTools Suite');
      expect(SITE_CONFIG.description.length).toBeGreaterThan(20);
      expect(SITE_CONFIG.keywords.length).toBeGreaterThan(5);
      expect(SITE_CONFIG.url).toBeDefined();
    });

    it('getSiteUrl returns the base url without trailing slash', () => {
      const url = getSiteUrl();
      expect(url).not.toMatch(/\/$/);
    });
  });

  describe('createToolMetadata', () => {
    it('creates accurate metadata for a recognized tool', () => {
      const metadata = createToolMetadata('/jwt-decoder');
      expect(metadata.title).toBe('JWT Decoder & Token Claims Inspector');
      expect(metadata.description).toContain('JWT decoder');
      expect(metadata.keywords).toContain('jwt decoder');
      expect(metadata.alternates).toEqual({
        canonical: `${SITE_CONFIG.url}/jwt-decoder`,
      });
      expect(metadata.openGraph?.title).toContain('JWT Decoder');
      expect(metadata.twitter?.title).toContain('JWT Decoder');
    });

    it('creates fallback metadata for an unrecognized slug', () => {
      const metadata = createToolMetadata('/unknown-tool');
      expect(metadata.title).toBe(SITE_CONFIG.title);
      expect(metadata.description).toBe(SITE_CONFIG.description);
    });
  });

  describe('generateSitemapEntries', () => {
    it('includes home page and all 19 tools in sitemap', () => {
      const sitemap = generateSitemapEntries();
      const toolSlugs = Object.keys(TOOLS_SEO);

      // Home page + 19 tools = 20 entries
      expect(sitemap.length).toBe(1 + toolSlugs.length);

      const homeEntry = sitemap.find((entry) => entry.url === SITE_CONFIG.url);
      expect(homeEntry).toBeDefined();
      expect(homeEntry?.priority).toBe(1.0);
      expect(homeEntry?.changeFrequency).toBe('daily');

      // Check all tools are present in sitemap
      for (const slug of toolSlugs) {
        const toolEntry = sitemap.find((entry) => entry.url === `${SITE_CONFIG.url}${slug}`);
        expect(toolEntry).toBeDefined();
        expect(toolEntry?.priority).toBeGreaterThanOrEqual(0.7);
        expect(toolEntry?.lastModified).toBeInstanceOf(Date);
      }
    });
  });

  describe('getRobotsConfig', () => {
    it('generates robots.txt rules allowing Googlebot, Bingbot, and all crawlers', () => {
      const robots = getRobotsConfig();
      expect(robots.sitemap).toBe(`${SITE_CONFIG.url}/sitemap.xml`);
      expect(robots.rules.length).toBeGreaterThanOrEqual(3);

      const allCrawlers = robots.rules.find((r) => r.userAgent === '*');
      expect(allCrawlers).toBeDefined();
      expect(allCrawlers?.allow).toBe('/');
      expect(allCrawlers?.disallow).toContain('/api/');

      const googlebot = robots.rules.find((r) => r.userAgent === 'Googlebot');
      expect(googlebot).toBeDefined();
      expect(googlebot?.allow).toBe('/');

      const bingbot = robots.rules.find((r) => r.userAgent === 'Bingbot');
      expect(bingbot).toBeDefined();
      expect(bingbot?.allow).toBe('/');
    });
  });

  describe('Structured Data (JSON-LD)', () => {
    it('generates valid WebSite schema', () => {
      const website = getJsonLdWebsite();
      expect(website['@context']).toBe('https://schema.org');
      expect(website['@type']).toBe('WebSite');
      expect(website.name).toBe('DevTools Suite');
      expect(website.potentialAction['@type']).toBe('SearchAction');
    });

    it('generates valid WebApplication schema with tool features', () => {
      const app = getJsonLdWebApplication();
      expect(app['@context']).toBe('https://schema.org');
      expect(app['@type']).toBe('WebApplication');
      expect(app.applicationCategory).toBe('DeveloperApplication');
      expect(app.offers.price).toBe('0');
      expect(app.featureList.length).toBe(Object.keys(TOOLS_SEO).length);
    });
  });
});

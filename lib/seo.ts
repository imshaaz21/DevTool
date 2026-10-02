import type { Metadata, MetadataRoute } from 'next';

function resolveSiteUrl(): string {
  const customUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (customUrl) {
    return customUrl.replace(/\/+$/, '');
  }
  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProdUrl) {
    return `https://${vercelProdUrl}`.replace(/\/+$/, '');
  }
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`.replace(/\/+$/, '');
  }
  return 'https://devtools-suite.vercel.app';
}

export const SITE_CONFIG = {
  name: 'DevTools Suite',
  shortName: 'DevTools',
  title: 'DevTools Suite - Free Online Developer Utilities & Tools',
  description:
    'Free, fast, client-side online developer tools. Features JSON Diff, Formatter, JWT Decoder, PKCE Generator, UUID Generator, Base64 Viewer, SQL Date Filter, Saudi ID Generator, Case Converter, and more.',
  url: resolveSiteUrl(),
  keywords: [
    'developer tools',
    'dev tools online',
    'json diff',
    'semantic json diff',
    'json formatter',
    'jwt decoder',
    'jwt token parser',
    'pkce generator',
    'code verifier',
    'code challenge',
    'uuid generator v4',
    'base64 encoder decoder',
    'base64 image viewer',
    'base64 pdf viewer',
    'sql date filter generator',
    'saudi national id generator',
    'iqama fake data generator',
    'case converter camelcase snake_case',
    'hex color picker contrast checker',
    'liquibase checksum calculator',
    'timezone converter utc ast ist',
    'client side developer tools',
    'online engineering utilities',
  ],
};

export interface ToolSeoInfo {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  priority: number;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
}

export const TOOLS_SEO: Record<string, ToolSeoInfo> = {
  '/jwt-decoder': {
    path: '/jwt-decoder',
    title: 'JWT Decoder & Token Claims Inspector',
    description:
      'Free online JWT decoder. Inspect header algorithms, payload claims, expiration timestamps, and Keycloak roles with or without Bearer prefix directly in your browser.',
    keywords: [
      'jwt decoder',
      'decode jwt',
      'jwt token parser',
      'bearer token decode',
      'jwt claims inspector',
      'keycloak jwt roles',
      'online jwt tool',
      'jwt expiration check',
    ],
    priority: 0.9,
    changeFrequency: 'weekly',
  },
  '/json-diff-v2': {
    path: '/json-diff-v2',
    title: 'Semantic JSON Diff & Comparison Tool',
    description:
      'Compare two JSON documents semantically. Detect added, missing, and modified keys or type changes regardless of key ordering. Fast and private client-side JSON diffing.',
    keywords: [
      'json diff',
      'semantic json diff',
      'jsondiff',
      'compare json online',
      'json comparator',
      'json difference checker',
      'json key ordering diff',
    ],
    priority: 0.9,
    changeFrequency: 'weekly',
  },
  '/json-formatter': {
    path: '/json-formatter',
    title: 'JSON Formatter, Validator & Minifier',
    description:
      'Format, beautify, validate, and minify JSON payloads online. Supports recursive unescaping of stringified JSON strings and instant syntax highlighting.',
    keywords: [
      'json formatter',
      'json beautifier',
      'json validator',
      'json minifier',
      'unescape json',
      'stringified json parser',
      'format json online',
      'json pretty print',
    ],
    priority: 0.9,
    changeFrequency: 'weekly',
  },
  '/uuid-generator': {
    path: '/uuid-generator',
    title: 'UUID / GUID Generator (v4)',
    description:
      'Free online bulk RFC-4122 UUID v4 generator. Generate random unique identifiers, copy with one click, choose uppercase or lowercase and batch sizes.',
    keywords: [
      'uuid generator',
      'guid generator',
      'uuid v4',
      'random uuid',
      'bulk uuid generator',
      'rfc 4122',
      'unique id generator',
      'batch uuid',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/pkce-generator': {
    path: '/pkce-generator',
    title: 'OAuth PKCE Code Verifier & Challenge Generator',
    description:
      'Generate RFC 7636 compliant OAuth 2.0 PKCE code_verifier and SHA-256 code_challenge (S256 / plain). Validate existing verifiers and challenge pairs.',
    keywords: [
      'pkce generator',
      'oauth pkce',
      'code verifier',
      'code challenge',
      's256 generator',
      'sha256 base64url',
      'oauth2 pkce validator',
      'rfc 7636',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/encoder-decoder': {
    path: '/encoder-decoder',
    title: 'Base64 & Hash Encoder / Decoder (MD5, SHA-256, SHA-512)',
    description:
      'Encode and decode text to Base64, URL encoding, or compute cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) directly in your browser.',
    keywords: [
      'base64 encoder',
      'base64 decoder',
      'hash generator',
      'sha256 hash online',
      'md5 hash online',
      'sha512 generator',
      'text encoder',
      'hash checksum',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/case-converter': {
    path: '/case-converter',
    title: 'Text & Programming Case Converter',
    description:
      'Convert text between camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, and slug formats. Batch process lines and remove spaces.',
    keywords: [
      'case converter',
      'camelcase converter',
      'snake_case converter',
      'kebab-case',
      'constant_case',
      'pascalcase',
      'text case converter',
      'slugify',
      'batch case transform',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/color-inspector': {
    path: '/color-inspector',
    title: 'Hex Color Inspector, Converter & Contrast Checker',
    description:
      'Inspect hex color codes, preview swatches, convert to RGB, HSL, CMYK, check WCAG 2.1 AA/AAA contrast ratios, and extract color codes from code snippets.',
    keywords: [
      'color inspector',
      'hex color picker',
      'hex to rgb',
      'hex to hsl',
      'wcag contrast checker',
      'color converter',
      'css color palette',
      'extract colors from code',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/base64-viewer': {
    path: '/base64-viewer',
    title: 'Base64 Image & PDF Viewer and Decoder',
    description:
      'Decode, view, and inspect Base64-encoded PNG, JPEG, SVG, GIF images and PDF documents. Download original files and check file metadata client-side.',
    keywords: [
      'base64 image viewer',
      'base64 pdf viewer',
      'decode base64 image',
      'preview base64 png',
      'base64 data uri viewer',
      'base64 to pdf',
      'download base64 file',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/html-viewer': {
    path: '/html-viewer',
    title: 'HTML Sandbox & Live Responsive Viewer',
    description:
      'Live HTML sandbox and code viewer with responsive Desktop, Tablet, and Mobile viewport emulation and real-time preview.',
    keywords: [
      'html viewer',
      'html sandbox',
      'html preview online',
      'responsive html viewer',
      'mobile preview html',
      'live html editor',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/sql-date-filter': {
    path: '/sql-date-filter',
    title: 'SQL Date & Timestamp Range Filter Generator',
    description:
      'Generate exact SQL WHERE clause date and timestamp filters for Oracle (TO_DATE, TO_TIMESTAMP) and PostgreSQL with BETWEEN, >=, <=, and dynamic presets.',
    keywords: [
      'sql date filter',
      'oracle to_date',
      'oracle to_timestamp',
      'postgresql timestamp where clause',
      'sql date range generator',
      'sql between date',
      'sql timestamp query',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/saudi-data-generator': {
    path: '/saudi-data-generator',
    title: 'Saudi Fake Data & National ID / Iqama Generator',
    description:
      'Generate realistic mock Saudi individual profiles with Luhn checksum-validated National IDs, Iqama numbers, Saudi phone numbers, and localized names.',
    keywords: [
      'saudi national id generator',
      'iqama generator',
      'saudi fake data',
      'saudi mock data',
      'luhn checksum saudi id',
      'saudi arabia test data',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/list-compare': {
    path: '/list-compare',
    title: 'List Comparison, Deduplication & SQL IN Formatter',
    description:
      'Compare two lists (A ∩ B, A - B, B - A), find differences, deduplicate items, and format items for SQL IN clauses with single or double quotes.',
    keywords: [
      'list compare',
      'compare two lists',
      'diff lists',
      'deduplicate list',
      'sql in clause formatter',
      'comma separated quotes',
      'list intersection',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/json-path-aggregator': {
    path: '/json-path-aggregator',
    title: 'JSON Path, Wildcard Filter & Aggregator',
    description:
      'Query JSON using JSONPath patterns and wildcards. Calculate sum, average, min, max, count, and extract array subsets instantly in your browser.',
    keywords: [
      'jsonpath',
      'json sum',
      'json aggregator',
      'json path filter',
      'json calculator',
      'extract json array',
      'json wildcard search',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/json-comparison': {
    path: '/json-comparison',
    title: 'JSON Side-by-Side Visual Comparison Tool',
    description:
      'Compare two JSON structures with side-by-side visual diffing, line highlighting, and syntax validation.',
    keywords: [
      'json comparison',
      'visual json diff',
      'compare json files',
      'side by side json diff',
      'json diff viewer',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
  '/json-comparator': {
    path: '/json-comparator',
    title: 'Feature Toggle Diff & Config Comparator',
    description:
      'Compare configValue.release toggle flags and configuration settings between Ops, Staging, and Release environments.',
    keywords: [
      'feature toggle diff',
      'config diff',
      'environment config comparator',
      'toggle flags diff',
      'release config compare',
    ],
    priority: 0.7,
    changeFrequency: 'weekly',
  },
  '/liquibase-checksum': {
    path: '/liquibase-checksum',
    title: 'Liquibase Checksum Calculator & Validator',
    description:
      'Compute Liquibase v9 checksums for <sql> changesets and verify them against DATABASECHANGELOG md5sum values.',
    keywords: [
      'liquibase checksum',
      'liquibase md5sum',
      'databasechangelog checksum calculator',
      'liquibase changeset validator',
      'liquibase v9 checksum',
    ],
    priority: 0.7,
    changeFrequency: 'weekly',
  },
  '/screen-permission-decode': {
    path: '/screen-permission-decode',
    title: 'Gzip Base64 Screen Permission Decoder',
    description:
      'Decompress and decode Gzip-compressed Base64 permission payloads with automatic JSON structure detection.',
    keywords: [
      'gzip base64 decoder',
      'screen permission decode',
      'decompress gzip base64',
      'base64 gzip json',
      'gzip decompress online',
    ],
    priority: 0.7,
    changeFrequency: 'weekly',
  },
  '/timezone-converter': {
    path: '/timezone-converter',
    title: 'Time Zone Converter (UTC, AST, IST)',
    description:
      'Convert timestamps between UTC, Saudi Arabia Standard Time (AST), and Sri Lanka / India Standard Time (IST) with live timezone offsets.',
    keywords: [
      'timezone converter',
      'utc to ast',
      'utc to ist',
      'saudi time converter',
      'time difference calculator',
      'world clock converter',
    ],
    priority: 0.8,
    changeFrequency: 'weekly',
  },
};

export function getSiteUrl(): string {
  return SITE_CONFIG.url;
}

export function createToolMetadata(slug: string): Metadata {
  const tool = TOOLS_SEO[slug];
  if (!tool) {
    return {
      title: SITE_CONFIG.title,
      description: SITE_CONFIG.description,
    };
  }

  const canonicalUrl = `${SITE_CONFIG.url}${tool.path}`;

  return {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${tool.title} | ${SITE_CONFIG.name}`,
      description: tool.description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${tool.title} | ${SITE_CONFIG.name}`,
      description: tool.description,
    },
  };
}

export function generateSitemapEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_CONFIG.url,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  for (const tool of Object.values(TOOLS_SEO)) {
    entries.push({
      url: `${SITE_CONFIG.url}${tool.path}`,
      lastModified: now,
      changeFrequency: tool.changeFrequency,
      priority: tool.priority,
    });
  }

  return entries;
}

export function getRobotsConfig() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/health'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/health'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/health'],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}

export function getJsonLdWebsite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.shortName,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getJsonLdWebApplication() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: SITE_CONFIG.description,
    featureList: Object.values(TOOLS_SEO).map((t) => t.title),
  };
}

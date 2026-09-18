/**
 * Utilities for formatting, minifying, analyzing, and previewing HTML documents.
 */

export interface HtmlDocumentStats {
  sizeInBytes: number;
  characterCount: number;
  tagCount: number;
  scriptCount: number;
  styleCount: number;
  imageCount: number;
  linkCount: number;
  isFullDocument: boolean;
}

/**
 * Calculates metrics and statistics from raw HTML code.
 */
export function getHtmlStats(html: string): HtmlDocumentStats {
  const trimmed = html.trim();
  const characterCount = trimmed.length;
  const sizeInBytes = new Blob([trimmed]).size;

  const tagMatches = trimmed.match(/<([a-z0-9-]+)(\s+[^>]*)?>/gi);
  const tagCount = tagMatches ? tagMatches.length : 0;

  const scriptMatches = trimmed.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi);
  const scriptCount = scriptMatches ? scriptMatches.length : 0;

  const styleMatches = trimmed.match(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi);
  const styleCount = styleMatches ? styleMatches.length : 0;

  const imageMatches = trimmed.match(/<img\b[^>]*>/gi);
  const imageCount = imageMatches ? imageMatches.length : 0;

  const linkMatches = trimmed.match(/<a\b[^>]*>/gi);
  const linkCount = linkMatches ? linkMatches.length : 0;

  const isFullDocument = /<!doctype\s+html|<html[\s>]/i.test(trimmed);

  return {
    sizeInBytes,
    characterCount,
    tagCount,
    scriptCount,
    styleCount,
    imageCount,
    linkCount,
    isFullDocument,
  };
}

/**
 * Formats HTML code with consistent indentation.
 */
export function formatHtml(html: string, indent: string = '  '): string {
  if (!html.trim()) return '';

  let formatted = '';
  let indentLevel = 0;

  // Normalize spaces around tags
  const tokens = html
    .replace(/>\s*</g, '>\n<')
    .replace(/(<[^\/>]+>)([^<]+)(<\/[^>]+>)/g, '$1\n$2\n$3')
    .split('\n');

  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
  ]);

  for (const rawLine of tokens) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check if closing tag
    if (/^<\/[a-z0-9-]+>/i.test(line)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted += indent.repeat(indentLevel) + line + '\n';

    // Check if opening tag that is not void and not self-closing
    const openTagMatch = line.match(/^<([a-z0-9!]+)(\s+[^>]*)?>/i);
    if (openTagMatch) {
      const tagName = openTagMatch[1].toLowerCase();
      const isVoid = voidElements.has(tagName) || line.endsWith('/>') || line.startsWith('<!--');
      const hasClosingInSameLine = line.includes(`</${tagName}>`);

      if (!isVoid && !hasClosingInSameLine) {
        indentLevel++;
      }
    }
  }

  return formatted.trim();
}

/**
 * Minifies HTML by stripping unnecessary whitespace and comments.
 */
export function minifyHtml(html: string): string {
  if (!html.trim()) return '';

  return html
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove whitespace before tag close >
    .replace(/\s+>/g, '>')
    // Collapse whitespace between tags
    .replace(/>\s+</g, '><')
    // Collapse internal whitespace
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Sample HTML templates for rapid testing.
 */
export const SAMPLE_HTML_TEMPLATES = [
  {
    id: 'product-card',
    name: 'Modern Product Showcase',
    description: 'Responsive product showcase card with Tailwind CSS, ratings & interactive buttons',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Workstation Pro</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6 font-sans antialiased">
  <div class="max-w-md w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
    <div class="flex items-center justify-between mb-4">
      <span class="px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 rounded-full">
        In Stock · Ships Worldwide
      </span>
      <span class="text-xs text-slate-400 font-mono">SKU: DEV-9942</span>
    </div>

    <h2 class="text-2xl font-bold tracking-tight text-white mb-2">
      Antigravity Edge Node
    </h2>
    <p class="text-sm text-slate-300 mb-6 leading-relaxed">
      High-throughput edge computing server built with NVMe storage, dual 10Gbps SFP+ network interfaces, and silent active cooling.
    </p>

    <div class="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
      <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
        <span class="text-slate-400 block text-[11px]">Cores</span>
        <span class="text-base font-bold text-white">32 Cores / 64T</span>
      </div>
      <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
        <span class="text-slate-400 block text-[11px]">RAM</span>
        <span class="text-base font-bold text-white">128 GB ECC</span>
      </div>
    </div>

    <div class="flex items-center justify-between pt-4 border-t border-slate-700/50">
      <div>
        <span class="text-xs text-slate-400 block">Price</span>
        <span class="text-2xl font-black text-emerald-400 font-mono">$1,899.00</span>
      </div>
      <button class="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all active:scale-95 text-sm cursor-pointer">
        Deploy Now →
      </button>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'dashboard-table',
    name: 'Interactive Dashboard Table',
    description: 'Clean administrative table with search, status badges and KPIs',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Transactions Monitor</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-100 p-8 font-sans">
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div>
        <h1 class="text-xl font-bold text-white">Production Gateway Monitor</h1>
        <p class="text-xs text-zinc-400 mt-1">Real-time settlement claims and claim line items</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-xs font-mono text-emerald-400 font-semibold">ALL SYSTEMS NOMINAL</span>
      </div>
    </div>

    <div class="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
      <table class="w-full text-left text-xs font-mono">
        <thead class="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
          <tr>
            <th class="py-3 px-4">Claim ID</th>
            <th class="py-3 px-4">Provider</th>
            <th class="py-3 px-4">Amount</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800 text-zinc-300">
          <tr class="hover:bg-zinc-800/40 transition-colors">
            <td class="py-3 px-4 font-semibold text-white">CLM-S2026-9901</td>
            <td class="py-3 px-4">Riyadh Specialized Hospital</td>
            <td class="py-3 px-4 text-emerald-400 font-bold">$325.60</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">Approved</span>
            </td>
            <td class="py-3 px-4 text-right text-indigo-400 hover:underline cursor-pointer">Inspect</td>
          </tr>
          <tr class="hover:bg-zinc-800/40 transition-colors">
            <td class="py-3 px-4 font-semibold text-white">CLM-S2026-9902</td>
            <td class="py-3 px-4">Jeddah Medical Complex</td>
            <td class="py-3 px-4 text-emerald-400 font-bold">$1,240.00</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">Pending Review</span>
            </td>
            <td class="py-3 px-4 text-right text-indigo-400 hover:underline cursor-pointer">Inspect</td>
          </tr>
          <tr class="hover:bg-zinc-800/40 transition-colors">
            <td class="py-3 px-4 font-semibold text-white">CLM-S2026-9903</td>
            <td class="py-3 px-4">Eastern Province Clinic</td>
            <td class="py-3 px-4 text-emerald-400 font-bold">$84.50</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">Approved</span>
            </td>
            <td class="py-3 px-4 text-right text-indigo-400 hover:underline cursor-pointer">Inspect</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'email-newsletter',
    name: 'Transactional Email Template',
    description: 'Standard responsive email layout compatible with desktop & mobile clients',
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Weekly Release Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { background: #09090b; color: #ffffff; padding: 24px 32px; }
    .content { padding: 32px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 10px; background: #ecfdf5; color: #059669; font-size: 12px; font-weight: 600; border-radius: 9999px; }
    .btn { display: inline-block; padding: 12px 24px; background: #09090b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { padding: 20px 32px; background: #fafafa; font-size: 12px; color: #71717a; border-top: 1px solid #f4f4f5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0; font-size: 20px;">DevTools Suite v2.0</h2>
    </div>
    <div class="content">
      <span class="badge">Feature Release</span>
      <h3 style="margin: 12px 0 8px;">New Base64 PDF & HTML Viewer Released</h3>
      <p style="color: #52525b; font-size: 14px;">
        We have added full PDF decoding for Base64 streams and an interactive HTML Viewer sandbox with multi-device previews (Desktop, Tablet, Mobile).
      </p>
      <a href="https://devtools.internal" class="btn">Launch DevTools Suite</a>
    </div>
    <div class="footer">
      © 2026 DevTools Engineering Team. All rights reserved.
    </div>
  </div>
</body>
</html>`,
  },
];

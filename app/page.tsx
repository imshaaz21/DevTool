'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import {
  Database,
  Diff,
  Binary,
  FileJson,
  Image as ImageIcon,
  Fingerprint,
  Globe,
  ShieldCheck,
  Search,
  ArrowRight,
  GitCompare
} from 'lucide-react';

interface Tool {
  title: string;
  desc: string;
  href: string;
  category: 'Data & Security' | 'JSON & Diff' | 'Encoders' | 'Utilities';
  icon: any;
  tags: string[];
}

const TOOLS: Tool[] = [
  {
    title: 'Saudi Fake Data',
    desc: 'Generate mock individual profiles with valid Saudi National ID, Iqama checksums, and localized formats.',
    href: '/saudi-data-generator',
    category: 'Data & Security',
    icon: Database,
    tags: ['saudi', 'national id', 'iqama', 'fake data', 'generator', 'mock']
  },
  {
    title: 'Feature Toggle Diff',
    desc: 'Compare configValue.release toggle flags between Ops, Staging, and Release environments.',
    href: '/json-comparator',
    category: 'JSON & Diff',
    icon: Diff,
    tags: ['toggle', 'diff', 'feature flags', 'release', 'comparator']
  },
  {
    title: 'JSON Comparison',
    desc: 'Structural side-by-side visual diff viewer highlighting mismatched keys and values between two JSON payloads.',
    href: '/json-comparison',
    category: 'JSON & Diff',
    icon: Binary,
    tags: ['json', 'diff', 'compare', 'viewer', 'syntax']
  },
  {
    title: 'JSON Diff v2',
    desc: 'Semantic JSON comparison tool matching jsondiff.com — compares values, types, and properties independent of key ordering.',
    href: '/json-diff-v2',
    category: 'JSON & Diff',
    icon: Binary,
    tags: ['json', 'diff', 'semantic', 'compare', 'jsondiff', 'jdd', 'types', 'missing']
  },
  {
    title: 'List Compare & Formatter',
    desc: 'Compare two lists (common, unique to A, unique to B), deduplicate, and format with single or double quotes for SQL and code.',
    href: '/list-compare',
    category: 'JSON & Diff',
    icon: GitCompare,
    tags: ['list', 'compare', 'diff', 'set', 'intersection', 'comma separated', 'single quote', 'double quote', 'sql in']
  },
  {
    title: 'JSON Formatter',
    desc: 'Beautify, parse recursively stringified JSON strings, or minify payloads for production APIs.',
    href: '/json-formatter',
    category: 'JSON & Diff',
    icon: FileJson,
    tags: ['json', 'beautify', 'format', 'minify', 'unescape', 'stringified']
  },
  {
    title: 'Screen Permission Decode',
    desc: 'Decompress and compress Gzip Base64 screen permission payloads with automatic JSON structure detection.',
    href: '/screen-permission-decode',
    category: 'Data & Security',
    icon: ShieldCheck,
    tags: ['screen', 'permission', 'gzip', 'base64', 'decompress', 'compress']
  },
  {
    title: 'Base64 Image Viewer',
    desc: 'Decode, preview, inspect dimensions and download images from Base64 encoded strings or data URIs.',
    href: '/base64-viewer',
    category: 'Utilities',
    icon: ImageIcon,
    tags: ['base64', 'image', 'preview', 'decode', 'data uri', 'png']
  },
  {
    title: 'UUID Generator',
    desc: 'Bulk generate RFC-4122 compliant Version 4 (random) UUIDs with instant copy and range selection.',
    href: '/uuid-generator',
    category: 'Utilities',
    icon: Fingerprint,
    tags: ['uuid', 'guid', 'v4', 'random', 'generator', 'tokens']
  },
  {
    title: 'Encoder / Decoder',
    desc: 'Convert text to/from Base64 or compute cryptographic checksums (MD5, SHA-1, SHA-256, SHA-512).',
    href: '/encoder-decoder',
    category: 'Encoders',
    icon: Binary,
    tags: ['base64', 'encode', 'decode', 'hash', 'sha256', 'md5', 'sha512']
  },
  {
    title: 'Time Zone Converter',
    desc: 'Convert timestamps between UTC, Saudi Arabia (AST), and Sri Lanka (IST) with live offset calculation.',
    href: '/timezone-converter',
    category: 'Utilities',
    icon: Globe,
    tags: ['time', 'timezone', 'utc', 'ast', 'ist', 'clock', 'date']
  },
];

const CATEGORIES = ['All', 'Data & Security', 'JSON & Diff', 'Encoders', 'Utilities'] as const;

export default function Home() {
  const { width } = useSidebar();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');

  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        tool.title.toLowerCase().includes(q) ||
        tool.desc.toLowerCase().includes(q) ||
        tool.tags.some(tag => tag.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  return (
    <div className="flex bg-[#fafafa] dark:bg-[#09090b] min-h-screen text-neutral-900 dark:text-neutral-100">
      <Sidebar />

      <main
        className="flex-1 p-6 md:p-10 transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Developer Utilities
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Internal engineering suite for data generation, JSON diffing, cryptography, and formatting.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-500 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {TOOLS.length} utilities ready
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search utilities by name or keyword..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Grid */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex flex-col justify-between p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#111113] hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-900 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center border border-neutral-200/60 dark:border-neutral-700/60 group-hover:bg-neutral-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-neutral-950 transition-colors">
                          <Icon size={16} strokeWidth={1.8} />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/60 px-2 py-0.5 rounded border border-neutral-100 dark:border-neutral-800">
                          {tool.category}
                        </span>
                      </div>

                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                        {tool.title}
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500 font-medium group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                      <span>Open tool</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/30">
              <p className="text-xs text-neutral-500">No utilities match &ldquo;{search}&rdquo;</p>
              <button
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                className="mt-2 text-xs font-medium text-neutral-900 dark:text-neutral-100 underline hover:no-underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

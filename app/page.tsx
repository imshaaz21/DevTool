'use client';

import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';

export default function Home() {
  const { width } = useSidebar();

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Sidebar />

      {/* Main content */}
      <main 
        className="flex-1 p-8 transition-all duration-300"
        style={{ marginLeft: width }}
      >
        <div className="max-w-6xl mx-auto">
          <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              DevTools <span className="text-indigo-600">Suite</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Internal utility hub for Saudi and global developer workflows.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ToolCard 
              title="Saudi Fake Data" 
              desc="Generate test data for Saudi & non-Saudi individuals with valid ID/Phone formats." 
              href="/saudi-data-generator"
              color="bg-emerald-500"
            />
            <ToolCard 
              title="Feature Toggle Diff" 
              desc="Instantly compare feature toggles between operations and release environments." 
              href="/json-comparator"
              color="bg-orange-500"
            />
            <ToolCard 
              title="JSON Comparison" 
              desc="Professional side-by-side diff viewer for any two JSON objects." 
              href="/json-comparison"
              color="bg-blue-500"
            />
            <ToolCard 
              title="Base64 Image" 
              desc="Decode and preview Base64 encoded images with instant rendering." 
              href="/base64-viewer"
              color="bg-pink-500"
            />
            <ToolCard 
              title="JSON Formatter" 
              desc="Full-screen parser for stringified, nested, or messy JSON data." 
              href="/json-formatter"
              color="bg-indigo-500"
            />
            <ToolCard 
              title="Encoder/Decoder" 
              desc="Instant Base64 & Hash generation (MD5, SHA-256) with auto-convert." 
              href="/encoder-decoder"
              color="bg-violet-500"
            />
            <ToolCard 
              title="UUID Generator" 
              desc="Bulk generate Version 4 UUIDs for your databases and API tests." 
              href="/uuid-generator"
              color="bg-cyan-500"
            />
            <ToolCard 
              title="Time Zone Converter" 
              desc="Convert between UTC, Saudi Arabia (AST), and Sri Lanka (IST)." 
              href="/timezone-converter"
              color="bg-amber-500"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function ToolCard({ title, desc, href, color }: { title: string, desc: string, href: string, color: string }) {
  return (
    <Link href={href} className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-10 h-1 rounded-full ${color} mb-4 group-hover:w-20 transition-all duration-500`}></div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed flex-grow">{desc}</p>
      <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
        Open Tool
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
      </div>
    </Link>
  );
}

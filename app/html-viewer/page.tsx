'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import {
  formatHtml,
  minifyHtml,
  getHtmlStats,
  LOREM_DUMMY_HTML,
} from '@/lib/htmlViewer';
import {
  Code2,
  Eye,
  Columns,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  Check,
  Trash2,
  Download,
  ExternalLink,
  Sparkles,
  Upload,
  RefreshCw,
  Wand2,
  FileCode,
  Laptop,
} from 'lucide-react';

type ViewportMode = 'desktop' | 'laptop' | 'tablet' | 'mobile';
type ViewLayout = 'split' | 'preview' | 'code';

export default function HtmlViewerPage() {
  const { isCollapsed } = useSidebar();

  const [htmlContent, setHtmlContent] = useState<string>(LOREM_DUMMY_HTML);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [layout, setLayout] = useState<ViewLayout>('split');
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document statistics
  const stats = useMemo(() => {
    return getHtmlStats(htmlContent);
  }, [htmlContent]);

  // Copy helper
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [htmlContent]);

  // Format HTML
  const handleFormat = useCallback(() => {
    if (!htmlContent.trim()) return;
    const formatted = formatHtml(htmlContent);
    setHtmlContent(formatted);
    toast.success('HTML formatted');
  }, [htmlContent]);

  // Minify HTML
  const handleMinify = useCallback(() => {
    if (!htmlContent.trim()) return;
    const minified = minifyHtml(htmlContent);
    setHtmlContent(minified);
    toast.success('HTML minified');
  }, [htmlContent]);

  // Download HTML file
  const handleDownload = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded');
  }, [htmlContent]);

  // Open in new tab
  const handleOpenNewTab = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [htmlContent]);

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Clear all
  const handleClear = useCallback(() => {
    setHtmlContent('');
  }, []);

  // Viewport widths
  const viewportWidthClass = useMemo(() => {
    switch (viewportMode) {
      case 'laptop':
        return 'max-w-[1024px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'mobile':
        return 'max-w-[375px]';
      case 'desktop':
      default:
        return 'w-full';
    }
  }, [viewportMode]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={Code2}
          title="HTML Viewer & Sandbox"
          description="Live preview HTML, test responsive viewports (Desktop, Tablet, Mobile), format or minify markup."
          badge="Live HTML Preview"
        >
          <button
            onClick={() => setHtmlContent(LOREM_DUMMY_HTML)}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0"
            title="Load sample Lorem Ipsum HTML"
          >
            <Sparkles size={13} />
            <span>Sample HTML</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0"
            title="Upload HTML file from disk"
          >
            <Upload size={13} />
            <span>Upload</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".html,.htm,.txt"
            className="hidden"
          />

          <button
            onClick={handleFormat}
            disabled={!htmlContent.trim()}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0 disabled:opacity-40"
            title="Format and indent HTML"
          >
            <Wand2 size={13} />
            <span>Format</span>
          </button>

          <button
            onClick={handleClear}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
            title="Clear editor"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </PageHeader>

        {/* Toolbar & Controls Bar */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0f] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 select-none">
          {/* Left: Layout switcher */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setLayout('split')}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                layout === 'split'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="Split View (Editor & Preview)"
            >
              <Columns size={13} />
              <span>Split</span>
            </button>
            <button
              onClick={() => setLayout('preview')}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                layout === 'preview'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="Preview Only"
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setLayout('code')}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                layout === 'code'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="Code Editor Only"
            >
              <FileCode size={13} />
              <span>Code</span>
            </button>
          </div>

          {/* Center: Responsive Viewport Switcher */}
          {layout !== 'code' && (
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setViewportMode('desktop')}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                  viewportMode === 'desktop'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title="Desktop View (100% width)"
              >
                <Monitor size={13} />
                <span>100%</span>
              </button>
              <button
                onClick={() => setViewportMode('laptop')}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                  viewportMode === 'laptop'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title="Laptop View (1024px)"
              >
                <Laptop size={13} />
                <span>1024px</span>
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                  viewportMode === 'tablet'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet size={13} />
                <span>768px</span>
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                  viewportMode === 'mobile'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-100 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone size={13} />
                <span>375px</span>
              </button>
            </div>
          )}

          {/* Right: Actions (Open New Tab, Reload, Download, Copy) */}
          <div className="flex items-center gap-2">
            {layout !== 'code' && (
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Reload Preview Sandbox"
              >
                <RefreshCw size={12} />
                <span>Reload</span>
              </button>
            )}

            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Open full document in a separate browser tab"
            >
              <ExternalLink size={12} />
              <span>Open Tab</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Download index.html file"
            >
              <Download size={12} />
              <span>Download</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Copy HTML to clipboard"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 flex flex-col min-h-[580px]">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Editor Pane (Hidden in 'preview' layout) */}
            {layout !== 'preview' && (
              <div
                className={`${
                  layout === 'code' ? 'lg:col-span-12' : 'lg:col-span-5'
                } flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e11] shadow-sm overflow-hidden`}
              >
                {/* Editor Header */}
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Code2 size={13} className="text-neutral-500" />
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">
                      HTML Source
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
                    <span>{stats.tagCount} tags</span>
                    <span>{(stats.sizeInBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {/* Editor Textarea */}
                <div className="flex-1 relative flex flex-col">
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Type or paste HTML code here..."
                    className="flex-1 w-full p-4 font-mono text-xs bg-transparent border-0 resize-none focus:outline-none text-neutral-900 dark:text-neutral-100 leading-relaxed placeholder:text-neutral-400 min-h-[440px]"
                    spellCheck={false}
                  />
                </div>

                {/* Editor Footer / Quick Actions */}
                <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-900/30 flex items-center justify-between text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFormat}
                      className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline"
                    >
                      Format (Indent)
                    </button>
                    <span>·</span>
                    <button
                      onClick={handleMinify}
                      className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline"
                    >
                      Minify
                    </button>
                  </div>
                  <span>{stats.characterCount.toLocaleString()} characters</span>
                </div>
              </div>
            )}

            {/* Preview Sandbox Pane (Hidden in 'code' layout) */}
            {layout !== 'code' && (
              <div
                className={`${
                  layout === 'preview' ? 'lg:col-span-12' : 'lg:col-span-7'
                } flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e11] shadow-sm overflow-hidden`}
              >
                {/* Preview Header */}
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Eye size={13} className="text-emerald-500" />
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">
                      Sandbox Output
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/40">
                      Live
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                    <span>Viewport: {viewportMode}</span>
                  </div>
                </div>

                {/* Preview Viewport Container */}
                <div className="flex-1 bg-neutral-100/70 dark:bg-neutral-950/80 p-4 flex items-center justify-center overflow-auto min-h-[480px]">
                  <div
                    className={`${viewportWidthClass} h-full min-h-[460px] flex flex-col bg-white rounded-lg shadow-md border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-all duration-200`}
                  >
                    <iframe
                      key={reloadKey}
                      srcDoc={htmlContent}
                      title="HTML Preview Sandbox"
                      className="w-full flex-1 h-full border-0 min-h-[460px]"
                      sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                    />
                  </div>
                </div>

                {/* Preview Stats Bar */}
                <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-900/30 flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-500 gap-2">
                  <div className="flex items-center gap-4">
                    <span>Scripts: <strong className="text-neutral-700 dark:text-neutral-300">{stats.scriptCount}</strong></span>
                    <span>Styles: <strong className="text-neutral-700 dark:text-neutral-300">{stats.styleCount}</strong></span>
                    <span>Images: <strong className="text-neutral-700 dark:text-neutral-300">{stats.imageCount}</strong></span>
                    <span>Links: <strong className="text-neutral-700 dark:text-neutral-300">{stats.linkCount}</strong></span>
                  </div>
                  <span>Doc type: {stats.isFullDocument ? 'Full HTML Document' : 'HTML Fragment'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

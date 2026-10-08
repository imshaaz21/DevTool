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
  markdownToHtml,
  wrapMarkdownHtml,
  getMarkdownStats,
  SAMPLE_MARKDOWN_TEMPLATES,
} from '@/lib/markdownViewer';
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
  FileText,
  Table,
} from 'lucide-react';
import { copyTextToClipboard } from '@/lib/clipboard';

export type ViewportMode = 'desktop' | 'laptop' | 'tablet' | 'mobile';
export type ViewLayout = 'split' | 'preview' | 'code';
export type MarkupMode = 'html' | 'markdown';

export interface MarkupViewerProps {
  initialMode?: MarkupMode;
}

export function MarkupViewer({ initialMode = 'html' }: MarkupViewerProps) {
  const { isCollapsed } = useSidebar();

  const [mode, setMode] = useState<MarkupMode>(initialMode);
  const [htmlContent, setHtmlContent] = useState<string>(LOREM_DUMMY_HTML);
  const [markdownContent, setMarkdownContent] = useState<string>(
    SAMPLE_MARKDOWN_TEMPLATES[0].content
  );
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [layout, setLayout] = useState<ViewLayout>('split');
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics
  const htmlStats = useMemo(() => getHtmlStats(htmlContent), [htmlContent]);
  const markdownStats = useMemo(() => getMarkdownStats(markdownContent), [markdownContent]);

  // Compiled output for preview sandbox
  const renderedContent = useMemo(() => {
    if (mode === 'html') {
      return htmlContent;
    }
    const bodyHtml = markdownToHtml(markdownContent);
    return wrapMarkdownHtml(bodyHtml, { title: 'Markdown Preview' });
  }, [mode, htmlContent, markdownContent]);

  // Copy helper
  const handleCopy = useCallback(() => {
    const textToCopy = mode === 'html' ? htmlContent : markdownContent;
    copyTextToClipboard(textToCopy);
    setCopied(true);
    toast.success(`${mode === 'html' ? 'HTML' : 'Markdown'} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  }, [mode, htmlContent, markdownContent]);

  // Copy compiled HTML when in Markdown mode
  const handleCopyCompiledHtml = useCallback(() => {
    const bodyHtml = markdownToHtml(markdownContent);
    copyTextToClipboard(bodyHtml);
    setCopiedHtml(true);
    toast.success('Compiled HTML copied to clipboard');
    setTimeout(() => setCopiedHtml(false), 2000);
  }, [markdownContent]);

  // Format HTML
  const handleFormat = useCallback(() => {
    if (mode === 'html') {
      if (!htmlContent.trim()) return;
      const formatted = formatHtml(htmlContent);
      setHtmlContent(formatted);
      toast.success('HTML formatted');
    }
  }, [mode, htmlContent]);

  // Minify HTML
  const handleMinify = useCallback(() => {
    if (mode === 'html') {
      if (!htmlContent.trim()) return;
      const minified = minifyHtml(htmlContent);
      setHtmlContent(minified);
      toast.success('HTML minified');
    }
  }, [mode, htmlContent]);

  // Insert Markdown helper: Table
  const handleInsertTable = useCallback(() => {
    const tableSnippet = `
| Column 1 | Column 2 | Column 3 |
| :--- | :---: | ---: |
| Item A | Value 1 | 100 |
| Item B | Value 2 | 200 |
`;
    setMarkdownContent((prev) => prev.trim() + '\n' + tableSnippet);
    toast.success('Markdown table inserted');
  }, []);

  // Insert Markdown helper: Code Block
  const handleInsertCodeBlock = useCallback(() => {
    const codeSnippet = `
\`\`\`typescript
function example(): void {
  console.log("Hello from DevTools Suite!");
}
\`\`\`
`;
    setMarkdownContent((prev) => prev.trim() + '\n' + codeSnippet);
    toast.success('Code block inserted');
  }, []);

  // Download file
  const handleDownload = useCallback(() => {
    const isHtml = mode === 'html';
    const content = isHtml ? htmlContent : markdownContent;
    const filename = isHtml ? 'document.html' : 'document.md';
    const mime = isHtml ? 'text/html;charset=utf-8' : 'text/markdown;charset=utf-8';

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded`);
  }, [mode, htmlContent, markdownContent]);

  // Open in new browser tab
  const handleOpenNewTab = useCallback(() => {
    const blob = new Blob([renderedContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [renderedContent]);

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (mode === 'html') {
        setHtmlContent(content);
      } else {
        setMarkdownContent(content);
      }
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Clear all
  const handleClear = useCallback(() => {
    if (mode === 'html') {
      setHtmlContent('');
    } else {
      setMarkdownContent('');
    }
  }, [mode]);

  // Load sample content
  const handleLoadSample = useCallback(() => {
    if (mode === 'html') {
      setHtmlContent(LOREM_DUMMY_HTML);
      toast.success('Sample HTML loaded');
    } else {
      setMarkdownContent(SAMPLE_MARKDOWN_TEMPLATES[0].content);
      toast.success('Sample Markdown loaded');
    }
  }, [mode]);

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
          icon={mode === 'html' ? Code2 : FileText}
          title={mode === 'html' ? 'HTML Viewer & Sandbox' : 'Markdown Viewer & Preview'}
          description={
            mode === 'html'
              ? 'Live preview HTML, test responsive viewports (Desktop, Tablet, Mobile), format or minify markup.'
              : 'Live preview GitHub Flavored Markdown (GFM), test tables, task lists, code blocks, and export HTML.'
          }
          badge={mode === 'html' ? 'Live HTML Preview' : 'Live GFM Preview'}
        >
          {/* Mode Switcher Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-medium mr-1">
            <button
              type="button"
              onClick={() => setMode('html')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                mode === 'html'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Switch to HTML Mode"
            >
              <Code2 size={13} />
              <span>HTML</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                mode === 'markdown'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Switch to Markdown Mode"
            >
              <FileText size={13} />
              <span>Markdown</span>
            </button>
          </div>

          <button
            onClick={handleLoadSample}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0"
            title={mode === 'html' ? 'Load sample Lorem Ipsum HTML' : 'Load sample Markdown document'}
          >
            <Sparkles size={13} />
            <span>{mode === 'html' ? 'Sample HTML' : 'Sample Markdown'}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0"
            title={mode === 'html' ? 'Upload HTML file from disk' : 'Upload Markdown file from disk'}
          >
            <Upload size={13} />
            <span>Upload</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept={mode === 'html' ? '.html,.htm,.txt' : '.md,.markdown,.txt'}
            className="hidden"
          />

          {mode === 'html' && (
            <button
              onClick={handleFormat}
              disabled={!htmlContent.trim()}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0 disabled:opacity-40"
              title="Format and indent HTML"
            >
              <Wand2 size={13} />
              <span>Format</span>
            </button>
          )}

          {mode === 'markdown' && (
            <button
              onClick={handleCopyCompiledHtml}
              disabled={!markdownContent.trim()}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs shrink-0 disabled:opacity-40"
              title="Copy compiled HTML to clipboard"
            >
              {copiedHtml ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedHtml ? 'Copied HTML' : 'Copy HTML'}</span>
            </button>
          )}

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

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {layout !== 'code' && (
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Reload Sandbox Frame"
              >
                <RefreshCw size={13} />
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
              title={mode === 'html' ? 'Download document.html file' : 'Download document.md file'}
            >
              <Download size={12} />
              <span>Download</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={mode === 'html' ? 'Copy HTML to clipboard' : 'Copy Markdown to clipboard'}
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
                    {mode === 'html' ? <Code2 size={13} className="text-neutral-500" /> : <FileText size={13} className="text-neutral-500" />}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">
                      {mode === 'html' ? 'HTML Source' : 'Markdown Source'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
                    {mode === 'html' ? (
                      <>
                        <span>{htmlStats.tagCount} tags</span>
                        <span>{(htmlStats.sizeInBytes / 1024).toFixed(1)} KB</span>
                      </>
                    ) : (
                      <>
                        <span>{markdownStats.wordCount} words</span>
                        <span>{markdownStats.lineCount} lines</span>
                        <span>{markdownStats.readingTimeMinutes}m read</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Editor Textarea */}
                <div className="flex-1 relative flex flex-col">
                  <textarea
                    value={mode === 'html' ? htmlContent : markdownContent}
                    onChange={(e) => {
                      if (mode === 'html') {
                        setHtmlContent(e.target.value);
                      } else {
                        setMarkdownContent(e.target.value);
                      }
                    }}
                    placeholder={
                      mode === 'html'
                        ? 'Type or paste HTML code here...'
                        : 'Type or paste Markdown content here (# Header, **bold**, tables, etc.)...'
                    }
                    className="flex-1 w-full min-h-[440px] p-4 text-xs font-mono bg-transparent border-0 focus:ring-0 resize-none outline-none leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                    spellCheck={false}
                  />
                </div>

                {/* Editor Footer Bar */}
                <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-900/30 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center gap-3">
                    {mode === 'html' ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleInsertTable}
                          className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline flex items-center gap-1"
                        >
                          <Table size={11} />
                          <span>Insert Table</span>
                        </button>
                        <span>·</span>
                        <button
                          onClick={handleInsertCodeBlock}
                          className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline flex items-center gap-1"
                        >
                          <Code2 size={11} />
                          <span>Insert Code</span>
                        </button>
                      </>
                    )}
                  </div>
                  <span>
                    {mode === 'html'
                      ? `${htmlStats.characterCount.toLocaleString()} characters`
                      : `${markdownStats.characterCount.toLocaleString()} characters`}
                  </span>
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
                    className={`${viewportWidthClass} h-full min-h-[460px] flex flex-col bg-white dark:bg-[#0d1117] rounded-lg shadow-md border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-all duration-200`}
                  >
                    <iframe
                      key={reloadKey}
                      srcDoc={renderedContent}
                      title="HTML Preview Sandbox"
                      className="w-full flex-1 h-full border-0 min-h-[460px]"
                      sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                    />
                  </div>
                </div>

                {/* Preview Stats Bar */}
                <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-900/30 flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-500 gap-2">
                  <div className="flex items-center gap-4">
                    {mode === 'html' ? (
                      <>
                        <span>
                          Scripts: <strong className="text-neutral-700 dark:text-neutral-300">{htmlStats.scriptCount}</strong>
                        </span>
                        <span>
                          Styles: <strong className="text-neutral-700 dark:text-neutral-300">{htmlStats.styleCount}</strong>
                        </span>
                        <span>
                          Images: <strong className="text-neutral-700 dark:text-neutral-300">{htmlStats.imageCount}</strong>
                        </span>
                        <span>
                          Links: <strong className="text-neutral-700 dark:text-neutral-300">{htmlStats.linkCount}</strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          Headings: <strong className="text-neutral-700 dark:text-neutral-300">{markdownStats.headingCount}</strong>
                        </span>
                        <span>
                          Links: <strong className="text-neutral-700 dark:text-neutral-300">{markdownStats.linkCount}</strong>
                        </span>
                        <span>
                          Render Engine: <strong className="text-neutral-700 dark:text-neutral-300">GFM</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <span>
                    Sandbox:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">Active</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

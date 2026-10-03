'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import {
  Palette,
  Copy,
  Check,
  Sparkles,
  Pipette,
  Layers,
  FileCode,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  inspectColor,
  extractHexColors,
  ColorDetails,
} from '@/lib/colorInspector';
import { useCopyFeedback } from '@/lib/clipboard';
import { onKeyActivate } from '@/lib/a11y';

const SAMPLE_HEX = '#3B82F6';
const SAMPLE_PALETTES = [
  { name: 'Tailwind Blue', hex: '#3B82F6' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Amber Orange', hex: '#F59E0B' },
  { name: 'Rose Red', hex: '#F43F5E' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Slate Dark', hex: '#1E293B' },
  { name: 'Pure White', hex: '#FFFFFF' },
];

const SAMPLE_CSS_TEXT = `/* Sample CSS Theme Palette */
:root {
  --primary-color: #3B82F6;
  --primary-hover: #2563EB;
  --secondary: #10B981;
  --accent: #F59E0B;
  --danger: #EF4444;
  --background-light: #F8FAFC;
  --background-dark: #0F172A;
  --text-muted: #64748B;
}

.button-primary {
  background-color: #3b82f6;
  color: #ffffff;
  border-color: #2563eb;
}

.alert-warning {
  background-color: #fef3c7;
  color: #92400e;
}`;

export default function ColorInspectorPage() {
  const { isCollapsed } = useSidebar();

  const [activeTab, setActiveTab] = useState<'inspector' | 'extractor'>('inspector');
  const [colorInput, setColorInput] = useState<string>(SAMPLE_HEX);
  const [extractorText, setExtractorText] = useState<string>(SAMPLE_CSS_TEXT);

  // Parse color details
  const colorDetails = useMemo<ColorDetails | null>(() => {
    return inspectColor(colorInput) || inspectColor(SAMPLE_HEX);
  }, [colorInput]);

  // Extract batch colors
  const extractedColors = useMemo(() => {
    return extractHexColors(extractorText);
  }, [extractorText]);

  // Copy helper
  const { copiedKey, handleCopy } = useCopyFeedback();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-[#070709] text-neutral-900 dark:text-neutral-100">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={Palette}
          title="Hex Color Decoder & Palette Studio"
          description="Decode hex codes, preview visual color swatches, inspect formats (HEX, RGB, HSL, CMYK), and extract colors from code."
          badge="Design & CSS"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setColorInput(SAMPLE_HEX)}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium"
              title="Reset to default color"
            >
              <Sparkles size={13} className="text-neutral-500" />
              <span>Sample</span>
            </button>
            {colorDetails && (
              <button
                onClick={() => handleCopy(colorDetails.hex, 'header_hex')}
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                title="Copy current hex code"
              >
                {copiedKey === 'header_hex' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'header_hex' ? 'Copied!' : `Copy ${colorDetails.hex}`}</span>
              </button>
            )}
          </div>
        </PageHeader>

        <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'inspector'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Pipette size={14} />
                <span>Color Inspector</span>
              </button>

              <button
                onClick={() => setActiveTab('extractor')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'extractor'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <FileCode size={14} />
                <span>Text / Code Extractor ({extractedColors.length})</span>
              </button>
            </div>

            {colorDetails && (
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-neutral-500">
                <span className="w-3 h-3 rounded-full border border-neutral-300 dark:border-neutral-700" style={{ backgroundColor: colorDetails.hex }} />
                <span>{colorDetails.hex}</span>
                <span>•</span>
                <span>{colorDetails.nearestTailwind.name}</span>
              </div>
            )}
          </div>

          {/* TAB 1: COLOR INSPECTOR */}
          {activeTab === 'inspector' && colorDetails && (
            <div className="space-y-6">
              {/* Input & Swatch Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Input Controls (Left) */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                      <span>Hex or RGB Input</span>
                      <span className="text-[11px] font-mono text-neutral-400">Accepts #3B82F6, 3B82F6, rgb(...)</span>
                    </label>

                    <div className="flex items-center gap-3">
                      {/* Native HTML Color Picker */}
                      <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-xs cursor-pointer">
                        <input
                          type="color"
                          value={colorDetails.hex}
                          onChange={(e) => setColorInput(e.target.value)}
                          className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer border-0 p-0"
                          title="Click to pick a color"
                        />
                      </div>

                      {/* Text Input */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="e.g. #3B82F6 or rgb(59, 130, 246)"
                          className="w-full text-sm font-mono p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 uppercase"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-medium text-neutral-400">Popular Colors:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {SAMPLE_PALETTES.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => setColorInput(p.hex)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors text-xs font-mono"
                          >
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: p.hex }} />
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    Nearest Tailwind CSS shade: <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{colorDetails.nearestTailwind.name}</span> ({colorDetails.nearestTailwind.hex})
                  </div>
                </div>

                {/* Big Live Swatch (Right) */}
                <div
                  className="lg:col-span-5 rounded-xl p-6 shadow-sm border border-neutral-200/60 dark:border-neutral-800 flex flex-col justify-between transition-colors min-h-[190px]"
                  style={{ backgroundColor: colorDetails.hex, color: colorDetails.contrast.recommendedText }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold opacity-80">
                      Live Color Swatch
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-black/15 dark:bg-white/15 backdrop-blur-xs font-medium">
                      {colorDetails.nearestTailwind.name}
                    </span>
                  </div>

                  <div className="space-y-1 my-4">
                    <div className="text-3xl font-mono font-bold tracking-tight">
                      {colorDetails.hex}
                    </div>
                    <div className="text-xs font-mono opacity-80">
                      {colorDetails.rgbString}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs opacity-90">
                    <span>Text on this color: <strong>{colorDetails.contrast.recommendedText === '#ffffff' ? 'White' : 'Black'}</strong></span>
                    <button
                      onClick={() => handleCopy(colorDetails.hex, 'swatch_copy')}
                      className="px-2.5 py-1 rounded bg-black/20 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/30 backdrop-blur-xs font-medium transition-colors"
                    >
                      {copiedKey === 'swatch_copy' ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Format Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'HEX', val: colorDetails.hex, key: 'f_hex' },
                  { label: 'RGB', val: colorDetails.rgbString, key: 'f_rgb' },
                  { label: 'HSL', val: colorDetails.hslString, key: 'f_hsl' },
                  { label: 'CMYK', val: colorDetails.cmykString, key: 'f_cmyk' },
                  { label: 'HEX with Alpha', val: colorDetails.hex8, key: 'f_hex8' },
                  { label: 'CSS Variable', val: colorDetails.cssVar, key: 'f_css' },
                ].map((item) => (
                  <div
                    key={item.label}
                    role="button"
                    tabIndex={0}
                    onKeyDown={onKeyActivate(() => handleCopy(item.val, item.key))}
                    onClick={() => handleCopy(item.val, item.key)}
                    className="group bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl p-3 shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {item.label}
                      </span>
                      <button
                        type="button"
                        className="text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                      >
                        {copiedKey === item.key ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>

                    <div className="font-mono text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate select-all">
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Accessibility Contrast Checker */}
              <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-neutral-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      WCAG 2.1 Contrast & Accessibility
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Luminance: {colorDetails.luminance}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* On White */}
                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white text-neutral-900 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: colorDetails.hex }} />
                        <span className="text-sm font-semibold">Contrast on White (#FFF)</span>
                      </div>
                      <div className="text-2xl font-mono font-bold">
                        {colorDetails.contrast.ratioOnWhite}:1
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-xs font-medium">
                      <span className={`px-2 py-0.5 rounded ${colorDetails.contrast.whitePassAA ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        AA Normal: {colorDetails.contrast.whitePassAA ? 'PASS' : 'FAIL'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${colorDetails.contrast.whitePassAAA ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                        AAA Normal: {colorDetails.contrast.whitePassAAA ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>

                  {/* On Black */}
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 text-white flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-neutral-700" style={{ backgroundColor: colorDetails.hex }} />
                        <span className="text-sm font-semibold">Contrast on Black (#000)</span>
                      </div>
                      <div className="text-2xl font-mono font-bold">
                        {colorDetails.contrast.ratioOnBlack}:1
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-xs font-medium">
                      <span className={`px-2 py-0.5 rounded ${colorDetails.contrast.blackPassAA ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
                        AA Normal: {colorDetails.contrast.blackPassAA ? 'PASS' : 'FAIL'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${colorDetails.contrast.blackPassAAA ? 'bg-emerald-900/60 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>
                        AAA Normal: {colorDetails.contrast.blackPassAAA ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tints & Shades Palette */}
              <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-neutral-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Generated Tints & Shades Palette (50 - 900)
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">Click any shade to copy hex</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                  {colorDetails.shades.map((shade) => (
                    <button
                      key={shade.label}
                      onClick={() => handleCopy(shade.hex, `shade_${shade.label}`)}
                      className="group flex flex-col rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:scale-105 transition-all text-left shadow-xs"
                    >
                      <div className="h-16 w-full relative flex items-center justify-center" style={{ backgroundColor: shade.hex }}>
                        {shade.isBase && (
                          <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-black/30 text-white backdrop-blur-xs">
                            Base
                          </span>
                        )}
                      </div>
                      <div className="p-2 bg-neutral-50 dark:bg-neutral-900 text-xs">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                          <span>{shade.label}</span>
                          {copiedKey === `shade_${shade.label}` && (
                            <Check size={11} className="text-emerald-500" />
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-300">
                          {shade.hex}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT / CODE EXTRACTOR */}
          {activeTab === 'extractor' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <FileCode size={14} className="text-neutral-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Paste Code, CSS, or JSON with Hex Colors
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {extractedColors.length} unique colors detected
                  </span>
                </div>

                <textarea
                  value={extractorText}
                  onChange={(e) => setExtractorText(e.target.value)}
                  placeholder="Paste CSS rules, tailwind configs, JSON tokens, or markdown with hex codes here..."
                  rows={8}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 leading-relaxed"
                />

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExtractorText('')}
                    className="text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Clear Code</span>
                  </button>
                  <button
                    onClick={() => setExtractorText(SAMPLE_CSS_TEXT)}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles size={13} />
                    <span>Load Sample CSS</span>
                  </button>
                </div>
              </div>

              {/* Extracted Swatches Grid */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Extracted Palette ({extractedColors.length})
                </div>

                {extractedColors.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl text-neutral-400 text-xs">
                    No hex colors found in the text. Paste any CSS or text with #hex codes above!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {extractedColors.map(({ hex, count, details }) => (
                      <div
                        key={hex}
                        role="button"
                        tabIndex={0}
                        onKeyDown={onKeyActivate(() => {
                          setColorInput(hex);
                          setActiveTab('inspector');
                        })}
                        onClick={() => {
                          setColorInput(hex);
                          setActiveTab('inspector');
                        }}
                        className="group bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl p-3 shadow-xs cursor-pointer transition-all flex flex-col justify-between gap-2"
                      >
                        <div
                          className="h-16 w-full rounded-lg border border-black/10 dark:border-white/10 relative flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: hex }}
                        >
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs font-bold"
                            style={{
                              backgroundColor: details.contrast.recommendedText === '#ffffff' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)',
                              color: details.contrast.recommendedText,
                            }}
                          >
                            {count}x
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                            <span>{hex}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(hex, `ext_${hex}`);
                              }}
                              className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                              title="Copy Hex"
                            >
                              {copiedKey === `ext_${hex}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            {details.nearestTailwind.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

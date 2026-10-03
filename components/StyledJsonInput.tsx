'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Upload,
  Trash2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  WrapText,
} from 'lucide-react';

export interface StyledJsonInputProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  placeholder?: string;
  height?: string;
  readOnly?: boolean;
  allowUpload?: boolean;
  allowFormat?: boolean;
  allowMinify?: boolean;
  allowClear?: boolean;
  allowCopy?: boolean;
  error?: string | null;
  actions?: React.ReactNode;
  id?: string;
  className?: string;
}

interface SyntaxValidation {
  isValid: boolean;
  isEmpty: boolean;
  itemCount?: number;
  isObject?: boolean;
  isArray?: boolean;
  errorLine?: number;
  errorCol?: number;
  errorMessage?: string;
}

export function StyledJsonInput({
  value,
  onChange,
  title = 'JSON Document',
  placeholder = 'Paste or type JSON here...',
  height = '520px',
  readOnly = false,
  allowUpload = true,
  allowFormat = true,
  allowMinify = true,
  allowClear = true,
  allowCopy = true,
  error: externalError,
  actions,
  id,
  className,
}: StyledJsonInputProps) {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize scroll between textarea and line gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Cursor position tracking
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textBefore = value.substring(0, textareaRef.current.selectionStart || 0);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  // Real-time JSON validation
  const validation: SyntaxValidation = useMemo(() => {
    if (!value.trim()) {
      return { isValid: false, isEmpty: true };
    }
    try {
      const parsed = JSON.parse(value);
      const isArray = Array.isArray(parsed);
      const isObject = typeof parsed === 'object' && parsed !== null && !isArray;
      const itemCount = isArray ? parsed.length : isObject ? Object.keys(parsed).length : undefined;

      return {
        isValid: true,
        isEmpty: false,
        isArray,
        isObject,
        itemCount,
      };
    } catch (e: unknown) {
      let line = 1;
      let col = 1;
      const msg = e instanceof Error ? e.message : 'Invalid JSON';

      // Parse position from V8 / standard engine error messages
      // e.g.: "Unexpected token '}' at position 42" or "in JSON at position 120 (line 5 column 8)"
      const lineColMatch = msg.match(/line (\d+) column (\d+)/i);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        col = parseInt(lineColMatch[2], 10);
      } else {
        const posMatch = msg.match(/position (\d+)/i);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const textBefore = value.slice(0, pos);
          const lines = textBefore.split('\n');
          line = lines.length;
          col = lines[lines.length - 1].length + 1;
        }
      }

      return {
        isValid: false,
        isEmpty: false,
        errorLine: line,
        errorCol: col,
        errorMessage: msg.replace(/ in JSON at position \d+.*$/, ''),
      };
    }
  }, [value]);

  // Total lines
  const lines = useMemo(() => {
    return value.split('\n');
  }, [value]);

  // Keyboard navigation: Handle Tab and Shift+Tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart, selectionEnd } = el;

      if (e.shiftKey) {
        // Shift + Tab: remove 2 leading spaces if present
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        if (before.endsWith('  ')) {
          const nextVal = before.slice(0, -2) + after;
          onChange(nextVal);
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = Math.max(0, selectionStart - 2);
            updateCursorPosition();
          });
        }
      } else {
        // Tab: insert 2 spaces at cursor position
        const nextVal = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
        onChange(nextVal);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = selectionStart + 2;
          updateCursorPosition();
        });
      }
    }
  };

  // Format action
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore
    }
  };

  // Minify action
  const handleMinify = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed));
    } catch {
      // ignore
    }
  };

  // Copy action
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onChange(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const displayedError = externalError || (!validation.isValid && !validation.isEmpty ? validation.errorMessage : null);

  return (
    <div className={`bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden shadow-xs flex flex-col transition-all focus-within:border-neutral-400 dark:focus-within:border-neutral-600 ${className || ''}`}>
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-200 shrink-0" />
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono truncate">
            {title}
          </span>

          {/* Validation Status Badge */}
          {validation.isEmpty ? (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
              Empty
            </span>
          ) : validation.isValid ? (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 font-medium">
              <CheckCircle2 size={11} className="text-emerald-500" />
              <span>
                Valid JSON
                {validation.itemCount !== undefined ? ` (${validation.itemCount} ${validation.isArray ? 'items' : 'keys'})` : ''}
              </span>
            </span>
          ) : (
            <span
              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1 font-medium truncate max-w-[200px]"
              title={validation.errorMessage}
            >
              <AlertCircle size={11} className="text-rose-500 shrink-0" />
              <span className="truncate">
                {validation.errorLine ? `Error L${validation.errorLine}:C${validation.errorCol}` : 'Syntax Error'}
              </span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {actions}

          {allowFormat && (
            <button
              type="button"
              onClick={handleFormat}
              disabled={readOnly || !validation.isValid}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Format JSON (2 spaces)"
            >
              <FileCode2 size={13} />
              <span className="hidden sm:inline">Format</span>
            </button>
          )}

          {allowMinify && (
            <button
              type="button"
              onClick={handleMinify}
              disabled={readOnly || !validation.isValid}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Minify JSON (compact)"
            >
              <Minimize2 size={13} />
              <span className="hidden sm:inline">Minify</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setWrapLines(!wrapLines)}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
              wrapLines
                ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}
          >
            <WrapText size={13} />
            <span className="hidden sm:inline">Wrap</span>
          </button>

          {allowUpload && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={readOnly}
                className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Upload JSON file"
              >
                <Upload size={13} />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </>
          )}

          {allowCopy && (
            <button
              type="button"
              onClick={handleCopy}
              disabled={!value}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Copy JSON to clipboard"
              aria-label="Copy JSON"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          )}

          {allowClear && (
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={readOnly || !value}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Clear text"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Body with Line Numbers Gutter */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#0a0a0c]" style={{ height }}>
        {/* Left Gutter: Line Numbers */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none py-3 pl-2.5 pr-2 w-11 shrink-0 text-right font-mono text-xs leading-5 text-neutral-400/80 dark:text-neutral-600 bg-neutral-50/60 dark:bg-[#0a0a0c] border-r border-neutral-100 dark:border-neutral-900 overflow-hidden"
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isErrorLine = validation.errorLine === lineNum;
            const isCurrentLine = cursorPos.line === lineNum;

            return (
              <div
                key={lineNum}
                className={`transition-colors ${
                  isErrorLine
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : isCurrentLine
                    ? 'text-neutral-900 dark:text-neutral-200 font-semibold'
                    : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Input */}
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            updateCursorPosition();
          }}
          onScroll={handleScroll}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          className={`flex-1 p-3 font-mono text-xs leading-5 bg-transparent border-0 focus:ring-0 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 resize-none ${
            wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
          }`}
        />
      </div>

      {/* Error Message Strip */}
      {displayedError && (
        <div className="px-3.5 py-2 bg-rose-50/90 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 font-mono flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span className="break-all">{displayedError}</span>
        </div>
      )}

      {/* Footer / Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-50/50 dark:bg-neutral-900/30 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] font-mono text-neutral-400 select-none">
        <div className="flex items-center gap-3">
          <span>{lines.length} {lines.length === 1 ? 'line' : 'lines'}</span>
          <span>•</span>
          <span>{value.length.toLocaleString()} chars</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>•</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}

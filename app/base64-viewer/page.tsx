'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import {
  extractMimeType,
  createBlobUrl,
  getImageMetadata,
  formatFileSize,
  normalizeBase64,
  ImageMetadata,
} from '@/utils/base64ImageViewer';
import { ImageModal } from '@/components/ImageModal';
import { AutoToggle } from '@/components/AutoToggle';
import {
  ImageIcon,
  Upload,
  Trash2,
  Download,
  Maximize2,
  Info,
  FileImage,
  AlertCircle,
  FileText,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const SAMPLE_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABMSURBVHgB7dKxCQAgEMDA3P2ndIsU8RCGfEDjQyU512Nf/wE4gAAIIAACIIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIBAMHMAkR4E2cM3Qd8AAAAASUVORK5CYII=';

const SAMPLE_PDF_BASE64 = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNDAwIDIwMF0vQ29udGVudHMgNCAwIFI+PmVuZG9iago0IDAgb2JqPDwvTGVuZ3RoIDU1Pj5zdHJlYW0KQVQKL1YgMSBUZgovRjEgMTQgVGYKKERldlRvb2xzIFBERiBWaWV3ZXIgU3VjY2Vzc2Z1bCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj5lbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE4IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjIwIDAwMDAwIG4gCjAwMDAwMDAzMjggMDAwMDAgbiAKdHJhaWxlcjw8L1Jvb3QgMSAwIFIvU2l6ZSA2Pj4Kc3RhcnR4cmVmCjQwMAolJUVPRg==';

export default function Base64ViewerPage() {
  const { width } = useSidebar();
  const [mediaType, setMediaType] = useState<'image' | 'pdf'>('image');
  const [base64Input, setBase64Input] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [isAutoConvert, setIsAutoConvert] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const lastProcessedRef = useRef<string>('');

  const handleDecode = useCallback(async (inputBase64?: string, targetType?: 'image' | 'pdf') => {
    const activeType = targetType || mediaType;
    const raw = inputBase64 !== undefined ? inputBase64 : base64Input;
    let base64 = raw.trim();
    if (base64.startsWith('"') && base64.endsWith('"')) base64 = base64.slice(1, -1);
    if (!base64.trim()) {
      setError(activeType === 'pdf' ? 'Enter Base64 data or upload a PDF' : 'Enter Base64 data or upload an image');
      return;
    }

    lastProcessedRef.current = raw;
    setLoading(true);
    setError('');
    try {
      if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }

      let mimeType: string;
      if (activeType === 'pdf') {
        mimeType = 'application/pdf';
      } else {
        // Default is ALWAYS image
        const detected = extractMimeType(base64);
        mimeType = detected.startsWith('image/') ? detected : 'image/png';
      }

      const normalizedBase64 = normalizeBase64(base64, mimeType);
      const blobUrl = createBlobUrl(normalizedBase64, mimeType);
      currentBlobUrlRef.current = blobUrl;
      setImageUrl(blobUrl);

      if (activeType === 'pdf') {
        const base64Data = normalizedBase64.includes('base64,')
          ? normalizedBase64.split('base64,')[1]
          : normalizedBase64;
        const sizeInBytes = Math.floor((base64Data.length * 3) / 4);
        setMetadata({
          format: 'PDF',
          mimeType: 'application/pdf',
          sizeInBytes,
          isPdf: true,
        });
      } else {
        const fileMetadata = await getImageMetadata(normalizedBase64);
        setMetadata({ ...fileMetadata, isPdf: false });
      }
    } catch (err) {
      setError((err as Error).message);
      setImageUrl(null);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  }, [base64Input, mediaType]);

  useEffect(() => {
    if (!isAutoConvert) return;
    if (base64Input === lastProcessedRef.current) return;

    const timer = setTimeout(() => {
      if (base64Input.trim()) {
        handleDecode(base64Input);
      } else {
        lastProcessedRef.current = '';
        if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }
        setImageUrl(null);
        setMetadata(null);
        setError('');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [base64Input, isAutoConvert, handleDecode]);

  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  const handleMediaTypeChange = (newType: 'image' | 'pdf') => {
    setMediaType(newType);
    if (base64Input.trim()) {
      handleDecode(base64Input, newType);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!file.type.startsWith('image/') && !isPdf) {
      setError('Please select an image or PDF file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const targetMode: 'image' | 'pdf' = isPdf ? 'pdf' : 'image';
    setMediaType(targetMode);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (!base64) return;
      setBase64Input(base64);
      handleDecode(base64, targetMode);
      toast.success(isPdf ? 'PDF loaded and converted to Base64' : 'Image loaded and converted to Base64');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    const ext = metadata?.isPdf ? 'pdf' : metadata?.format.toLowerCase() || 'png';
    a.download = `decoded-file.${ext}`;
    a.click();
    toast.success(`${metadata?.isPdf ? 'PDF' : 'Image'} downloaded`);
  };

  const handleClear = () => {
    if (currentBlobUrlRef.current && currentBlobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    lastProcessedRef.current = '';
    setBase64Input('');
    setImageUrl(null);
    setMetadata(null);
    setError('');
  };

  const loadSampleImage = () => {
    setMediaType('image');
    setBase64Input(SAMPLE_IMAGE_BASE64);
    handleDecode(SAMPLE_IMAGE_BASE64, 'image');
  };

  const loadSamplePdf = () => {
    setMediaType('pdf');
    setBase64Input(SAMPLE_PDF_BASE64);
    handleDecode(SAMPLE_PDF_BASE64, 'pdf');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={ImageIcon}
          title="Base64 Image & PDF Viewer"
          description="Decode, render, inspect dimensions, and download Base64 encoded images and PDF documents."
          badge="Media & PDF Decoder"
        >
          {/* Format Mode: Default is Image, PDF only when explicitly chosen */}
          <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-0.5 text-xs shrink-0">
            <button
              type="button"
              onClick={() => handleMediaTypeChange('image')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                mediaType === 'image'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Decode as Image (Default)"
            >
              <ImageIcon size={13} />
              <span>Image</span>
            </button>
            <button
              type="button"
              onClick={() => handleMediaTypeChange('pdf')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                mediaType === 'pdf'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title="Specifically decode as PDF Document"
            >
              <FileText size={13} />
              <span>PDF</span>
            </button>
          </div>

          <button
            onClick={loadSampleImage}
            className={`btn btn-secondary btn-sm flex items-center gap-1 text-xs shrink-0 ${mediaType === 'image' ? 'font-medium' : 'opacity-80'}`}
            title="Load sample Base64 image"
          >
            <Sparkles size={12} />
            <span>Sample Image</span>
          </button>
          <button
            onClick={loadSamplePdf}
            className={`btn btn-secondary btn-sm flex items-center gap-1 text-xs shrink-0 ${mediaType === 'pdf' ? 'font-medium' : 'opacity-80'}`}
            title="Load sample Base64 PDF document"
          >
            <FileText size={12} />
            <span>Sample PDF</span>
          </button>
          <AutoToggle
            enabled={isAutoConvert}
            onChange={setIsAutoConvert}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary btn-sm flex items-center gap-1 text-xs shrink-0"
          >
            <Upload size={13} />
            <span>Upload File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept={mediaType === 'pdf' ? 'application/pdf' : 'image/*,application/pdf'}
            className="hidden"
          />
          <button
            onClick={() => handleDecode()}
            disabled={loading || !base64Input.trim()}
            className="btn btn-primary btn-sm min-w-[88px] justify-center shrink-0"
          >
            {loading ? 'Decoding...' : 'Render'}
          </button>
        </PageHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-0 overflow-hidden flex flex-col min-h-[220px]">
                  <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                      {mediaType === 'pdf' ? 'Base64 Input (PDF Document)' : 'Base64 Input (Image - Default)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-400">
                        {base64Input.length.toLocaleString()} chars
                      </span>
                      <button
                        onClick={handleClear}
                        disabled={!base64Input}
                        className="text-neutral-400 hover:text-red-500 disabled:opacity-30 p-1"
                        title="Clear input"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder={
                      mediaType === 'pdf'
                        ? 'Paste Base64 encoded PDF data here (with or without data: URI prefix)...'
                        : 'Paste Base64 encoded image data here (PNG, JPEG, WebP, GIF, SVG)...'
                    }
                    className="flex-1 p-4 bg-transparent border-0 resize-none font-mono text-xs focus:outline-none min-h-[160px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400"
                    spellCheck={false}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Canvas or PDF Viewer */}
                {imageUrl ? (
                  metadata?.isPdf ? (
                    /* PDF Document Preview */
                    <div className="card p-0 overflow-hidden flex flex-col h-[520px]">
                      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-red-500" />
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 font-mono">
                            PDF Document Preview
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm flex items-center gap-1"
                            title="Open PDF in new tab"
                          >
                            <ExternalLink size={12} />
                            <span>Open in New Tab</span>
                          </a>
                          <button
                            onClick={handleDownload}
                            className="btn btn-secondary btn-sm flex items-center gap-1"
                            title="Download PDF"
                          >
                            <Download size={12} />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 w-full bg-neutral-100 dark:bg-neutral-900 relative">
                        <iframe
                          src={imageUrl}
                          className="w-full h-full border-0"
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Image Preview */
                    <div className="card p-0 overflow-hidden">
                      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                          Image Preview Canvas
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-secondary btn-sm"
                            title="Full Screen Preview"
                          >
                            <Maximize2 size={12} />
                            <span>Expand</span>
                          </button>
                          <button
                            onClick={handleDownload}
                            className="btn btn-secondary btn-sm"
                            title="Download Image"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-6 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-950/80 min-h-[360px]">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="max-w-full max-h-[460px] object-contain rounded border border-neutral-200/80 dark:border-neutral-800 shadow-sm cursor-zoom-in"
                          onClick={() => setShowModal(true)}
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-72 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 flex flex-col items-center justify-center text-neutral-400 gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                  >
                    {mediaType === 'pdf' ? (
                      <FileText size={32} className="text-neutral-300 dark:text-neutral-700" />
                    ) : (
                      <FileImage size={32} className="text-neutral-300 dark:text-neutral-700" />
                    )}
                    <p className="text-xs font-medium text-neutral-500">
                      {mediaType === 'pdf'
                        ? 'No PDF rendered yet. Paste Base64 or click to upload PDF.'
                        : 'No image rendered yet. Paste Base64 or click to upload Image.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Metadata Panel */}
              <div className="space-y-4">
                <div className="card p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <Info size={14} className="text-neutral-500" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Document & Media Intelligence
                    </span>
                  </div>

                  {metadata ? (
                    <div className="space-y-2.5 text-xs">
                      <MetaRow label="Format" value={metadata.isPdf ? 'PDF Document' : metadata.format} />
                      {!metadata.isPdf && metadata.width && metadata.height && (
                        <>
                          <MetaRow label="Dimensions" value={`${metadata.width} × ${metadata.height} px`} />
                          <MetaRow label="Aspect Ratio" value={`${(metadata.width / metadata.height).toFixed(2)}:1`} />
                        </>
                      )}
                      {metadata.isPdf && (
                        <MetaRow label="Type" value="Paginated PDF Document" />
                      )}
                      <MetaRow label="File Size" value={formatFileSize(metadata.sizeInBytes)} />
                      <MetaRow label="MIME Type" value={metadata.mimeType} />
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 py-4 text-center italic">
                      Metadata appears when an image or PDF is decoded.
                    </p>
                  )}
                </div>

                <div className="card p-4 space-y-2 text-xs text-neutral-500">
                  <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">Supported Formats</h4>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <li><strong className="text-neutral-700 dark:text-neutral-300">PDF</strong> (<code className="font-mono">application/pdf</code>, <code className="font-mono">%PDF</code>, <code className="font-mono">JVBERi...</code>)</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">PNG</strong> (<code className="font-mono">image/png</code>)</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">JPEG / JPG</strong> (<code className="font-mono">image/jpeg</code>)</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">WebP</strong> (<code className="font-mono">image/webp</code>)</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">GIF</strong> (<code className="font-mono">image/gif</code>)</li>
                    <li><strong className="text-neutral-700 dark:text-neutral-300">SVG</strong> (<code className="font-mono">image/svg+xml</code>)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Image Modal (for images only) */}
        {imageUrl && !metadata?.isPdf && (
          <ImageModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            imageUrl={imageUrl}
            imageAlt="Decoded Image Preview"
          />
        )}
      </main>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="font-medium font-mono text-neutral-800 dark:text-neutral-200">{value}</span>
    </div>
  );
}

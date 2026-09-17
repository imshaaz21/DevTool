'use client';

import { useState, useEffect, useRef } from 'react';
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
  ImageMetadata
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
  AlertCircle
} from 'lucide-react';

export default function Base64ViewerPage() {
  const { width } = useSidebar();
  const [base64Input, setBase64Input] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [isAutoConvert, setIsAutoConvert] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAutoConvert) return;
    const timer = setTimeout(() => {
      if (base64Input.trim()) {
        handleDecode(base64Input);
      } else {
        setImageUrl(null);
        setMetadata(null);
        setError('');
      }
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base64Input, isAutoConvert]);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleDecode = async (inputBase64?: string) => {
    let base64 = inputBase64 || base64Input;
    base64 = base64.trim();
    if (base64.startsWith('"') && base64.endsWith('"')) base64 = base64.slice(1, -1);
    if (!base64.trim()) {
      setError('Enter Base64 data or upload an image');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
      const mimeType = extractMimeType(base64);
      if (!mimeType.startsWith('image/')) {
        throw new Error('Data does not appear to be a valid image');
      }
      const normalizedBase64 = normalizeBase64(base64, mimeType);
      const blobUrl = createBlobUrl(normalizedBase64, mimeType);
      setImageUrl(blobUrl);
      const imageMetadata = await getImageMetadata(normalizedBase64);
      setMetadata(imageMetadata);
    } catch (err) {
      setError((err as Error).message);
      setImageUrl(null);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setBase64Input(base64);
      handleDecode(base64);
      toast.success('Image loaded and converted to Base64');
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `decoded-image.${metadata?.format.toLowerCase() || 'png'}`;
    a.click();
    toast.success('Image downloaded');
  };

  const handleClear = () => {
    setBase64Input('');
    setImageUrl(null);
    setMetadata(null);
    setError('');
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
          title="Base64 Image Viewer"
          description="Decode, render, inspect dimensions, and download Base64 encoded images."
          badge="Image Decoder"
        >
          <AutoToggle
            enabled={isAutoConvert}
            onChange={setIsAutoConvert}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary btn-sm"
          >
            <Upload size={13} />
            <span>Upload Image</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => handleDecode()}
            disabled={loading || !base64Input.trim()}
            className="btn btn-primary"
          >
            {loading ? 'Decoding...' : 'Render Image'}
          </button>
        </PageHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Area */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-0 overflow-hidden flex flex-col min-h-[220px]">
                  <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-mono">
                      Base64 Input
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-zinc-400">
                        {base64Input.length.toLocaleString()} chars
                      </span>
                      <button
                        onClick={handleClear}
                        disabled={!base64Input}
                        className="text-zinc-400 hover:text-red-500 disabled:opacity-30 p-1"
                        title="Clear input"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder="Paste Base64 encoded image string or data:image/... URI here..."
                    className="flex-1 w-full p-4 bg-transparent text-zinc-900 dark:text-zinc-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    spellCheck={false}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Canvas */}
                {imageUrl ? (
                  <div className="card p-0 overflow-hidden">
                    <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-mono">
                        Preview Canvas
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
                    <div className="p-6 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/80 min-h-[360px]">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="max-w-full max-h-[460px] object-contain rounded border border-zinc-200/80 dark:border-zinc-800 shadow-sm cursor-zoom-in"
                        onClick={() => setShowModal(true)}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-72 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <FileImage size={32} className="text-zinc-300 dark:text-zinc-700" />
                    <p className="text-xs font-medium text-zinc-500">
                      No image rendered yet. Paste Base64 or click to upload.
                    </p>
                  </div>
                )}
              </div>

              {/* Metadata Panel */}
              <div className="space-y-4">
                <div className="card p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <Info size={14} className="text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Image Intelligence
                    </span>
                  </div>

                  {metadata ? (
                    <div className="space-y-2.5 text-xs">
                      <MetaRow label="Format" value={metadata.format} />
                      <MetaRow label="Dimensions" value={`${metadata.width} × ${metadata.height} px`} />
                      <MetaRow label="File Size" value={formatFileSize(metadata.sizeInBytes)} />
                      <MetaRow label="MIME Type" value={metadata.mimeType} />
                      <MetaRow label="Aspect Ratio" value={metadata.height ? `${(metadata.width / metadata.height).toFixed(2)}:1` : 'N/A'} />
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 py-4 text-center italic">
                      Metadata appears when an image is decoded.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ImageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        imageUrl={imageUrl}
      />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

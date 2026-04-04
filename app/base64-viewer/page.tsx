'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
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
import { ImageIcon, Upload, Trash2, Download, Maximize2, Info, FileImage } from 'lucide-react';

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
    }, 300);
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
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `decoded-image.${metadata?.format.toLowerCase() || 'png'}`;
    a.click();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main 
        className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300"
        style={{ marginLeft: width }}
      >
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
              <ImageIcon size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Base64 Image Viewer</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Render images from encoded strings instantly.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <AutoToggle 
               enabled={isAutoConvert} 
               onChange={setIsAutoConvert} 
               activeColorClass="bg-pink-600"
               activeTextClass="text-pink-500 fill-pink-500"
             />
             <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <Upload size={14} /> Upload Image
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => handleDecode()}
              disabled={loading}
              className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Decoding...' : 'Render Image'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Input Area */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[200px] flex flex-col group">
                   <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base64 Input</span>
                      <button onClick={() => setBase64Input('')} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                   </div>
                   <textarea
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    placeholder="Paste data:image/... base64 here..."
                    className="flex-1 p-6 bg-transparent text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none resize-none"
                   />
                </div>

                {imageUrl ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden group relative">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendering Canvas</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowModal(true)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-500 transition-all"><Maximize2 size={14}/></button>
                        <button onClick={handleDownload} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-pink-500 transition-all"><Download size={14}/></button>
                      </div>
                    </div>
                    <div className="p-8 flex items-center justify-center bg-slate-100 dark:bg-slate-950/50 min-h-[400px]">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="max-w-full max-h-[500px] object-contain shadow-2xl rounded-lg cursor-zoom-in" 
                        onClick={() => setShowModal(true)}
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[400px] rounded-3xl border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-full">
                      <FileImage size={48} className="opacity-20" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">Canvas is Empty</p>
                  </div>
                )}
              </div>

              {/* Metadata Area */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                    <Info size={14} className="text-pink-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Image Intelligence</span>
                  </div>
                  <div className="p-6 space-y-4">
                    {metadata ? (
                      <>
                        <MetaRow label="Format" value={metadata.format} />
                        <MetaRow label="Dimensions" value={`${metadata.width} × ${metadata.height} px`} />
                        <MetaRow label="File Size" value={formatFileSize(metadata.sizeInBytes)} />
                        <MetaRow label="Mime Type" value={metadata.mimeType} />
                        <MetaRow label="Aspect Ratio" value={(metadata.width / metadata.height).toFixed(2) + ':1'} />
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-10">No metadata available yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <Info size={18} />
                {error}
              </div>
            )}
          </div>
        </div>

        <ImageModal isOpen={showModal} onClose={() => setShowModal(false)} imageUrl={imageUrl} imageAlt="Base64 Preview" />
      </main>
    </div>
  );
}

function MetaRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-xs font-mono font-black text-slate-900 dark:text-white uppercase">{value}</span>
    </div>
  );
}

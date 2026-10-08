'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'react-hot-toast';
import {
  ImageIcon,
  Upload,
  Copy,
  Check,
  Download,
  Undo2,
  Redo2,
  Trash2,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  PenTool,
  Type,
  EyeOff,
  Crop as CropIcon,
  Sparkles,
  Info,
  ScanText,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  ToolMode,
  AnnotationItem,
  Point,
  RectBounds,
  PRESET_COLORS,
  normalizeRect,
  drawAnnotation,
  copyCanvasToClipboard,
  downloadCanvas,
  formatFileSize,
  performOcr,
  terminateOcrWorker,
  extractCanvasRegion,
} from '@/lib/image-annotator';

// Fallback sample image generator using canvas
function createSampleImage(): string {
  const fallback = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  try {
    if (typeof document === 'undefined') return fallback;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 480);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 480);

    // Mock UI Card
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.roundRect(40, 40, 720, 400, 12);
    } else if (ctx.rect) {
      ctx.rect(40, 40, 720, 400);
    }
    ctx.fill();
    ctx.stroke();

    // Header bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 40, 720, 50);

    // Mock Window dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(65, 65, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(85, 65, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(105, 65, 6, 0, Math.PI * 2);
    ctx.fill();

    // Mock text lines
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText('API Response Inspector - GET /v1/users/auth_token', 140, 70);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    ctx.fillText('{', 70, 130);
    ctx.fillText('  "status": "success",', 70, 160);
    ctx.fillText('  "apiKey": "sk_live_9948274a8b7c29304e", // Sensitive token to redact!', 70, 190);
    ctx.fillText('  "userId": "usr_9921049",', 70, 220);
    ctx.fillText('  "role": "SuperAdministrator",', 70, 250);
    ctx.fillText('  "server": "api-prod-cluster-01.internal"', 70, 280);
    ctx.fillText('}', 70, 310);

    return canvas.toDataURL('image/png');
  } catch {
    return fallback;
  }
}

export default function ImageAnnotatorPage() {
  const { isCollapsed } = useSidebar();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number; bytes: number }>({
    width: 0,
    height: 0,
    bytes: 0,
  });

  // Tool state
  const [activeTool, setActiveTool] = useState<ToolMode>('rectangle');
  const [selectedColor, setSelectedColor] = useState<string>('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [fontSize, setFontSize] = useState<number>(20);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Annotations & History
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [history, setHistory] = useState<AnnotationItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Drawing in progress
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<AnnotationItem | null>(null);

  // Crop mode state
  const [cropBox, setCropBox] = useState<RectBounds | null>(null);

  // OCR mode state
  const [ocrBox, setOcrBox] = useState<RectBounds | null>(null);
  const [ocrModalOpen, setOcrModalOpen] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [ocrResultText, setOcrResultText] = useState<string>('');

  // Text modal / prompt state
  const [textModalOpen, setTextModalOpen] = useState<boolean>(false);
  const [pendingTextPos, setPendingTextPos] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState<string>('Attention here');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Push new history state
  const pushState = useCallback((newAnnotations: AnnotationItem[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newAnnotations];
    });
    setHistoryIndex((prev) => prev + 1);
    setAnnotations(newAnnotations);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setAnnotations(history[nextIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setAnnotations(history[nextIndex]);
    }
  }, [historyIndex, history]);

  const blobSrcRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (blobSrcRef.current?.startsWith('blob:')) URL.revokeObjectURL(blobSrcRef.current);
  }, []);

  // Load image from URL or dataURL
  const loadImage = useCallback((src: string, byteSize = 0) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImageRef.current = img;
      // Drop the previous image's object URL now that the new one is decoded
      if (blobSrcRef.current?.startsWith('blob:') && blobSrcRef.current !== src) {
        URL.revokeObjectURL(blobSrcRef.current);
      }
      blobSrcRef.current = src;
      setImageSrc(src);
      setImageSize({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        bytes: byteSize,
      });
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setCropBox(null);
    };
    img.onerror = () => {
      if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      toast.error('Could not load that image');
    };
    img.src = src;
  }, []);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    loadImage(URL.createObjectURL(file), file.size);
    e.target.value = '';
  };

  // Free the shared OCR worker when leaving the page
  useEffect(() => () => void terminateOcrWorker().catch(() => {}), []);

  // Clipboard Paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            loadImage(URL.createObjectURL(file), file.size);
            toast.success('Pasted image from clipboard');
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadImage]);

  // Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(URL.createObjectURL(file), file.size);
      toast.success('Image loaded successfully');
    }
  };

  const layerRef = useRef<{
    canvas: HTMLCanvasElement;
    annotations: AnnotationItem[];
    baseImg: HTMLImageElement;
  } | null>(null);

  // Image + committed annotations only: no crop/OCR overlays or in-progress shape
  const getCleanCanvas = () => layerRef.current?.canvas ?? canvasRef.current;

  // Render loop
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const baseImg = baseImageRef.current;
    if (!canvas || !baseImg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset dimensions if needed
    if (canvas.width !== baseImg.naturalWidth || canvas.height !== baseImg.naturalHeight) {
      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
    }

    // Committed annotations (incl. pixelation, which reads pixels) are rendered once into
    // an offscreen layer and reused until they change, so mouse-move redraws stay cheap
    let layer = layerRef.current;
    if (
      !layer ||
      layer.annotations !== annotations ||
      layer.baseImg !== baseImg ||
      layer.canvas.width !== canvas.width ||
      layer.canvas.height !== canvas.height
    ) {
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = canvas.width;
      layerCanvas.height = canvas.height;
      const layerCtx = layerCanvas.getContext('2d', { willReadFrequently: true });
      if (layerCtx) {
        layerCtx.drawImage(baseImg, 0, 0);
        for (const item of annotations) {
          drawAnnotation(layerCtx, item);
        }
      }
      layer = { canvas: layerCanvas, annotations, baseImg };
      layerRef.current = layer;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layer.canvas, 0, 0);

    // Draw active annotation being drafted
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation);
    }

    // Draw crop mask if active
    if (activeTool === 'crop' && cropBox) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      // Darken outside area
      ctx.fillRect(0, 0, canvas.width, cropBox.y);
      ctx.fillRect(0, cropBox.y, cropBox.x, cropBox.height);
      ctx.fillRect(
        cropBox.x + cropBox.width,
        cropBox.y,
        canvas.width - (cropBox.x + cropBox.width),
        cropBox.height
      );
      ctx.fillRect(
        0,
        cropBox.y + cropBox.height,
        canvas.width,
        canvas.height - (cropBox.y + cropBox.height)
      );

      // Highlight crop border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
      ctx.restore();
    }

    // Draw OCR selection box if active
    if (activeTool === 'ocr' && ocrBox) {
      ctx.save();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fillRect(ocrBox.x, ocrBox.y, ocrBox.width, ocrBox.height);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(ocrBox.x, ocrBox.y, ocrBox.width, ocrBox.height);
      ctx.restore();
    }
  }, [annotations, currentAnnotation, activeTool, cropBox, ocrBox]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Canvas mouse/touch coordinate helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Pointer down
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setDrawStart(pos);

    if (activeTool === 'text') {
      setPendingTextPos(pos);
      setTextModalOpen(true);
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'pen') {
      setCurrentAnnotation({
        id: Date.now().toString(),
        tool: 'pen',
        x: pos.x,
        y: pos.y,
        points: [pos],
        color: selectedColor,
        strokeWidth,
      });
      return;
    }

    if (activeTool === 'crop') {
      setCropBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      return;
    }

    if (activeTool === 'ocr') {
      setOcrBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
      return;
    }

    // Shapes: rectangle, circle, arrow, line, pixelate
    setCurrentAnnotation({
      id: Date.now().toString(),
      tool: activeTool,
      x: pos.x,
      y: pos.y,
      endX: pos.x,
      endY: pos.y,
      width: 0,
      height: 0,
      color: selectedColor,
      strokeWidth,
    });
  };

  // Pointer move
  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;
    const pos = getCanvasCoords(e);

    if (activeTool === 'pen') {
      setCurrentAnnotation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...(prev.points || []), pos],
        };
      });
      return;
    }

    if (activeTool === 'crop') {
      const box = normalizeRect(drawStart.x, drawStart.y, pos.x, pos.y);
      setCropBox(box);
      return;
    }

    if (activeTool === 'ocr') {
      const box = normalizeRect(drawStart.x, drawStart.y, pos.x, pos.y);
      setOcrBox(box);
      return;
    }

    const norm = normalizeRect(drawStart.x, drawStart.y, pos.x, pos.y);

    if (activeTool === 'arrow' || activeTool === 'line') {
      setCurrentAnnotation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          endX: pos.x,
          endY: pos.y,
        };
      });
    } else {
      setCurrentAnnotation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          x: norm.x,
          y: norm.y,
          width: norm.width,
          height: norm.height,
        };
      });
    }
  };

  // Pointer up
  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setDrawStart(null);

    if (activeTool === 'crop' || activeTool === 'ocr') {
      // Keep selection box displayed until user confirms action
      return;
    }

    if (currentAnnotation) {
      // Don't add tiny accidental clicks
      const minDimension = 4;
      let isTiny = false;

      if (activeTool === 'arrow' || activeTool === 'line') {
        const dx = (currentAnnotation.endX ?? currentAnnotation.x) - currentAnnotation.x;
        const dy = (currentAnnotation.endY ?? currentAnnotation.y) - currentAnnotation.y;
        isTiny = Math.hypot(dx, dy) < minDimension;
      } else if (activeTool === 'pen') {
        isTiny = !currentAnnotation.points || currentAnnotation.points.length < 2;
      } else {
        isTiny =
          (currentAnnotation.width !== undefined && currentAnnotation.width < minDimension) &&
          (currentAnnotation.height !== undefined && currentAnnotation.height < minDimension);
      }

      if (!isTiny) {
        pushState([...annotations, currentAnnotation]);
      }
      setCurrentAnnotation(null);
    }
  };

  // Submit Text Annotation
  const handleAddText = () => {
    if (!pendingTextPos || !textInput.trim()) {
      setTextModalOpen(false);
      return;
    }

    const newTextItem: AnnotationItem = {
      id: Date.now().toString(),
      tool: 'text',
      x: pendingTextPos.x,
      y: pendingTextPos.y,
      text: textInput.trim(),
      color: selectedColor,
      strokeWidth,
      fontSize,
    };

    pushState([...annotations, newTextItem]);
    setTextModalOpen(false);
    setPendingTextPos(null);
  };

  // Apply Crop
  const handleApplyCrop = () => {
    if (!cropBox || cropBox.width < 10 || cropBox.height < 10) {
      toast.error('Select a larger area to crop');
      return;
    }

    const canvas = getCleanCanvas();
    if (!canvas) return;

    // Create trimmed canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(cropBox.width);
    tempCanvas.height = Math.round(cropBox.height);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(
      canvas,
      Math.round(cropBox.x),
      Math.round(cropBox.y),
      Math.round(cropBox.width),
      Math.round(cropBox.height),
      0,
      0,
      Math.round(cropBox.width),
      Math.round(cropBox.height)
    );

    setCropBox(null);
    setActiveTool('rectangle');
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Could not apply crop');
        return;
      }
      loadImage(URL.createObjectURL(blob), blob.size);
      toast.success('Crop applied successfully');
    }, 'image/png');
  };

  const handleCancelCrop = () => {
    setCropBox(null);
    setActiveTool('rectangle');
  };

  // Run OCR text extraction
  const handleRunOcr = async (useSelection = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Image and committed annotations only, without selection or crop overlays
    let targetCanvas: HTMLCanvasElement = getCleanCanvas() ?? canvas;
    if (useSelection && ocrBox && ocrBox.width > 5 && ocrBox.height > 5) {
      const region = extractCanvasRegion(targetCanvas, ocrBox);
      if (region) targetCanvas = region;
    }

    setOcrModalOpen(true);
    setOcrLoading(true);
    setOcrProgress(0);
    setOcrStatus('Initializing WebAssembly OCR engine...');

    try {
      const text = await performOcr(targetCanvas, (pct, status) => {
        setOcrProgress(pct);
        setOcrStatus(status);
      });
      setOcrResultText(text || '(No text detected in this image)');
      setOcrLoading(false);
      toast.success('Text extraction complete');
    } catch (err: unknown) {
      setOcrLoading(false);
      setOcrResultText('');
      const message = err instanceof Error ? err.message : 'Failed to extract text';
      toast.error(message);
    }
  };

  const handleCancelOcr = () => {
    setOcrBox(null);
    setActiveTool('rectangle');
  };

  // Copy to Clipboard
  const handleCopyClipboard = async () => {
    const canvas = getCleanCanvas();
    if (!canvas) return;

    const success = await copyCanvasToClipboard(canvas);
    if (success) {
      setIsCopied(true);
      toast.success('Image copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error('Could not copy image - browser permission needed');
    }
  };

  // Download Image
  const handleDownload = (format: 'image/png' | 'image/jpeg') => {
    const canvas = getCleanCanvas();
    if (!canvas) return;
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    downloadCanvas(canvas, `annotated-screenshot-${Date.now()}.${ext}`, format);
    toast.success(`Downloaded as ${ext.toUpperCase()}`);
  };

  // Reset to original image or sample
  const handleLoadSample = () => {
    const sample = createSampleImage();
    loadImage(sample, 48000);
  };

  const handleClearAnnotations = () => {
    if (annotations.length === 0) return;
    pushState([]);
    toast.success('Annotations cleared');
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={ImageIcon}
          title="Image Annotator & Screenshot Redactor"
          description="Annotate bug reports, redact sensitive secrets, crop, extract text with client-side OCR, and copy directly to clipboard."
        >
          {imageSrc && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunOcr(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Extract all text from image using OCR"
              >
                <ScanText size={14} />
                <span>Extract Text (OCR)</span>
              </button>

              <button
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 transition-colors shadow-sm"
                title="Copy annotated image to clipboard"
              >
                {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{isCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <button
                onClick={() => handleDownload('image/png')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Download PNG image"
              >
                <Download size={14} />
                <span>Download PNG</span>
              </button>
            </div>
          )}
        </PageHeader>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3 overflow-hidden">
          {/* Top Control Bar */}
          {imageSrc && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0">
              {/* Tool Selector */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg">
                {[
                  { tool: 'rectangle', icon: Square, label: 'Rectangle' },
                  { tool: 'circle', icon: Circle, label: 'Circle' },
                  { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
                  { tool: 'line', icon: Minus, label: 'Line' },
                  { tool: 'pen', icon: PenTool, label: 'Freehand Pen' },
                  { tool: 'text', icon: Type, label: 'Text Callout' },
                  { tool: 'pixelate', icon: EyeOff, label: 'Redact / Pixelate' },
                  { tool: 'crop', icon: CropIcon, label: 'Crop Image' },
                  { tool: 'ocr', icon: ScanText, label: 'OCR Box' },
                ].map(({ tool, icon: Icon, label }) => (
                  <button
                    key={tool}
                    onClick={() => setActiveTool(tool as ToolMode)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeTool === tool
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-700'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                    title={label}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Color & Size Customization */}
              <div className="flex items-center gap-3">
                {activeTool !== 'pixelate' && activeTool !== 'crop' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-neutral-500 uppercase">Color:</span>
                    <div className="flex items-center gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setSelectedColor(c.hex)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            selectedColor === c.hex
                              ? 'scale-125 border-neutral-900 dark:border-white ring-2 ring-neutral-400/50'
                              : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        title="Custom Color"
                      />
                    </div>
                  </div>
                )}

                {/* Stroke Width / Font Size Sliders */}
                {activeTool === 'text' ? (
                  <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-1 rounded-lg">
                    <span className="text-[11px] font-mono text-neutral-500">Size:</span>
                    <input
                      type="range"
                      min={12}
                      max={64}
                      step={2}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-20 accent-neutral-900 dark:accent-neutral-100 cursor-pointer h-1 rounded-lg bg-neutral-200 dark:bg-neutral-700"
                      title={`Font size: ${fontSize}px`}
                    />
                    <span className="text-[11px] font-mono font-medium text-neutral-700 dark:text-neutral-300 w-8 text-right">
                      {fontSize}px
                    </span>
                  </div>
                ) : activeTool !== 'crop' ? (
                  <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-1 rounded-lg">
                    <span className="text-[11px] font-mono text-neutral-500">Width:</span>
                    <input
                      type="range"
                      min={1}
                      max={24}
                      step={1}
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(Number(e.target.value))}
                      className="w-20 accent-neutral-900 dark:accent-neutral-100 cursor-pointer h-1 rounded-lg bg-neutral-200 dark:bg-neutral-700"
                      title={`Stroke width: ${strokeWidth}px`}
                    />
                    <span className="text-[11px] font-mono font-medium text-neutral-700 dark:text-neutral-300 w-7 text-right">
                      {strokeWidth}px
                    </span>
                  </div>
                ) : null}

                {/* History & Reset actions */}
                <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-800 pl-3">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    title="Undo"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    title="Redo"
                  >
                    <Redo2 size={15} />
                  </button>
                  <button
                    onClick={handleClearAnnotations}
                    disabled={annotations.length === 0}
                    className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                    title="Clear All Annotations"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded"
                    title="Load Different Image"
                  >
                    <Upload size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Crop Action Bar Banner */}
          {activeTool === 'crop' && cropBox && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs shrink-0 text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <CropIcon size={14} />
                Drag to set crop area: {Math.round(cropBox.width)} x {Math.round(cropBox.height)} px
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelCrop}
                  className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-sm"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          )}

          {/* OCR Action Bar Banner */}
          {activeTool === 'ocr' && ocrBox && (
            <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs shrink-0 text-blue-900 dark:text-blue-200">
              <span className="flex items-center gap-1.5">
                <ScanText size={14} />
                OCR Selection: {Math.round(ocrBox.width)} x {Math.round(ocrBox.height)} px
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelOcr}
                  className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRunOcr(true)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm"
                >
                  Extract Selected Text
                </button>
              </div>
            </div>
          )}

          {/* Canvas or Upload Placeholder Container */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex-1 min-h-0 bg-neutral-100 dark:bg-[#070709] border border-neutral-200 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center justify-center relative overflow-auto p-4"
          >
            {imageSrc ? (
              <div className="relative inline-block max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-800">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  className={`block max-w-full max-h-[75vh] object-contain ${
                    activeTool === 'crop'
                      ? 'cursor-crosshair'
                      : activeTool === 'text'
                      ? 'cursor-text'
                      : 'cursor-crosshair'
                  }`}
                  style={{ touchAction: 'none' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center max-w-md p-8">
                <div className="w-16 h-16 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 mb-4 shadow-inner">
                  <ImageIcon size={32} />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  Upload or Drop Image
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                  Drop an image file or browse from your device to annotate, redact, crop, and extract text with OCR.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 transition-colors shadow-sm"
                  >
                    <Upload size={14} />
                    Browse Image
                  </button>
                  <button
                    onClick={handleLoadSample}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    Load Sample UI
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          {imageSrc && (
            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-2 shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Resolution: {imageSize.width} × {imageSize.height} px
                </span>
                {imageSize.bytes > 0 && <span>Size: {formatFileSize(imageSize.bytes)}</span>}
                <span>Annotations: {annotations.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Info size={12} />
                <span>Client-side only: images never leave your browser</span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Text Annotation Input Modal */}
        {textModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 w-full max-w-sm shadow-xl">
              <h4 className="text-sm font-semibold mb-2">Add Text Callout</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                Type the label or annotation note:
              </p>
              <input
                type="text"
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddText();
                  if (e.key === 'Escape') setTextModalOpen(false);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 mb-4"
                placeholder="Enter text callout..."
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setTextModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddText}
                  className="px-3 py-1.5 text-xs rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 font-medium"
                >
                  Insert Text
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OCR Result Modal */}
        {ocrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 w-full max-w-lg shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <ScanText size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Extracted Text (OCR)</h4>
                    <p className="text-[11px] text-neutral-500">Tesseract WebAssembly engine (runs in your browser; language data downloads once)</p>
                  </div>
                </div>

                <button
                  onClick={() => setOcrModalOpen(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  ✕
                </button>
              </div>

              {ocrLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 size={28} className="animate-spin text-blue-500" />
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                    {ocrStatus || 'Recognizing text...'}
                  </p>
                  <div className="w-48 bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-200"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <textarea
                    readOnly
                    rows={8}
                    value={ocrResultText}
                    className="w-full p-3 font-mono text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none resize-none"
                    placeholder="No text recognized."
                  />

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] font-mono text-neutral-500">
                      {ocrResultText.length} chars - {ocrResultText.split(/\s+/).filter(Boolean).length} words
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOcrModalOpen(false)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                      >
                        Close
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ocrResultText);
                          toast.success('Text copied to clipboard!');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm"
                      >
                        <Copy size={13} />
                        <span>Copy Text</span>
                      </button>

                      <button
                        onClick={() => {
                          const blob = new Blob([ocrResultText], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `extracted-ocr-${Date.now()}.txt`;
                          a.click();
                          URL.revokeObjectURL(a.href);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <FileText size={13} />
                        <span>Save .txt</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

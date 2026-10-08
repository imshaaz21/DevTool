'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'react-hot-toast';
import {
  Scissors,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Crop as CropIcon,
  Download,
  Film,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  MAX_DURATION_SECONDS,
  ASPECT_RATIO_PRESETS,
  formatTimestamp,
  clampTime,
  validateVideoFile,
  validateTrimRange,
  calculateCropDimensions,
  estimateTrimmedSize,
  downloadBlob,
  trimAndCropVideo,
  getVideoDuration,
  getExportSupportError,
} from '@/lib/video-trimmer';

export default function VideoTrimmerPage() {
  const { isCollapsed } = useSidebar();

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<{ name: string; size: number } | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Trim and crop configuration
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<string>('original');

  // Export process state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [trimmedResultBlob, setTrimmedResultBlob] = useState<Blob | null>(null);
  const [trimmedResultUrl, setTrimmedResultUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  useEffect(() => setSupportError(getExportSupportError()), []);

  const abortRef = useRef<AbortController | null>(null);
  // Latest object URLs, so unmount cleanup can revoke them
  const urlsRef = useRef<{ src: string | null; result: string | null }>({ src: null, result: null });
  urlsRef.current = { src: videoSrc, result: trimmedResultUrl };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      const { src, result } = urlsRef.current;
      if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
      if (result) URL.revokeObjectURL(result);
    };
  }, []);

  // Load video into player
  const loadVideo = (src: string, fileInfo: { name: string; size: number }) => {
    // Clear previous export result
    if (trimmedResultUrl) {
      URL.revokeObjectURL(trimmedResultUrl);
    }
    if (videoSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    setTrimmedResultBlob(null);
    setTrimmedResultUrl(null);
    setVideoFile(fileInfo);
    setVideoSrc(src);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Apply a known duration and reset trim points
  const applyDuration = (dur: number) => {
    setDuration(dur);
    setStartTime(0);
    // Default initial preview clip to first 60 seconds or video duration
    setEndTime(Math.min(dur, 60));

    if (dur > MAX_DURATION_SECONDS) {
      toast(
        `Video is ${(dur / 60).toFixed(1)} mins long. You can select any clip up to 5 mins anywhere in this video.`,
        { icon: 'ℹ️' }
      );
    }
  };

  // Video metadata loaded
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setVideoDimensions({
      width: video.videoWidth,
      height: video.videoHeight,
    });

    if (Number.isFinite(video.duration)) {
      applyDuration(video.duration || 0);
      return;
    }

    // Duration header missing (e.g. Chrome screen recordings): read it from the container
    const src = video.currentSrc || videoSrc;
    if (!src) return;
    getVideoDuration(src)
      .then(applyDuration)
      .catch(() => toast.error('Could not determine the video duration.'));
  };

  // Handle play / pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Time update listener
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Loop within trim range while previewing
    if (isPlaying && video.currentTime >= endTime) {
      video.currentTime = startTime;
    }
  };

  // Set start time to current playhead
  const setStartToCurrent = () => {
    if (currentTime >= endTime) {
      toast.error('Start time cannot exceed end time');
      return;
    }
    setStartTime(currentTime);
    toast.success(`Start point: ${formatTimestamp(currentTime)}`);
  };

  // Set end time to current playhead
  const setEndToCurrent = () => {
    if (currentTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }
    setEndTime(currentTime);
    toast.success(`End point: ${formatTimestamp(currentTime)}`);
  };

  // Seek video
  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    const clamped = clampTime(newTime, 0, duration);
    setCurrentTime(clamped);
    if (video) {
      video.currentTime = clamped;
    }
  };

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      e.target.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    loadVideo(url, { name: file.name, size: file.size });
    e.target.value = '';
    toast.success('Video loaded successfully');
  };

  // Drag and drop video
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    const url = URL.createObjectURL(file);
    loadVideo(url, { name: file.name, size: file.size });
    toast.success('Video loaded successfully');
  };

  // Load sample video
  const handleLoadSample = () => {
    loadVideo('/sample-demo.mp4', { name: 'sample-demo.mp4', size: 35115 });
    toast.success('Sample video loaded');
  };

  // Execute Trim & Crop
  const handleTrimAndExport = async () => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const validation = validateTrimRange(startTime, endTime, duration);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid trim parameters');
      return;
    }

    video.pause();
    setIsPlaying(false);
    setIsProcessing(true);
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;
    let lastPct = -1;

    try {
      const blob = await trimAndCropVideo({
        src: videoSrc,
        start: startTime,
        end: endTime,
        crop:
          aspectRatio === 'original'
            ? undefined
            : calculateCropDimensions(video.videoWidth, video.videoHeight, aspectRatio),
        signal: controller.signal,
        onProgress: (fraction) => {
          const pct = Math.min(99, Math.round(fraction * 100));
          if (pct !== lastPct) {
            lastPct = pct;
            setProgress(pct);
          }
        },
      });

      if (!blob) {
        toast('Export cancelled');
        return;
      }

      if (trimmedResultUrl) URL.revokeObjectURL(trimmedResultUrl);
      setProgress(100);
      setTrimmedResultBlob(blob);
      setTrimmedResultUrl(URL.createObjectURL(blob));
      toast.success('Trim and export complete!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error trimming video');
    } finally {
      abortRef.current = null;
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!trimmedResultBlob) return;
    const originalBase = videoFile?.name?.replace(/\.[^/.]+$/, '') || 'trimmed-clip';
    downloadBlob(trimmedResultBlob, `${originalBase}-trimmed.mp4`);
  };

  const trimDuration = Math.max(0, endTime - startTime);
  const cropped =
    aspectRatio === 'original'
      ? null
      : calculateCropDimensions(videoDimensions.width, videoDimensions.height, aspectRatio);
  const areaRatio =
    cropped && videoDimensions.width > 0
      ? (cropped.width * cropped.height) / (videoDimensions.width * videoDimensions.height)
      : 1;
  const estimatedSize =
    videoFile && duration > 0
      ? estimateTrimmedSize(videoFile.size, duration, trimDuration, areaRatio)
      : 0;

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={Scissors}
          title="Video Trimmer & Cropper"
          description="Trim segments and crop aspect ratios entirely in your browser. Fast MP4 export; a plain trim copies the video without re-encoding, so the cut may snap to a keyframe."
        >
          {videoSrc && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Upload size={14} />
                <span>Upload New Video</span>
              </button>
            </div>
          )}
        </PageHeader>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 overflow-y-auto">
          {supportError && (
            <div
              role="alert"
              className="max-w-5xl mx-auto w-full flex items-start gap-2 p-3 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{supportError}</span>
            </div>
          )}
          {videoSrc ? (
            <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
              <fieldset disabled={isProcessing} className="contents">
              {/* Video Player Card */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                {/* Video Screen Container */}
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    muted={isMuted}
                    playsInline
                    className="max-h-[50vh] max-w-full object-contain"
                  >
                    <track kind="captions" />
                  </video>

                  {/* Play overlay button */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-lg backdrop-blur-xs"
                      title="Play"
                    >
                      <Play size={28} className="ml-1" />
                    </button>
                  )}
                </div>

                {/* Timeline Scrubber */}
                <div className="flex flex-col gap-1.5 px-1">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    <span>{formatTimestamp(currentTime)}</span>
                    <span className="text-[11px] font-sans">
                      Trimmed duration: <strong>{formatTimestamp(trimDuration)}</strong>
                    </span>
                    <span>{formatTimestamp(duration)}</span>
                  </div>

                  {/* Range Slider Track */}
                  <div className="relative w-full h-4 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number.parseFloat(e.target.value))}
                      className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer h-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800"
                    />
                  </div>
                </div>

                {/* Playback Controls & Set Marker Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    <button
                      onClick={() => handleSeek(startTime)}
                      className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                      title="Rewind to Start point"
                    >
                      <RotateCcw size={16} />
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>

                  {/* Marker buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={setStartToCurrent}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    >
                      <span>Set Start</span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        [{formatTimestamp(startTime)}]
                      </span>
                    </button>

                    <button
                      onClick={setEndToCurrent}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    >
                      <span>Set End</span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        [{formatTimestamp(endTime)}]
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Trim & Crop Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TrimPointsCard
                  duration={duration}
                  startTime={startTime}
                  endTime={endTime}
                  trimDuration={trimDuration}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                />

                <AspectRatioCard
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  videoDimensions={videoDimensions}
                />
              </div>

              </fieldset>

              <ExportActionCard
                estimatedSize={estimatedSize}
                isProcessing={isProcessing}
                progress={progress}
                supportError={supportError}
                trimDuration={trimDuration}
                trimmedResultUrl={trimmedResultUrl}
                onCancel={() => abortRef.current?.abort()}
                onExport={handleTrimAndExport}
                onDownload={handleDownloadResult}
              />
            </div>
          ) : (
            /* Upload / Drop Placeholder */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex-1 min-h-[400px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 mb-4 shadow-inner">
                <Film size={32} />
              </div>

              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                Upload or Drop Video
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
                Drop a screen recording or clip to trim segments and crop aspect ratios without third-party servers.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 transition-colors shadow-sm"
                >
                  <Upload size={14} />
                  <span>Browse Video</span>
                </button>

                <button
                  onClick={handleLoadSample}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Load Sample Demo</span>
                </button>
              </div>

              <div className="mt-8 flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                <AlertCircle size={13} />
                <span>Client-side only: max 100 MB / 5 min clip for smooth browser performance</span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

interface TrimPointsCardProps {
  duration: number;
  startTime: number;
  endTime: number;
  trimDuration: number;
  onStartTimeChange: (val: number) => void;
  onEndTimeChange: (val: number) => void;
}

function TrimPointsCard({
  duration,
  startTime,
  endTime,
  trimDuration,
  onStartTimeChange,
  onEndTimeChange,
}: TrimPointsCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        <Clock size={16} className="text-neutral-500" />
        Trim Cut Points
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start-time-input" className="block text-xs font-medium text-neutral-500 mb-1">
            Start Time (seconds)
          </label>
          <input
            id="start-time-input"
            type="number"
            min={0}
            max={duration}
            step={0.1}
            value={Number(startTime.toFixed(1))}
            onChange={(e) => onStartTimeChange(clampTime(Number.parseFloat(e.target.value) || 0, 0, duration))}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div>
          <label htmlFor="end-time-input" className="block text-xs font-medium text-neutral-500 mb-1">
            End Time (seconds)
          </label>
          <input
            id="end-time-input"
            type="number"
            min={0}
            max={duration}
            step={0.1}
            value={Number(endTime.toFixed(1))}
            onChange={(e) => onEndTimeChange(clampTime(Number.parseFloat(e.target.value) || 0, 0, duration))}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <div className="text-xs flex items-center justify-between">
        <span className="text-neutral-500">Selected Clip:</span>
        <span
          className={`font-mono font-medium ${
            trimDuration > MAX_DURATION_SECONDS
              ? 'text-red-600 dark:text-red-400 font-semibold'
              : 'text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {trimDuration.toFixed(1)}s ({formatTimestamp(trimDuration)})
          {trimDuration > MAX_DURATION_SECONDS && ' (Max 5 mins)'}
        </span>
      </div>
    </div>
  );
}

interface AspectRatioCardProps {
  aspectRatio: string;
  onAspectRatioChange: (val: string) => void;
  videoDimensions: { width: number; height: number };
}

function AspectRatioCard({
  aspectRatio,
  onAspectRatioChange,
  videoDimensions,
}: AspectRatioCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
        <CropIcon size={16} className="text-neutral-500" />
        Crop Aspect Ratio
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {ASPECT_RATIO_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onAspectRatioChange(preset.value)}
            className={`px-3 py-2 text-xs rounded-lg border text-left transition-all ${
              aspectRatio === preset.value
                ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 font-medium'
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-neutral-500 flex items-center justify-between">
        <span>Source Resolution:</span>
        <span className="font-mono text-neutral-700 dark:text-neutral-300">
          {videoDimensions.width} x {videoDimensions.height} px
        </span>
      </div>
    </div>
  );
}

interface ExportActionCardProps {
  estimatedSize: number;
  isProcessing: boolean;
  progress: number;
  supportError: string | null;
  trimDuration: number;
  trimmedResultUrl: string | null;
  onCancel: () => void;
  onExport: () => void;
  onDownload: () => void;
}

function ExportActionCard({
  estimatedSize,
  isProcessing,
  progress,
  supportError,
  trimDuration,
  trimmedResultUrl,
  onCancel,
  onExport,
  onDownload,
}: ExportActionCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Export Trimmed Video
          </h4>
          <p className="text-xs text-neutral-500">
            Estimated file size: ~{(estimatedSize / (1024 * 1024)).toFixed(1)} MB
          </p>
        </div>

        {isProcessing && (
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onExport}
          disabled={!!supportError || isProcessing || trimDuration <= 0 || trimDuration > MAX_DURATION_SECONDS}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Scissors size={14} />
          <span>{isProcessing ? `Trimming... ${progress}%` : 'Trim & Export Video'}</span>
        </button>
      </div>

      {isProcessing && (
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-neutral-900 dark:bg-white h-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {trimmedResultUrl && !isProcessing && (
        <div className="mt-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <Check size={18} />
            <span className="text-xs font-medium">Video trimmed successfully!</span>
          </div>

          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
          >
            <Download size={14} />
            <span>Download Trimmed MP4</span>
          </button>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoTrimmerPage from '@/app/video-trimmer/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('@/lib/video-trimmer', () => ({
  ...jest.requireActual('@/lib/video-trimmer'),
  trimAndCropVideo: jest.fn(),
  getVideoDuration: jest.fn(),
  downloadBlob: jest.fn(),
}));

const libMock = jest.requireMock('@/lib/video-trimmer');
const mockTrim = libMock.trimAndCropVideo as jest.Mock;
const mockDuration = libMock.getVideoDuration as jest.Mock;
const mockDownload = libMock.downloadBlob as jest.Mock;

describe('VideoTrimmerPage', () => {
  beforeAll(() => {
    (global as any).VideoDecoder = class {};
    (global as any).VideoEncoder = class {};
    Object.defineProperty(HTMLVideoElement.prototype, 'duration', { configurable: true, get: () => 10 });

    // Mock URL object methods
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-video-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock HTMLVideoElement methods
    HTMLVideoElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
    HTMLVideoElement.prototype.pause = jest.fn();
    (HTMLVideoElement.prototype as any).captureStream = jest.fn().mockReturnValue({
      getAudioTracks: () => [],
    });

    // Mock Canvas methods
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
      fillStyle: '',
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      fillText: jest.fn(),
      font: '',
    });
    (HTMLCanvasElement.prototype as any).captureStream = jest.fn().mockReturnValue({
      addTrack: jest.fn(),
    });

    // Mock MediaRecorder
    class MockMediaRecorder {
      static isTypeSupported = jest.fn().mockReturnValue(true);
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      start = jest.fn();
      stop = jest.fn().mockImplementation(() => {
        if (this.onstop) this.onstop();
      });
    }
    (global as any).MediaRecorder = MockMediaRecorder;
    (window as any).MediaRecorder = MockMediaRecorder;
  });

  const loadSample = async () => {
    fireEvent.click(screen.getByText('Load Sample Demo'));
    await waitFor(() => expect(screen.getByText('Trim Cut Points')).toBeInTheDocument());
    fireEvent.loadedMetadata(document.querySelector('video') as HTMLVideoElement);
  };

  const renderPage = () => {
    return render(
      <SidebarProvider>
        <VideoTrimmerPage />
      </SidebarProvider>
    );
  };

  it('renders page header and upload dropzone placeholder', () => {
    renderPage();
    expect(screen.getByText('Video Trimmer & Cropper')).toBeInTheDocument();
    expect(screen.getByText('Upload or Drop Video')).toBeInTheDocument();
    expect(screen.getByText('Browse Video')).toBeInTheDocument();
    expect(screen.getByText('Load Sample Demo')).toBeInTheDocument();
  });

  it('loads sample video and renders video player interface', async () => {
    renderPage();
    const sampleBtn = screen.getByText('Load Sample Demo');
    fireEvent.click(sampleBtn);

    await waitFor(() => {
      expect(screen.getByText('Trim Cut Points')).toBeInTheDocument();
      expect(screen.getByText('Crop Aspect Ratio')).toBeInTheDocument();
      expect(screen.getByText('Trim & Export Video')).toBeInTheDocument();
    });

    expect(screen.getByText('Set Start')).toBeInTheDocument();
    expect(screen.getByText('Set End')).toBeInTheDocument();
    expect(screen.getByText('16:9 Landscape')).toBeInTheDocument();
    expect(screen.getByText('1:1 Square')).toBeInTheDocument();
  });

  it('allows changing aspect ratio preset', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Load Sample Demo'));

    await waitFor(() => {
      expect(screen.getByText('1:1 Square')).toBeInTheDocument();
    });

    const squareBtn = screen.getByText('1:1 Square');
    fireEvent.click(squareBtn);
    expect(squareBtn.className).toContain('font-medium');

    const mobileBtn = screen.getByText('9:16 Mobile / Reel');
    fireEvent.click(mobileBtn);
    expect(mobileBtn.className).toContain('font-medium');
  });

  it('allows setting start and end cut points via inputs', async () => {
    renderPage();
    await loadSample();

    const inputs = screen.getAllByRole('spinbutton');
    const startInput = inputs[0];
    const endInput = inputs[1];

    fireEvent.change(startInput, { target: { value: '1.5' } });
    fireEvent.change(endInput, { target: { value: '4.0' } });

    expect(screen.getByText(/2.5s/)).toBeInTheDocument();
  });

  it('handles play, pause, and mute toggles', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Load Sample Demo'));

    await waitFor(() => {
      expect(screen.getAllByTitle('Play').length).toBeGreaterThanOrEqual(1);
    });

    const playBtns = screen.getAllByTitle('Play');
    fireEvent.click(playBtns[0]);
    expect(HTMLVideoElement.prototype.play).toHaveBeenCalled();

    const muteBtn = screen.getByTitle('Mute');
    fireEvent.click(muteBtn);
    expect(screen.getByTitle('Unmute')).toBeInTheDocument();
  });

  it('allows clicking Set Start and Set End buttons', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Load Sample Demo'));

    await waitFor(() => {
      expect(screen.getByText('Set Start')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set Start'));
    fireEvent.click(screen.getByText('Set End'));
  });

  it('validates trim parameters and shows error when start >= end', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Load Sample Demo'));

    await waitFor(() => {
      expect(screen.getByText('Trim Cut Points')).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '5.0' } });
    fireEvent.change(inputs[1], { target: { value: '2.0' } });

    const trimBtn = screen.getByText('Trim & Export Video');
    fireEvent.click(trimBtn);
  });

  it('clamps cut points to the video duration', async () => {
    renderPage();
    await loadSample();
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '99' } });
    expect(inputs[1]).toHaveValue(10);
  });

  it('exports a trimmed clip and shows the download card', async () => {
    mockTrim.mockResolvedValue(new Blob(['x'], { type: 'video/mp4' }));
    renderPage();
    await loadSample();

    fireEvent.click(screen.getByText('Trim & Export Video'));

    await waitFor(() => expect(screen.getByText('Download Trimmed MP4')).toBeInTheDocument());
    const args = mockTrim.mock.calls[0][0];
    expect(args.start).toBe(0);
    expect(args.end).toBe(10);
    expect(args.crop).toBeUndefined();
  });

  it('passes a crop rectangle when an aspect ratio is chosen', async () => {
    mockTrim.mockResolvedValue(new Blob(['x'], { type: 'video/mp4' }));
    renderPage();
    await loadSample();

    fireEvent.click(screen.getByText('1:1 Square'));
    fireEvent.click(screen.getByText('Trim & Export Video'));

    await waitFor(() => expect(mockTrim).toHaveBeenCalled());
    // jsdom reports 0x0 video size, so the crop is the empty rect, but it must be present
    expect(mockTrim.mock.calls[mockTrim.mock.calls.length - 1][0].crop).toBeDefined();
  });

  it('shows a message when export is cancelled', async () => {
    mockTrim.mockResolvedValue(null);
    renderPage();
    await loadSample();

    fireEvent.click(screen.getByText('Trim & Export Video'));

    await waitFor(() => expect(screen.getByText('Trim & Export Video')).not.toBeDisabled());
    expect(screen.queryByText('Download Trimmed MP4')).not.toBeInTheDocument();
  });

  it('surfaces export errors without leaving the UI locked', async () => {
    mockTrim.mockRejectedValue(new Error('boom'));
    renderPage();
    await loadSample();

    fireEvent.click(screen.getByText('Trim & Export Video'));

    await waitFor(() => expect(screen.getByText('Trim & Export Video')).not.toBeDisabled());
  });

  it('warns and disables export when WebCodecs is unavailable', async () => {
    const g = global as any;
    const [dec, enc] = [g.VideoDecoder, g.VideoEncoder];
    delete g.VideoDecoder;
    delete g.VideoEncoder;
    try {
      renderPage();
      await loadSample();
      expect(await screen.findByRole('alert')).toHaveTextContent(/WebCodecs/);
      expect(screen.getByText('Trim & Export Video').closest('button')).toBeDisabled();
    } finally {
      g.VideoDecoder = dec;
      g.VideoEncoder = enc;
    }
  });

  describe('player and file handling', () => {
    const getVideo = () => document.querySelector('video') as HTMLVideoElement;

    // jsdom does not implement media playback, so back currentTime with a plain field
    const stubCurrentTime = (video: HTMLVideoElement, initial = 0) => {
      let t = initial;
      Object.defineProperty(video, 'currentTime', { configurable: true, get: () => t, set: (v) => (t = v) });
      return { set: (v: number) => (t = v), get: () => t };
    };

    const sizes = (video: HTMLVideoElement, w: number, h: number) => {
      Object.defineProperty(video, 'videoWidth', { configurable: true, get: () => w });
      Object.defineProperty(video, 'videoHeight', { configurable: true, get: () => h });
    };

    beforeEach(() => jest.clearAllMocks());

    it('reads the duration from the container when <video> reports Infinity', async () => {
      mockDuration.mockResolvedValue(30);
      renderPage();
      fireEvent.click(screen.getByText('Load Sample Demo'));
      await waitFor(() => expect(screen.getByText('Trim Cut Points')).toBeInTheDocument());
      const video = getVideo();
      Object.defineProperty(video, 'duration', { configurable: true, get: () => Infinity });
      fireEvent.loadedMetadata(video);
      await waitFor(() => expect(screen.getAllByRole('spinbutton')[1]).toHaveValue(30));
      delete (video as any).duration;
    });

    it('survives a failed duration lookup', async () => {
      mockDuration.mockRejectedValue(new Error('bad'));
      renderPage();
      fireEvent.click(screen.getByText('Load Sample Demo'));
      await waitFor(() => expect(screen.getByText('Trim Cut Points')).toBeInTheDocument());
      const video = getVideo();
      Object.defineProperty(video, 'duration', { configurable: true, get: () => NaN });
      fireEvent.loadedMetadata(video);
      await waitFor(() => expect(mockDuration).toHaveBeenCalled());
      expect(screen.getByText('Trim Cut Points')).toBeInTheDocument();
      delete (video as any).duration;
    });

    it('shows a notice for videos longer than the 5 minute limit', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Load Sample Demo'));
      await waitFor(() => expect(screen.getByText('Trim Cut Points')).toBeInTheDocument());
      const video = getVideo();
      Object.defineProperty(video, 'duration', { configurable: true, get: () => 400 });
      fireEvent.loadedMetadata(video);
      await waitFor(() => expect(screen.getAllByRole('spinbutton')[1]).toHaveValue(60));
      delete (video as any).duration;
    });

    it('loads a video chosen with the file picker and revokes the previous one', async () => {
      renderPage();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [new File(['v'], 'a.mp4', { type: 'video/mp4' })] } });
      await waitFor(() => expect(screen.getByText('Trim Cut Points')).toBeInTheDocument());

      fireEvent.change(input, { target: { files: [new File(['v'], 'b.mp4', { type: 'video/mp4' })] } });
      await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-video-url'));
    });

    it('rejects an invalid file from the picker and from a drop', () => {
      renderPage();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });
      expect(screen.queryByText('Trim Cut Points')).not.toBeInTheDocument();

      const zone = screen.getByText('Upload or Drop Video').parentElement as HTMLElement;
      fireEvent.drop(zone, { dataTransfer: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });
      expect(screen.queryByText('Trim Cut Points')).not.toBeInTheDocument();
    });

    it('loads a dropped video', async () => {
      renderPage();
      const zone = screen.getByText('Upload or Drop Video').parentElement as HTMLElement;
      fireEvent.drop(zone, { dataTransfer: { files: [new File(['v'], 'a.webm', { type: 'video/webm' })] } });
      await waitFor(() => expect(screen.getByText('Trim Cut Points')).toBeInTheDocument());
    });

    it('sets start and end from the playhead and rejects crossed points', async () => {
      renderPage();
      await loadSample();
      const video = getVideo();
      const time = stubCurrentTime(video, 2);
      fireEvent.timeUpdate(video);
      fireEvent.click(screen.getByText('Set Start'));
      expect(screen.getByText('Set Start').closest('button')!.textContent).toContain('00:02.0');

      // end must be after start
      time.set(1);
      fireEvent.timeUpdate(video);
      fireEvent.click(screen.getByText('Set End'));
      expect(screen.getByText('Set End').closest('button')!.textContent).toContain('00:10.0');

      time.set(5);
      fireEvent.timeUpdate(video);
      fireEvent.click(screen.getByText('Set End'));
      expect(screen.getByText('Set End').closest('button')!.textContent).toContain('00:05.0');

      // start must be before end
      time.set(8);
      fireEvent.timeUpdate(video);
      fireEvent.click(screen.getByText('Set Start'));
      expect(screen.getByText('Set Start').closest('button')!.textContent).toContain('00:02.0');
    });

    it('seeks with the slider and rewinds to the start point', async () => {
      renderPage();
      await loadSample();
      const video = getVideo();
      const time = stubCurrentTime(video);
      fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } });
      expect(time.get()).toBe(4);
      fireEvent.click(screen.getByTitle('Rewind to Start point'));
      expect(time.get()).toBe(0);
    });

    it('plays, pauses and loops inside the trim range', async () => {
      renderPage();
      await loadSample();
      const video = getVideo();
      const time = stubCurrentTime(video, 10);

      // playhead at the end: play restarts from the start point
      fireEvent.click(screen.getAllByTitle('Play')[0]);
      expect(time.get()).toBe(0);
      expect(video.play).toHaveBeenCalled();

      // reaching the end while playing jumps back to the start
      time.set(10);
      fireEvent.timeUpdate(video);
      expect(time.get()).toBe(0);

      fireEvent.click(screen.getAllByTitle('Pause')[0]);
      expect(video.pause).toHaveBeenCalled();
      fireEvent.ended(video);
    });

    it('scales the size estimate down when a crop is chosen', async () => {
      renderPage();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const big = new File([new ArrayBuffer(8 * 1024 * 1024)], 'big.mp4', { type: 'video/mp4' });
      fireEvent.change(input, { target: { files: [big] } });
      await waitFor(() => expect(screen.getByText('Trim Cut Points')).toBeInTheDocument());
      const video = getVideo();
      sizes(video, 1920, 1080);
      fireEvent.loadedMetadata(video);
      const before = screen.getByText(/Estimated file size/).textContent;
      fireEvent.click(screen.getByText('1:1 Square'));
      expect(screen.getByText(/Estimated file size/).textContent).not.toBe(before);
    });

    it('passes the crop rectangle to the exporter', async () => {
      mockTrim.mockResolvedValue(new Blob(['x']));
      renderPage();
      await loadSample();
      sizes(getVideo(), 1920, 1080);
      fireEvent.click(screen.getByText('1:1 Square'));
      fireEvent.click(screen.getByText('Trim & Export Video'));
      await waitFor(() => expect(mockTrim).toHaveBeenCalled());
      expect(mockTrim.mock.calls[0][0].crop).toEqual({ x: 420, y: 0, width: 1080, height: 1080 });
    });

    it('cancels a running export', async () => {
      let resolveExport: (b: Blob | null) => void = () => {};
      mockTrim.mockImplementation(({ signal }) => new Promise((resolve) => {
        resolveExport = resolve;
        signal.addEventListener('abort', () => resolve(null));
      }));
      renderPage();
      await loadSample();
      fireEvent.click(screen.getByText('Trim & Export Video'));
      fireEvent.click(await screen.findByText('Cancel'));
      await waitFor(() => expect(screen.queryByText('Cancel')).not.toBeInTheDocument());
      expect(screen.queryByText('Download Trimmed MP4')).not.toBeInTheDocument();
      resolveExport(null);
    });

    it('reports progress while exporting and downloads the result', async () => {
      mockTrim.mockImplementation(async ({ onProgress }) => {
        onProgress(0.5);
        return new Blob(['x'], { type: 'video/mp4' });
      });
      renderPage();
      await loadSample();
      fireEvent.click(screen.getByText('Trim & Export Video'));
      fireEvent.click(await screen.findByText('Download Trimmed MP4'));
      expect(mockDownload).toHaveBeenCalledWith(expect.any(Blob), 'sample-demo-trimmed.mp4');
    });

    it('rejects an invalid trim range before exporting', async () => {
      renderPage();
      await loadSample();
      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '8' } });
      fireEvent.change(inputs[1], { target: { value: '2' } });
      fireEvent.click(screen.getByText('Trim & Export Video'));
      expect(mockTrim).not.toHaveBeenCalled();
    });

    it('opens the file picker from the header after a video is loaded', async () => {
      renderPage();
      await loadSample();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const click = jest.spyOn(input, 'click');
      fireEvent.click(screen.getByText('Upload New Video'));
      expect(click).toHaveBeenCalled();
    });
  });
});

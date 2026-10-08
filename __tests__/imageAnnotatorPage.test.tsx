import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ImageAnnotatorPage from '@/app/image-annotator/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    write: jest.fn().mockImplementation(() => Promise.resolve()),
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockImplementation((_lang, _oem, options) => {
    if (options?.logger) {
      options.logger({ status: 'recognizing text', progress: 1.0 });
    }
    return Promise.resolve({
      recognize: jest.fn().mockResolvedValue({
        data: { text: 'Detected sample text from screenshot' },
      }),
      terminate: jest.fn().mockResolvedValue(undefined),
    });
  }),
}));

describe('ImageAnnotatorPage', () => {
  let originalGetContext: any;
  let originalImageSrc: PropertyDescriptor | undefined;

  beforeAll(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      save: jest.fn(),
      restore: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      rect: jest.fn(),
      roundRect: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      fillText: jest.fn(),
      setLineDash: jest.fn(),
      createLinearGradient: jest.fn().mockReturnValue({
        addColorStop: jest.fn(),
      }),
      getImageData: jest.fn().mockReturnValue({
        width: 100,
        height: 100,
        data: new Uint8ClampedArray(100 * 100 * 4),
      }),
      putImageData: jest.fn(),
      canvas: { width: 800, height: 600 },
    });
    HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,sample');
    HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation((cb: any) => {
      cb(new Blob(['dummy-image-data'], { type: 'image/png' }));
    });

    class MockImage {
      _src = '';
      naturalWidth = 800;
      naturalHeight = 600;
      width = 800;
      height = 600;
      crossOrigin = '';
      onload: (() => void) | null = null;
      get src() {
        return this._src;
      }
      set src(val: string) {
        this._src = val;
        if (this.onload) {
          this.onload();
        }
      }
    }
    (global as any).Image = MockImage;
    (window as any).Image = MockImage;
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  const renderPage = () => {
    return render(
      <SidebarProvider>
        <ImageAnnotatorPage />
      </SidebarProvider>
    );
  };

  it('renders header, description, and empty dropzone placeholder', () => {
    renderPage();
    expect(screen.getByText('Image Annotator & Screenshot Redactor')).toBeInTheDocument();
    expect(screen.getByText(/Upload or Drop Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Load Sample UI/i)).toBeInTheDocument();
  });

  it('loads sample image when clicking Load Sample UI button', async () => {
    renderPage();
    const sampleBtn = screen.getByText(/Load Sample UI/i);
    fireEvent.click(sampleBtn);

    // Canvas should now be rendered, and tool options should appear
    await waitFor(() => {
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
      expect(screen.getByText('Download PNG')).toBeInTheDocument();
    });

    expect(screen.getByText('Rectangle')).toBeInTheDocument();
    expect(screen.getByText('Arrow')).toBeInTheDocument();
    expect(screen.getByText('Redact / Pixelate')).toBeInTheDocument();
    expect(screen.getByText('Crop Image')).toBeInTheDocument();
  });

  it('allows tool selection and customization changes', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByText('Rectangle')).toBeInTheDocument();
    });

    // Switch tool to Arrow
    fireEvent.click(screen.getByText('Arrow'));

    // Switch tool to Redact
    fireEvent.click(screen.getByText('Redact / Pixelate'));

    // Switch tool to Freehand Pen
    fireEvent.click(screen.getByText('Freehand Pen'));

    // Switch tool to Text Callout
    fireEvent.click(screen.getByText('Text Callout'));
    expect(screen.getByText('Size:')).toBeInTheDocument();
    const slider = screen.getByTitle(/Font size:/i);
    fireEvent.change(slider, { target: { value: '32' } });
    expect(screen.getByText('32px')).toBeInTheDocument();
  });

  it('handles canvas drawing events', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByText('Rectangle')).toBeInTheDocument();
    });

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
    }

    // Annotation count should update
    expect(screen.getByText(/Annotations: 1/i)).toBeInTheDocument();

    // Switch to Arrow and draw
    fireEvent.click(screen.getByText('Arrow'));
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 60, clientY: 60 });
      fireEvent.mouseMove(canvas, { clientX: 180, clientY: 180 });
      fireEvent.mouseUp(canvas);
    }
    expect(screen.getByText(/Annotations: 2/i)).toBeInTheDocument();
  });

  it('opens text modal when text tool is active and canvas is clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByText('Text Callout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Text Callout'));

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 80, clientY: 80 });
    }

    expect(screen.getByText('Add Text Callout')).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Enter text callout/i);
    fireEvent.change(input, { target: { value: 'API Error bug' } });
    fireEvent.click(screen.getByText('Insert Text'));

    expect(screen.queryByText('Add Text Callout')).not.toBeInTheDocument();
  });

  it('allows entering crop mode and canceling crop', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByText('Crop Image')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Crop Image'));

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
      fireEvent.mouseUp(canvas);
    }

    expect(screen.getByText(/Drag to set crop area/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/Drag to set crop area/i)).not.toBeInTheDocument();
  });

  it('triggers copy to clipboard', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    });

    const copyBtn = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyBtn);
  });

  it('triggers download PNG', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByText('Download PNG')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByText('Download PNG');
    fireEvent.click(downloadBtn);
  });

  it('triggers extract text (OCR) whole image and displays modal', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByText('Extract Text (OCR)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Extract Text (OCR)'));

    // OCR modal should appear
    await waitFor(() => {
      expect(screen.getByText('Extracted Text (OCR)')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Detected sample text from screenshot')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => {
      expect(screen.queryByText('Extracted Text (OCR)')).not.toBeInTheDocument();
    });
  });

  it('enters OCR tool mode to select text region', async () => {
    renderPage();
    fireEvent.click(screen.getByText(/Load Sample UI/i));

    await waitFor(() => {
      expect(screen.getByTitle('OCR Box')).toBeInTheDocument();
    });

    // Click OCR tool button in toolbar
    fireEvent.click(screen.getByTitle('OCR Box'));

    const canvas = document.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 30, clientY: 30 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 100 });
      fireEvent.mouseUp(canvas);
    }

    expect(screen.getByText(/OCR Selection:/i)).toBeInTheDocument();
    expect(screen.getByText(/Extract Selected Text/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/OCR Selection:/i)).not.toBeInTheDocument();
  });

  describe('interactions', () => {
    let origRect: typeof HTMLCanvasElement.prototype.getBoundingClientRect;

    beforeAll(() => {
      origRect = HTMLCanvasElement.prototype.getBoundingClientRect;
      // 1:1 scale so client coordinates map straight to canvas coordinates
      HTMLCanvasElement.prototype.getBoundingClientRect = () =>
        ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-image');
      global.URL.revokeObjectURL = jest.fn();
      (global as any).ClipboardItem = class {
        constructor(public items: unknown) {}
      };
    });

    afterAll(() => {
      HTMLCanvasElement.prototype.getBoundingClientRect = origRect;
    });

    const loadSample = async () => {
      renderPage();
      fireEvent.click(screen.getByText(/Load Sample UI/i));
      await waitFor(() => expect(screen.getByText('Rectangle')).toBeInTheDocument());
      return document.querySelector('canvas') as HTMLCanvasElement;
    };

    const drag = (canvas: HTMLCanvasElement, from: [number, number], to: [number, number]) => {
      fireEvent.mouseDown(canvas, { clientX: from[0], clientY: from[1] });
      fireEvent.mouseMove(canvas, { clientX: to[0], clientY: to[1] });
      fireEvent.mouseUp(canvas);
    };

    it('draws with every shape tool', async () => {
      const canvas = await loadSample();
      const tools = ['Rectangle', 'Circle', 'Arrow', 'Line', 'Redact / Pixelate'];
      tools.forEach((label, i) => {
        fireEvent.click(screen.getByText(label));
        drag(canvas, [20, 20], [200, 120]);
        expect(screen.getByText(new RegExp(`Annotations: ${i + 1}`))).toBeInTheDocument();
      });
    });

    it('draws a freehand stroke and ignores a bare click', async () => {
      const canvas = await loadSample();
      fireEvent.click(screen.getByText('Freehand Pen'));
      fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(canvas, { clientX: 40, clientY: 30 });
      fireEvent.mouseMove(canvas, { clientX: 80, clientY: 60 });
      fireEvent.mouseUp(canvas);
      expect(screen.getByText(/Annotations: 1/)).toBeInTheDocument();

      // a click with no movement is discarded
      fireEvent.click(screen.getByText('Line'));
      fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
      fireEvent.mouseUp(canvas);
      expect(screen.getByText(/Annotations: 1/)).toBeInTheDocument();
    });

    it('supports touch drawing', async () => {
      const canvas = await loadSample();
      fireEvent.touchStart(canvas, { touches: [{ clientX: 30, clientY: 30 }] });
      fireEvent.touchMove(canvas, { touches: [{ clientX: 160, clientY: 120 }] });
      fireEvent.touchEnd(canvas);
      expect(screen.getByText(/Annotations: 1/)).toBeInTheDocument();
    });

    it('undoes, redoes and clears annotations', async () => {
      const canvas = await loadSample();
      drag(canvas, [20, 20], [200, 120]);
      drag(canvas, [30, 30], [220, 140]);
      expect(screen.getByText(/Annotations: 2/)).toBeInTheDocument();

      fireEvent.click(screen.getByTitle('Undo'));
      expect(screen.getByText(/Annotations: 1/)).toBeInTheDocument();
      fireEvent.click(screen.getByTitle('Redo'));
      expect(screen.getByText(/Annotations: 2/)).toBeInTheDocument();
      fireEvent.click(screen.getByTitle('Clear All Annotations'));
      expect(screen.getByText(/Annotations: 0/)).toBeInTheDocument();
    });

    it('changes color and stroke width', async () => {
      const canvas = await loadSample();
      const swatches = screen.getAllByRole('button').filter((b) => b.getAttribute('title') === 'Blue');
      if (swatches[0]) fireEvent.click(swatches[0]);
      fireEvent.change(screen.getByTitle(/Stroke width:/i), { target: { value: '8' } });
      drag(canvas, [20, 20], [200, 120]);
      expect(screen.getByText(/Annotations: 1/)).toBeInTheDocument();
    });

    it('closes the text modal with Enter and Escape', async () => {
      const canvas = await loadSample();
      fireEvent.click(screen.getByText('Text Callout'));
      fireEvent.mouseDown(canvas, { clientX: 80, clientY: 80 });
      const input = screen.getByPlaceholderText(/Enter text callout/i);
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(screen.queryByText('Add Text Callout')).not.toBeInTheDocument();
      expect(screen.getByText(/Annotations: 1/)).toBeInTheDocument();

      fireEvent.mouseDown(canvas, { clientX: 90, clientY: 90 });
      fireEvent.keyDown(screen.getByPlaceholderText(/Enter text callout/i), { key: 'Escape' });
      expect(screen.queryByText('Add Text Callout')).not.toBeInTheDocument();
      expect(screen.getByText(/Annotations: 1/)).toBeInTheDocument();
    });

    it('applies a crop and loads the cropped image', async () => {
      const canvas = await loadSample();
      fireEvent.click(screen.getByText('Crop Image'));
      drag(canvas, [20, 20], [220, 170]);
      fireEvent.click(screen.getByText('Apply Crop'));
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByText(/Drag to set crop area/i)).not.toBeInTheDocument());
    });

    it('rejects a crop that is too small', async () => {
      const canvas = await loadSample();
      fireEvent.click(screen.getByText('Crop Image'));
      drag(canvas, [20, 20], [24, 24]);
      fireEvent.click(screen.getByText('Apply Crop'));
      expect(screen.getByText(/Drag to set crop area/i)).toBeInTheDocument();
    });

    it('extracts text from a selected region and copies it', async () => {
      const canvas = await loadSample();
      fireEvent.click(screen.getByTitle('OCR Box'));
      drag(canvas, [30, 30], [250, 150]);
      fireEvent.click(screen.getByText('Extract Selected Text'));

      await waitFor(() =>
        expect(screen.getByDisplayValue('Detected sample text from screenshot')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText('Copy Text'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Detected sample text from screenshot');
      fireEvent.click(screen.getByText('Save .txt'));
    });

    it('shows an error when OCR fails', async () => {
      const { createWorker } = jest.requireMock('tesseract.js');
      createWorker.mockRejectedValueOnce(new Error('engine failed'));
      await loadSample();
      fireEvent.click(screen.getByText('Extract Text (OCR)'));
      await waitFor(() => expect(screen.getByText('Extracted Text (OCR)')).toBeInTheDocument());
      await waitFor(() => expect(screen.getByPlaceholderText(/No text recognized/i)).toBeInTheDocument());
    });

    it('copies to clipboard and reports failure', async () => {
      await loadSample();
      fireEvent.click(screen.getByText('Copy to Clipboard'));
      await waitFor(() => expect(navigator.clipboard.write).toHaveBeenCalled());

      (navigator.clipboard.write as jest.Mock).mockRejectedValueOnce(new Error('denied'));
      fireEvent.click(screen.getByTitle('Copy annotated image to clipboard'));
      await waitFor(() => expect(navigator.clipboard.write).toHaveBeenCalledTimes(2));
    });

    it('loads an image chosen with the file picker', async () => {
      renderPage();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['img'], 'shot.png', { type: 'image/png' });
      fireEvent.change(input, { target: { files: [file] } });
      await waitFor(() => expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument());
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it('rejects a non-image file', () => {
      renderPage();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] } });
      expect(screen.queryByText('Copy to Clipboard')).not.toBeInTheDocument();
    });

    it('loads a dropped image and ignores a dropped non-image', async () => {
      renderPage();
      const zone = screen.getByText(/Upload or Drop Image/i).closest('div[class*="flex-1"]') as HTMLElement;
      fireEvent.drop(zone, { dataTransfer: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] } });
      expect(screen.queryByText('Copy to Clipboard')).not.toBeInTheDocument();

      fireEvent.drop(zone, { dataTransfer: { files: [new File(['img'], 'a.png', { type: 'image/png' })] } });
      await waitFor(() => expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument());
    });

    it('loads an image pasted from the clipboard', async () => {
      renderPage();
      const file = new File(['img'], 'paste.png', { type: 'image/png' });
      const event = new Event('paste') as Event & { clipboardData: unknown };
      event.clipboardData = { items: [{ type: 'image/png', getAsFile: () => file }] };
      act(() => {
        window.dispatchEvent(event);
      });
      await waitFor(() => expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument());
    });
  });
});

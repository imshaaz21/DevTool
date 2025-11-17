'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { 
  extractMimeType, 
  createBlobUrl, 
  getImageMetadata, 
  formatFileSize, 
  normalizeBase64,
  ImageMetadata 
} from '@/utils/base64ImageViewer';

export default function Base64ViewerPage() {
  const [base64Input, setBase64Input] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up blob URL when component unmounts or when a new one is created
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
    if (base64.startsWith('"') && base64.endsWith('"')) {
      base64 = base64.slice(1, -1);
    }

    if (!base64.trim()) {
      setError('Please enter a base64 string or upload an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean up previous blob URL if it exists
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }

      // For large base64 strings, process in a non-blocking way
      // to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 0));

      // Extract MIME type
      const mimeType = extractMimeType(base64);

      if (!mimeType.startsWith('image/')) {
        setError('The provided data does not appear to be an image');
        setLoading(false);
        return;
      }

      // Create blob URL for the image
      // Use setTimeout to prevent UI blocking for large images
      await new Promise(resolve => setTimeout(resolve, 0));
      const normalizedBase64 = normalizeBase64(base64, mimeType);

      // Show a processing message for large images
      const isLargeImage = normalizedBase64.length > 1000000; // Roughly 1MB
      if (isLargeImage) {
        setError('Processing large image, please wait...');
      }

      // Process in a non-blocking way
      await new Promise(resolve => setTimeout(resolve, 0));
      const blobUrl = createBlobUrl(normalizedBase64, mimeType);
      setImageUrl(blobUrl);

      if (isLargeImage) {
        setError('');
      }

      // Get image metadata
      const imageMetadata = await getImageMetadata(normalizedBase64);
      setMetadata(imageMetadata);
    } catch (err) {
      setError(`Error decoding base64 image: ${(err as Error).message}`);
      setImageUrl(null);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    // Clean up blob URL if it exists
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }

    setBase64Input('');
    setImageUrl(null);
    setMetadata(null);
    setError('');

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file upload and convert to base64
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError('');

    // Show a processing message for large files
    if (file.size > 1000000) { // 1MB
      setError('Processing large image, please wait...');
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        setBase64Input(base64);

        // Process the image
        await handleDecode(base64);
      } catch (err) {
        setError(`Error processing image: ${(err as Error).message}`);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file');
      setLoading(false);
    };

    // Read the file as a data URL (base64)
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `image.${metadata?.format.toLowerCase() || 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Base64 Image Viewer</h1>

        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Paste Base64 String or Upload Image</h2>
          <textarea
            className="w-full h-32 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
            value={base64Input}
            onChange={(e) => setBase64Input(e.target.value)}
            placeholder="Paste your base64 encoded image data here..."
          />

          <div className="mt-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Or upload an image file (recommended for large images):</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900/20 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => handleDecode()} 
              disabled={loading} 
              className="btn btn-primary"
            >
              {loading ? 'Processing...' : 'Decode Image'}
            </button>
            <button 
              onClick={handleClear} 
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {imageUrl && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 card">
              <h2 className="text-xl font-semibold mb-4">Image Preview</h2>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt="Decoded base64 image" 
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
              <button 
                onClick={handleDownload} 
                className="btn btn-primary mt-4"
              >
                Download Image
              </button>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Image Metadata</h2>
              {metadata ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Format:</span>
                    <span>{metadata.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">MIME Type:</span>
                    <span>{metadata.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Dimensions:</span>
                    <span>{metadata.width} × {metadata.height} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Size:</span>
                    <span>{formatFileSize(metadata.sizeInBytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Aspect Ratio:</span>
                    <span>
                      {metadata.width / gcd(metadata.width, metadata.height)}:
                      {metadata.height / gcd(metadata.width, metadata.height)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Metadata will appear here after decoding an image.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper function to calculate greatest common divisor (for aspect ratio)
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

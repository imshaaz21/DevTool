import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 p-8 ml-64 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Welcome to DevTools Suite</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Saudi Fake Data Generator</h2>
            <p className="mb-4 flex-grow">Generate realistic test data for Saudi and non-Saudi individuals with proper formatting for IDs, names, and contact information.</p>
            <Link href="/saudi-data-generator" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>

          <div className="card flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Feature Toggle Comparison</h2>
            <p className="mb-4 flex-grow">Compare feature toggles between environments (ops, release) and identify differences</p>
            <Link href="/json-comparator" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>

          <div className="card flex flex-col">
            <h2 className="text-xl font-semibold mb-4">JSON Comparison</h2>
            <p className="mb-4 flex-grow">Compare any JSON objects with side-by-side diff view and detailed analysis</p>
            <Link href="/json-comparison" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>

          <div className="card flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Base64 Image Viewer</h2>
            <p className="mb-4 flex-grow">Decode and view Base64 encoded images with metadata information and download options.</p>
            <Link href="/base64-viewer" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>

          <div className="card flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Encoder/Decoder & Hash</h2>
            <p className="mb-4 flex-grow">Encode/decode text (Base64, URL, HTML, Unicode) and generate hashes (SHA-1/256/512). Perfect for K8s secrets.</p>
            <Link href="/encoder-decoder" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to DevTools Suite</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Saudi Fake Data Generator</h2>
            <p className="mb-4">Generate realistic test data for Saudi and non-Saudi individuals with proper formatting for IDs, names, and contact information.</p>
            <Link href="/saudi-data-generator" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">JSON Key Comparator</h2>
            <p className="mb-4">Compare two JSON objects to identify differences in their structure, keys, and values with a visual diff view.</p>
            <Link href="/json-comparator" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Base64 Image Viewer</h2>
            <p className="mb-4">Decode and view Base64 encoded images with metadata information and download options.</p>
            <Link href="/base64-viewer" className="btn btn-primary inline-block">
              Open Tool
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Base64ViewerPage from '@/app/base64-viewer/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/base64-viewer',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock URL.createObjectURL and revokeObjectURL
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-blob-url');
  global.URL.revokeObjectURL = jest.fn();
});

describe('Base64ViewerPage', () => {
  it('renders page header with Image as default mode', () => {
    render(
      <SidebarProvider>
        <Base64ViewerPage />
      </SidebarProvider>
    );

    expect(screen.getByText('Base64 Image & PDF Viewer')).toBeInTheDocument();
    expect(screen.getByTitle('Decode as Image (Default)')).toBeInTheDocument();
    expect(screen.getByTitle('Specifically decode as PDF Document')).toBeInTheDocument();
    expect(screen.getByText('Base64 Input (Image - Default)')).toBeInTheDocument();
  });

  it('switches to PDF mode when specifically clicked', () => {
    render(
      <SidebarProvider>
        <Base64ViewerPage />
      </SidebarProvider>
    );

    const pdfModeBtn = screen.getByTitle('Specifically decode as PDF Document');
    fireEvent.click(pdfModeBtn);

    expect(screen.getByText('Base64 Input (PDF Document)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste Base64 encoded PDF data here/i)).toBeInTheDocument();
  });

  it('loads sample image and stays in image mode', async () => {
    render(
      <SidebarProvider>
        <Base64ViewerPage />
      </SidebarProvider>
    );

    const sampleImgBtn = screen.getByTitle('Load sample Base64 image');
    fireEvent.click(sampleImgBtn);

    await waitFor(() => {
      expect(screen.getByText('Base64 Input (Image - Default)')).toBeInTheDocument();
    });
  });

  it('specifically switches to PDF when sample PDF is clicked', async () => {
    render(
      <SidebarProvider>
        <Base64ViewerPage />
      </SidebarProvider>
    );

    const samplePdfBtn = screen.getByTitle('Load sample Base64 PDF document');
    fireEvent.click(samplePdfBtn);

    await waitFor(() => {
      expect(screen.getByText('Base64 Input (PDF Document)')).toBeInTheDocument();
      expect(screen.getByText('PDF Document Preview')).toBeInTheDocument();
    });
  });
});

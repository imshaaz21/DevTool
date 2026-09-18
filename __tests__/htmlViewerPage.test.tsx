import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HtmlViewerPage from '@/app/html-viewer/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/html-viewer',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('HtmlViewerPage', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders page header, editor and live sandbox iframe', () => {
    render(
      <SidebarProvider>
        <HtmlViewerPage />
      </SidebarProvider>
    );

    expect(screen.getByText('HTML Viewer & Sandbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type or paste HTML code here\.\.\./i)).toBeInTheDocument();
    expect(screen.getByTitle('HTML Preview Sandbox')).toBeInTheDocument();
  });

  it('switches viewport modes between desktop, laptop, tablet, and mobile', () => {
    render(
      <SidebarProvider>
        <HtmlViewerPage />
      </SidebarProvider>
    );

    const mobileBtn = screen.getByTitle(/Mobile View \(375px\)/i);
    fireEvent.click(mobileBtn);
    expect(screen.getByText(/Viewport: mobile/i)).toBeInTheDocument();

    const tabletBtn = screen.getByTitle(/Tablet View \(768px\)/i);
    fireEvent.click(tabletBtn);
    expect(screen.getByText(/Viewport: tablet/i)).toBeInTheDocument();
  });

  it('switches layout views between split, preview, and code', () => {
    render(
      <SidebarProvider>
        <HtmlViewerPage />
      </SidebarProvider>
    );

    const previewBtn = screen.getByTitle(/Preview Only/i);
    fireEvent.click(previewBtn);
    // Editor should not be visible in preview-only mode
    expect(screen.queryByPlaceholderText(/Type or paste HTML code here\.\.\./i)).not.toBeInTheDocument();

    const codeBtn = screen.getByTitle(/Code Editor Only/i);
    fireEvent.click(codeBtn);
    // Preview iframe should not be visible in code-only mode
    expect(screen.queryByTitle('HTML Preview Sandbox')).not.toBeInTheDocument();
  });

  it('copies HTML code to clipboard', () => {
    render(
      <SidebarProvider>
        <HtmlViewerPage />
      </SidebarProvider>
    );

    const copyBtn = screen.getByTitle(/Copy HTML to clipboard/i);
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('loads sample Lorem Ipsum HTML when Sample HTML button is clicked', () => {
    render(
      <SidebarProvider>
        <HtmlViewerPage />
      </SidebarProvider>
    );

    const sampleBtn = screen.getByTitle(/Load sample Lorem Ipsum HTML/i);
    fireEvent.click(sampleBtn);

    const editor = screen.getByPlaceholderText(/Type or paste HTML code here\.\.\./i) as HTMLTextAreaElement;
    expect(editor.value).toContain('Lorem Ipsum Dolor Sit Amet');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownViewerPage from '@/app/markdown-viewer/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/markdown-viewer',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('MarkdownViewerPage', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders page header, editor in markdown mode and live sandbox iframe', () => {
    render(
      <SidebarProvider>
        <MarkdownViewerPage />
      </SidebarProvider>
    );

    expect(screen.getByText('Markdown Viewer & Preview')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Type or paste Markdown content here/i)
    ).toBeInTheDocument();
    expect(screen.getByTitle('HTML Preview Sandbox')).toBeInTheDocument();
  });

  it('toggles mode between Markdown and HTML', () => {
    render(
      <SidebarProvider>
        <MarkdownViewerPage />
      </SidebarProvider>
    );

    // Initial mode is Markdown
    expect(screen.getByText('Markdown Viewer & Preview')).toBeInTheDocument();

    // Click HTML mode button
    const htmlBtn = screen.getByTitle('Switch to HTML Mode');
    fireEvent.click(htmlBtn);

    expect(screen.getByText('HTML Viewer & Sandbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type or paste HTML code here/i)).toBeInTheDocument();

    // Switch back to Markdown
    const mdBtn = screen.getByTitle('Switch to Markdown Mode');
    fireEvent.click(mdBtn);

    expect(screen.getByText('Markdown Viewer & Preview')).toBeInTheDocument();
  });

  it('inserts markdown table and code block snippets', () => {
    render(
      <SidebarProvider>
        <MarkdownViewerPage />
      </SidebarProvider>
    );

    const insertTableBtn = screen.getByText('Insert Table');
    fireEvent.click(insertTableBtn);

    const textarea = screen.getByPlaceholderText(/Type or paste Markdown content here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('| Column 1 | Column 2 | Column 3 |');

    const insertCodeBtn = screen.getByText('Insert Code');
    fireEvent.click(insertCodeBtn);
    expect(textarea.value).toContain('```typescript');
  });

  it('copies compiled HTML to clipboard in markdown mode', () => {
    render(
      <SidebarProvider>
        <MarkdownViewerPage />
      </SidebarProvider>
    );

    const copyHtmlBtn = screen.getByTitle('Copy compiled HTML to clipboard');
    fireEvent.click(copyHtmlBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('loads sample Markdown when Sample Markdown button is clicked', () => {
    render(
      <SidebarProvider>
        <MarkdownViewerPage />
      </SidebarProvider>
    );

    const sampleBtn = screen.getByTitle('Load sample Markdown document');
    fireEvent.click(sampleBtn);

    const textarea = screen.getByPlaceholderText(/Type or paste Markdown content here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('# Payment Gateway API v2');
  });
});

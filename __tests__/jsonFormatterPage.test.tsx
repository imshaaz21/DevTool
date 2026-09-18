import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JsonFormatterPage from '@/app/json-formatter/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/json-formatter',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock JsonEditorComponent dynamic import
jest.mock('@/components/JsonEditorComponent', () => ({
  JsonEditorComponent: ({ json }: { json: any }) => (
    <div data-testid="json-editor-mock">{JSON.stringify(json)}</div>
  ),
}));

describe('JsonFormatterPage', () => {
  it('renders header, toggles, and inputs', () => {
    render(
      <SidebarProvider>
        <JsonFormatterPage />
      </SidebarProvider>
    );

    expect(screen.getByText('JSON Formatter & Parser')).toBeInTheDocument();
    expect(screen.getByText('Unwrap Inner JSON')).toBeInTheDocument();
    expect(screen.getByText('Sample Inner JSON')).toBeInTheDocument();
  });

  it('loads sample inner stringified JSON and automatically unwraps it', async () => {
    render(
      <SidebarProvider>
        <JsonFormatterPage />
      </SidebarProvider>
    );

    const sampleBtn = screen.getByText('Sample Inner JSON');
    fireEvent.click(sampleBtn);

    await waitFor(() => {
      // Badge showing inner JSONs were unpacked
      expect(screen.getByText(/inner JSON.*unpacked/i)).toBeInTheDocument();
    });

    // Check that inner fields like customer name were unpacked into proper JSON
    const editor = screen.getByTestId('json-editor-mock');
    expect(editor.textContent).toContain('Khalid Mansoor');
  });

  it('allows toggling Unwrap Inner JSON off', async () => {
    render(
      <SidebarProvider>
        <JsonFormatterPage />
      </SidebarProvider>
    );

    const sampleBtn = screen.getByText('Sample Inner JSON');
    fireEvent.click(sampleBtn);

    const unwrapToggle = screen.getByText('Unwrap Inner JSON');
    fireEvent.click(unwrapToggle);

    await waitFor(() => {
      // With unwrap off, inner stringified JSON remains a raw string
      expect(screen.queryByText(/inner JSON.*unpacked/i)).not.toBeInTheDocument();
    });
  });
});

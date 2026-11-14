import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import JsonComparisonPage from '@/app/json-comparison/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/json-comparison',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/components/JsonEditorComponent', () => ({
  JsonEditorComponent: ({ json }: { json: unknown }) => (
    <textarea data-testid="json-editor" readOnly value={JSON.stringify(json)} />
  ),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <JsonComparisonPage />
    </SidebarProvider>
  );
}

describe('JsonComparisonPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders both editors', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'JSON Comparison' })).toBeInTheDocument();
    expect(screen.getByText('Original JSON (A)')).toBeInTheDocument();
    expect(screen.getByText('Comparison JSON (B)')).toBeInTheDocument();
  });

  it('is still marked deprecated', () => {
    renderPage();
    // The sidebar carries the same badge, so more than one match is expected.
    expect(screen.getAllByText(/deprecated/i).length).toBeGreaterThan(0);
  });

  it('produces a comparison and lists keys unique to each side', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Compare Objects/i }));

    expect(screen.getByText('Keys Only in A')).toBeInTheDocument();
    expect(screen.getByText('Keys Only in B')).toBeInTheDocument();
  });

  it('returns to the editors', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Compare Objects/i }));
    await user.click(screen.getByRole('button', { name: /Back/i }));

    expect(screen.getByText('Original JSON (A)')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import JsonComparatorPage from '@/app/json-comparator/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/json-comparator',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

// The real editor is a third party widget that needs a layout engine.
jest.mock('@/components/JsonEditorComponent', () => ({
  JsonEditorComponent: ({ json }: { json: unknown }) => (
    <textarea data-testid="json-editor" readOnly value={JSON.stringify(json)} />
  ),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <JsonComparatorPage />
    </SidebarProvider>
  );
}

describe('JsonComparatorPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders both environment panes', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Feature Toggle Comparison' })).toBeInTheDocument();
    expect(screen.getByText('Environment A (Ops)')).toBeInTheDocument();
    expect(screen.getByText('Environment B (Release)')).toBeInTheDocument();
  });

  it('offers the comparison once the structure is valid', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Compare Environments/i })).toBeEnabled();
  });

  it('switches to the results view with every diff tab', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Compare Environments/i }));

    expect(screen.getByText('Key Diffs')).toBeInTheDocument();
    expect(screen.getByText('Value Diffs')).toBeInTheDocument();
    expect(screen.getByText('Identical')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('counts the toggles that differ between the two samples', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Compare Environments/i }));
    await user.click(screen.getByText('Summary'));

    // The samples differ on enableDarkMode and enableBetaFeatures only.
    expect(screen.getByText('Total Diffs')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('returns to the editors from the results view', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Compare Environments/i }));
    await user.click(screen.getByRole('button', { name: /Back/i }));

    expect(screen.getByText('Environment A (Ops)')).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EpochConverterPage from '@/app/epoch-converter/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/epoch-converter',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <EpochConverterPage />
    </SidebarProvider>
  );
}

describe('EpochConverterPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the header', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Epoch Converter' })).toBeInTheDocument();
  });

  it('shows nothing but the inputs until a timestamp is entered', () => {
    renderPage();
    expect(screen.queryByText('ISO 8601 (UTC)')).not.toBeInTheDocument();
  });

  it('converts a timestamp in seconds and says the unit was detected', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('1794652200'), '1794652200');

    expect(screen.getByText('2026-11-14T10:30:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.getByText(/detected from the magnitude/i)).toBeInTheDocument();
  });

  it('honours a forced unit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('1794652200'), '1794652200');
    await user.click(screen.getByRole('button', { name: 'ms' }));

    expect(screen.getByText('1970-01-21T18:30:52.200Z')).toBeInTheDocument();
    expect(screen.getByText(/\(forced\)/i)).toBeInTheDocument();
  });

  it('reports input that is not a number', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('1794652200'), 'today');

    expect(screen.getByText(/not a number/i)).toBeInTheDocument();
  });

  it('fills the timestamp from the clock', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Use now/i }));

    const input = screen.getByPlaceholderText('1794652200') as HTMLInputElement;
    expect(input.value).toMatch(/^\d{13}$/);
    expect(screen.getByText(/\(forced\)/i)).toBeInTheDocument();
  });

  it('converts a date back to both epoch units', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('2026-11-14T10:30:00Z'), '2026-11-14T10:30:00Z');

    expect(screen.getByText('1794652200')).toBeInTheDocument();
    expect(screen.getByText('1794652200000')).toBeInTheDocument();
  });

  it('reports a date it cannot read', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('2026-11-14T10:30:00Z'), 'next tuesday');

    await waitFor(() => {
      expect(screen.getByText(/ISO 8601 always works/i)).toBeInTheDocument();
    });
  });

  it('copies a converted value', async () => {
    const user = userEvent.setup();
    renderPage();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await user.type(screen.getByPlaceholderText('1794652200'), '1794652200');
    await user.click(screen.getByTitle('Copy ISO 8601 (UTC)'));

    expect(writeText).toHaveBeenCalledWith('2026-11-14T10:30:00.000Z');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UuidGeneratorPage from '@/app/uuid-generator/page';
import { SidebarProvider } from '@/components/SidebarContext';
import { isValidUuidV4 } from '@/lib/uuid';

jest.mock('next/navigation', () => ({
  usePathname: () => '/uuid-generator',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <UuidGeneratorPage />
    </SidebarProvider>
  );
}

describe('UuidGeneratorPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the header', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'UUID Generator' })).toBeInTheDocument();
  });

  it('generates valid version 4 uuids on load', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Generated UUIDs/i)).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByTitle('Copy UUID');
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('generates a fresh batch on demand', async () => {
    const user = userEvent.setup();
    renderPage();

    const before = screen.getAllByTitle('Copy UUID').length;
    await user.click(screen.getByRole('button', { name: /Generate New/i }));

    await waitFor(() => {
      expect(screen.getAllByTitle('Copy UUID').length).toBe(before);
    });
  });

  it('renders values that are real v4 uuids', async () => {
    renderPage();

    await waitFor(() => {
      const matches = screen.getAllByText(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(matches.length).toBeGreaterThan(0);
      expect(isValidUuidV4(matches[0].textContent ?? '')).toBe(true);
    });
  });

  it('copies all generated values', async () => {
    const user = userEvent.setup();
    // Stubbed after setup(), which installs a clipboard of its own.
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderPage();
    await user.click(screen.getByRole('button', { name: /Copy All/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/[0-9a-f-]{36}/i));
  });
});

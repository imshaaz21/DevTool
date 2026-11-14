import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { ConsentBanner } from '@/components/ConsentBanner';
import { Analytics } from '@/components/Analytics';
import { CONSENT_STORAGE_KEY, setConsent } from '@/lib/consent';

jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <script data-testid={id}>{children}</script>
  ),
}));

function storedState(): string | null {
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return raw ? (JSON.parse(raw).state as string) : null;
}

describe('analytics consent UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('asks before anything is stored', async () => {
    render(<ConsentBanner />);

    expect(await screen.findByRole('dialog', { name: /analytics consent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No thanks' })).toBeInTheDocument();
  });

  it('keeps the headline short and free of the alarming detail', async () => {
    render(<ConsentBanner />);

    const headline = await screen.findByText(/Anonymous usage analytics/i);
    expect(headline).toBeInTheDocument();
    expect(headline.textContent).not.toMatch(/session replay/i);
  });

  it('still discloses session replay, one click away', async () => {
    render(<ConsentBanner />);

    // The disclosure is a details element, so the text ships with the banner
    // rather than being fetched or omitted: consent stays informed either way.
    expect(await screen.findByText(/What is collected/i)).toBeInTheDocument();
    expect(screen.getByText(/session replay/i)).toBeInTheDocument();
  });

  it('stores a grant and dismisses itself', async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(await screen.findByRole('button', { name: 'Allow' }));

    expect(storedState()).toBe('granted');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stores a refusal and dismisses itself', async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(await screen.findByRole('button', { name: 'No thanks' }));

    expect(storedState()).toBe('denied');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not ask again once a choice exists', () => {
    setConsent('denied');
    render(<ConsentBanner />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Analytics', () => {
    it('loads nothing before a choice is made', () => {
      const { container } = render(<Analytics />);
      expect(container).toBeEmptyDOMElement();
    });

    it('loads nothing when analytics was refused', () => {
      setConsent('denied');
      const { container } = render(<Analytics />);
      expect(container).toBeEmptyDOMElement();
    });

    it('loads the tag only after consent is granted', () => {
      setConsent('granted');
      render(<Analytics />);

      const tag = screen.getByTestId('microsoft-clarity');
      expect(tag).toBeInTheDocument();
      expect(tag.textContent).toContain('clarity.ms/tag/');
    });
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FAVOURITES_STORAGE_KEY } from '@/lib/favourites';

jest.mock('next/navigation', () => ({
  usePathname: () => '/jwt-decoder',
}));

describe('PageHeader', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the title, description and badge', () => {
    render(
      <PageHeader
        icon={KeyRound}
        title="JWT Decoder"
        description="Decode tokens"
        badge="Deprecated"
      />
    );

    expect(screen.getByRole('heading', { name: 'JWT Decoder' })).toBeInTheDocument();
    expect(screen.getByText('Decode tokens')).toBeInTheDocument();
    expect(screen.getByText('Deprecated')).toBeInTheDocument();
  });

  it('renders action children', () => {
    render(
      <PageHeader icon={KeyRound} title="JWT Decoder" description="Decode tokens">
        <button type="button">Clear</button>
      </PageHeader>
    );

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('favourites the current tool from its header', async () => {
    const user = userEvent.setup();
    render(<PageHeader icon={KeyRound} title="JWT Decoder" description="Decode tokens" />);

    const star = screen.getByRole('button', { name: 'Add to favourites' });
    expect(star).toHaveAttribute('aria-pressed', 'false');

    await user.click(star);

    const raw = window.localStorage.getItem(FAVOURITES_STORAGE_KEY);
    expect(JSON.parse(raw as string).items).toEqual(['/jwt-decoder']);
    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('reflects a tool that is already favourited', () => {
    window.localStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify({ v: 1, items: ['/jwt-decoder'] })
    );

    render(<PageHeader icon={KeyRound} title="JWT Decoder" description="Decode tokens" />);

    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeInTheDocument();
  });

  it('unfavourites on a second click', async () => {
    const user = userEvent.setup();
    render(<PageHeader icon={KeyRound} title="JWT Decoder" description="Decode tokens" />);

    await user.click(screen.getByRole('button', { name: 'Add to favourites' }));
    await user.click(screen.getByRole('button', { name: 'Remove from favourites' }));

    const raw = window.localStorage.getItem(FAVOURITES_STORAGE_KEY);
    expect(JSON.parse(raw as string).items).toEqual([]);
  });
});

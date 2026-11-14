import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Home from '@/app/page';
import { SidebarProvider } from '@/components/SidebarContext';
import { FAVOURITES_STORAGE_KEY } from '@/lib/favourites';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

function renderHome() {
  return render(
    <SidebarProvider>
      <Home />
    </SidebarProvider>
  );
}

const SAUDI_TOOL = 'Saudi Fake Data';

function storedFavourites(): string[] {
  const raw = window.localStorage.getItem(FAVOURITES_STORAGE_KEY);
  return raw ? (JSON.parse(raw).items as string[]) : [];
}

describe('Home dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders every tool card and the category filters', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: SAUDI_TOOL })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'JSON Formatter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Favourites/ })).toBeInTheDocument();
  });

  it('filters tools by search term', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(screen.getByPlaceholderText(/Search utilities/i), 'liquibase');

    expect(screen.getByRole('heading', { name: 'Liquibase Checksum' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'JSON Formatter' })).not.toBeInTheDocument();
  });

  it('starts with no tool favourited', () => {
    renderHome();

    const star = screen.getByRole('button', { name: `Add ${SAUDI_TOOL} to favourites` });
    expect(star).toHaveAttribute('aria-pressed', 'false');
  });

  it('persists a favourite to localStorage when the star is clicked', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: `Add ${SAUDI_TOOL} to favourites` }));

    expect(storedFavourites()).toEqual(['/saudi-data-generator']);
    expect(
      screen.getByRole('button', { name: `Remove ${SAUDI_TOOL} from favourites` })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('removes the favourite when the star is clicked again', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: `Add ${SAUDI_TOOL} to favourites` }));
    await user.click(screen.getByRole('button', { name: `Remove ${SAUDI_TOOL} from favourites` }));

    expect(storedFavourites()).toEqual([]);
  });

  it('restores favourites stored by a previous visit', () => {
    window.localStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify({ v: 1, items: ['/json-formatter'] })
    );
    renderHome();

    expect(
      screen.getByRole('button', { name: 'Remove JSON Formatter from favourites' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows only favourites under the Favourites filter', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: `Add ${SAUDI_TOOL} to favourites` }));
    await user.click(screen.getByRole('button', { name: /Favourites/ }));

    expect(screen.getByRole('heading', { name: SAUDI_TOOL })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'JSON Formatter' })).not.toBeInTheDocument();
  });

  it('explains how to pin when the Favourites filter is empty', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: /Favourites/ }));

    expect(screen.getByText(/No favourites yet/i)).toBeInTheDocument();
  });

  it('pins favourited tools into the sidebar', async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.getAllByRole('link', { name: SAUDI_TOOL })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: `Add ${SAUDI_TOOL} to favourites` }));

    expect(screen.getAllByRole('link', { name: SAUDI_TOOL })).toHaveLength(2);
  });

  it('sorts favourites ahead of the rest of the grid', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Add Time Zone Converter to favourites' }));

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings[0]).toBe('Time Zone Converter');
  });

  it('keeps the whole card clickable through a covering link', () => {
    renderHome();

    expect(screen.getByRole('link', { name: `Open ${SAUDI_TOOL}` })).toHaveAttribute(
      'href',
      '/saudi-data-generator'
    );
  });

  it('picks up a favourite added in another tab', () => {
    renderHome();

    act(() => {
      window.localStorage.setItem(
        FAVOURITES_STORAGE_KEY,
        JSON.stringify({ v: 1, items: ['/uuid-generator'] })
      );
      window.dispatchEvent(new StorageEvent('storage', { key: FAVOURITES_STORAGE_KEY }));
    });

    expect(
      screen.getByRole('button', { name: 'Remove UUID Generator from favourites' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('drops favourites that no longer match a known tool', () => {
    window.localStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify({ v: 1, items: ['/json-formatter', '/retired-tool'] })
    );
    renderHome();

    expect(storedFavourites()).toEqual(['/json-formatter']);
  });
});

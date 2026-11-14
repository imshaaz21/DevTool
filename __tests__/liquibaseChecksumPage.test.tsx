import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LiquibaseChecksumPage from '@/app/liquibase-checksum/page';
import { SidebarProvider } from '@/components/SidebarContext';
import { computeChecksums } from '@/lib/liquibaseChecksum';

jest.mock('next/navigation', () => ({
  usePathname: () => '/liquibase-checksum',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

const CHANGESET = `<changeSet id="add-index" author="ima">
  <sql dbms="postgresql">CREATE INDEX idx_a ON t(a);</sql>
</changeSet>`;

function renderPage() {
  return render(
    <SidebarProvider>
      <LiquibaseChecksumPage />
    </SidebarProvider>
  );
}

describe('LiquibaseChecksumPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the header and database choices', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Liquibase Checksum' })).toBeInTheDocument();
    expect(screen.getByText('v9')).toBeInTheDocument();
  });

  it('computes the checksum for a pasted changeset', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByPlaceholderText(/changeSet id=/i));
    await user.paste(CHANGESET);

    const [expected] = computeChecksums(CHANGESET, 'postgresql');

    await waitFor(() => {
      expect(screen.getByText(expected.checksum)).toBeInTheDocument();
    });
  });

  it('matches a computed checksum against a stored md5sum', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByPlaceholderText(/changeSet id=/i));
    await user.paste(CHANGESET);

    const [expected] = computeChecksums(CHANGESET, 'postgresql');

    await user.click(screen.getByPlaceholderText(/rows containing id \+ md5sum/i));
    await user.paste(expected.checksum);

    await waitFor(() => {
      // Once matched the value shows as both computed and stored.
      expect(screen.getAllByText(expected.checksum).length).toBeGreaterThan(1);
    });
  });

  it('shows nothing to compute for empty input', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/changeSet id=/i)).toHaveValue('');
  });
});

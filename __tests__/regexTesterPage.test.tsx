import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegexTesterPage from '@/app/regex-tester/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/regex-tester',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <RegexTesterPage />
    </SidebarProvider>
  );
}

const patternInput = () => screen.getByLabelText('Regular expression pattern');
const subjectInput = () => screen.getByLabelText('Subject text');

// userEvent.type reads [ and { as keyboard syntax, which most patterns contain.
const setValue = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });

describe('RegexTesterPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('matches the sample with the pattern it starts with', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Regex Tester' })).toBeInTheDocument();
    await waitFor(() => {
      // Once highlighted in the subject, once in the match list.
      expect(screen.getAllByText('ops@devtools.test')).toHaveLength(2);
    });
  });

  it('reports a broken pattern', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(patternInput(), '(unclosed');

    await waitFor(() => {
      expect(screen.getByText(/Fix the pattern to see matches/i)).toBeInTheDocument();
    });
  });

  it('lists positional capture groups', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(patternInput(), '(\\d+)\\.(\\d+)');
    setValue(subjectInput(), '10.8');

    await waitFor(() => {
      expect(screen.getByText('$1')).toBeInTheDocument();
      expect(screen.getByText('$2')).toBeInTheDocument();
    });
  });

  it('lists named capture groups by name', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(patternInput(), '(?<user>[a-z]+)@');
    setValue(subjectInput(), 'ops@devtools.test');

    await waitFor(() => {
      expect(screen.getByText('user')).toBeInTheDocument();
    });
  });

  it('toggles a flag', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(patternInput(), 'OPS');
    setValue(subjectInput(), 'ops');

    await waitFor(() => {
      expect(screen.getByText('No matches yet.')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'i' }));

    await waitFor(() => {
      expect(screen.queryByText('No matches yet.')).not.toBeInTheDocument();
    });
  });

  it('describes the active flags', async () => {
    renderPage();
    expect(screen.getByText(/g: global/)).toBeInTheDocument();
  });

  it('applies a preset', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'ISO date' }));

    await waitFor(() => {
      expect(screen.getAllByText('2026-11-14')).toHaveLength(2);
    });
  });

  it('previews a replacement only once the replace panel is open', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByLabelText('Replacement')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Replace/i }));
    setValue(screen.getByLabelText('Replacement'), '[redacted]');

    await waitFor(() => {
      expect(screen.getByText(/Contact \[redacted\] or \[redacted\]/)).toBeInTheDocument();
    });
  });
});

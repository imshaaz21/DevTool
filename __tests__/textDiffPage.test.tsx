import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TextDiffPage from '@/app/text-diff/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/text-diff',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <TextDiffPage />
    </SidebarProvider>
  );
}

const left = () => screen.getByLabelText('Original text');
const right = () => screen.getByLabelText('Changed text');
const setValue = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });

describe('TextDiffPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('asks for input before diffing', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Text Diff' })).toBeInTheDocument();
    expect(screen.getByText(/Paste text into both sides/i)).toBeInTheDocument();
  });

  it('marks an added and a removed line', () => {
    renderPage();

    setValue(left(), 'alpha\nbeta\ngamma');
    setValue(right(), 'alpha\ndelta\ngamma');

    expect(screen.getByText('beta')).toBeInTheDocument();
    expect(screen.getByText('delta')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
    expect(screen.getByText('2 unchanged lines')).toBeInTheDocument();
  });

  it('says when the two sides are identical', () => {
    renderPage();

    setValue(left(), 'same');
    setValue(right(), 'same');

    expect(screen.getByText(/The two sides are identical\./)).toBeInTheDocument();
  });

  it('applies the ignore case option', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(left(), 'Same');
    setValue(right(), 'same');
    expect(screen.queryByText(/identical/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ignore case' }));

    expect(screen.getByText(/identical under the options above/i)).toBeInTheDocument();
  });

  it('switches to the character view', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(left(), 'the cat sat');
    setValue(right(), 'the dog sat');

    await user.click(screen.getByRole('button', { name: 'Characters' }));

    // Once in the header badge, once as the panel title.
    expect(screen.getAllByText('Character diff')).toHaveLength(2);
    expect(screen.getByText(/unchanged characters/)).toBeInTheDocument();
  });

  it('swaps the two sides', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(left(), 'one');
    setValue(right(), 'two');

    await user.click(screen.getByTitle('Swap sides'));

    expect(left()).toHaveValue('two');
    expect(right()).toHaveValue('one');
  });

  it('clears both sides', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(left(), 'one');
    setValue(right(), 'two');

    await user.click(screen.getByTitle('Clear both sides'));

    expect(left()).toHaveValue('');
    expect(right()).toHaveValue('');
  });

  it('copies a unified diff', async () => {
    const user = userEvent.setup();
    renderPage();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    setValue(left(), 'alpha\nbeta');
    setValue(right(), 'alpha\ndelta');

    await user.click(screen.getByRole('button', { name: /Copy unified/i }));

    expect(writeText).toHaveBeenCalledWith(
      ['--- original', '+++ changed', ' alpha', '-beta', '+delta'].join('\n')
    );
  });

  it('offers the diff export only in the line view', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('button', { name: /\.diff/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Characters' }));

    expect(screen.queryByRole('button', { name: /\.diff/i })).not.toBeInTheDocument();
  });
});

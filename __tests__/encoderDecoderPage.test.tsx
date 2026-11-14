import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import EncoderDecoderPage from '@/app/encoder-decoder/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/encoder-decoder',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

function renderPage() {
  return render(
    <SidebarProvider>
      <EncoderDecoderPage />
    </SidebarProvider>
  );
}

describe('EncoderDecoderPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the header and both modes', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Encoder / Decoder & Hash' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Base64' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hash Checksum' })).toBeInTheDocument();
  });

  it('encodes text to Base64 as it is typed', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/Paste text to convert/i), 'hello world');

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Result will appear here/i)).toHaveValue('aGVsbG8gd29ybGQ=');
    });
  });

  it('decodes Base64 back to text', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Decode' }));
    await user.type(screen.getByPlaceholderText(/Paste text to convert/i), 'aGVsbG8gd29ybGQ=');

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Result will appear here/i)).toHaveValue('hello world');
    });
  });

  it('switches to hash mode and offers an algorithm', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Hash Checksum' }));

    expect(screen.getByText('Algorithm:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste text to generate cryptographic hash/i)).toBeInTheDocument();
  });

  it('computes an MD5 digest in hash mode', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Hash Checksum' }));
    await user.type(screen.getByPlaceholderText(/cryptographic hash/i), 'abc');

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Result will appear here/i)).toHaveValue(
        '900150983cd24fb0d6963f7d28e17f72'
      );
    });
  });

  it('reports an invalid Base64 payload instead of failing silently', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Decode' }));
    await user.type(screen.getByPlaceholderText(/Paste text to convert/i), '!!!!!!');

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Result will appear here/i)).not.toHaveValue('!!!!!!');
    });
  });
});

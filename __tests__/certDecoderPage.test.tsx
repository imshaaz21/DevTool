import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import CertDecoderPage from '@/app/cert-decoder/page';
import { SidebarProvider } from '@/components/SidebarContext';
import { RSA_CERT_PEM, EC_CERT_PEM } from './fixtures/certificates';

jest.mock('next/navigation', () => ({
  usePathname: () => '/cert-decoder',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

const toastError = jest.fn();
jest.mock('react-hot-toast', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: jest.fn() },
}));

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

function renderPage() {
  return render(
    <SidebarProvider>
      <CertDecoderPage />
    </SidebarProvider>
  );
}

const input = () => screen.getByLabelText('Certificate in PEM format');
const setValue = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });

describe('CertDecoderPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    toastError.mockClear();
  });

  it('starts with nothing decoded', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'X.509 Certificate Decoder' })).toBeInTheDocument();
    expect(screen.queryByText('Fingerprints')).not.toBeInTheDocument();
  });

  it('decodes a certificate into subject, issuer and key details', () => {
    renderPage();

    setValue(input(), RSA_CERT_PEM);

    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Issuer')).toBeInTheDocument();
    expect(screen.getAllByText('devtools.test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DevTools Suite').length).toBeGreaterThan(0);
    expect(screen.getByText('14EA6B765BC7E1C15A595E6AD29070CFC7BA7020')).toBeInTheDocument();
    expect(screen.getByText('SHA-256 with RSA')).toBeInTheDocument();
    expect(screen.getByText('RSA 2048 bit')).toBeInTheDocument();
    expect(screen.getByText('X.509 v3')).toBeInTheDocument();
  });

  it('flags a self signed CA', () => {
    renderPage();

    setValue(input(), RSA_CERT_PEM);

    expect(screen.getByText('self signed')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('lists the subject alternative names', () => {
    renderPage();

    setValue(input(), RSA_CERT_PEM);

    expect(screen.getByText(/Subject alternative names \(4\)/)).toBeInTheDocument();
    expect(screen.getByText('*.devtools.test')).toBeInTheDocument();
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('ops@devtools.test')).toBeInTheDocument();
  });

  it('marks a critical extension', () => {
    renderPage();

    setValue(input(), RSA_CERT_PEM);

    expect(screen.getByText('Basic Constraints')).toBeInTheDocument();
    expect(screen.getAllByText('critical').length).toBeGreaterThan(0);
  });

  it('shows the curve for an EC certificate instead of a key size', () => {
    renderPage();

    setValue(input(), EC_CERT_PEM);

    expect(screen.getByText(/^EC /)).toBeInTheDocument();
    expect(screen.queryByText(/bit$/)).not.toBeInTheDocument();
  });

  it('computes both fingerprints', async () => {
    renderPage();

    setValue(input(), RSA_CERT_PEM);

    await waitFor(() => {
      expect(
        screen.getByText(
          '27:05:50:AD:26:8A:95:42:53:39:C4:00:24:BC:C8:07:20:AD:88:F0:40:A5:FA:4D:49:7A:3E:ED:AE:CF:36:98'
        )
      ).toBeInTheDocument();
    });
    expect(screen.getByText('SHA-1')).toBeInTheDocument();
  });

  it('refuses a private key', () => {
    renderPage();

    setValue(input(), '-----BEGIN PRIVATE KEY-----\nMIIabc\n-----END PRIVATE KEY-----');

    expect(screen.getByText(/That is a private key/)).toBeInTheDocument();
    expect(screen.queryByText('Subject')).not.toBeInTheDocument();
  });

  it('reports input that is not a certificate', () => {
    renderPage();

    setValue(input(), 'hello <there>');

    expect(screen.getByText(/No PEM certificate block found/)).toBeInTheDocument();
  });

  it('clears the input', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(input(), RSA_CERT_PEM);
    await user.click(screen.getByTitle('Clear'));

    expect(input()).toHaveValue('');
    expect(screen.queryByText('Subject')).not.toBeInTheDocument();
  });

  it('refuses a file that cannot be a certificate', async () => {
    renderPage();

    const picker = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'bundle.zip', { type: 'application/zip' });
    fireEvent.change(picker, { target: { files: [file] } });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/not a supported certificate file/i));
    });
  });

  it('reads an accepted certificate file', async () => {
    renderPage();

    const picker = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([RSA_CERT_PEM], 'server.pem', { type: '' });
    fireEvent.change(picker, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('14EA6B765BC7E1C15A595E6AD29070CFC7BA7020')).toBeInTheDocument();
    });
    expect(toastError).not.toHaveBeenCalled();
  });

  it('copies the subject', async () => {
    const user = userEvent.setup();
    renderPage();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    setValue(input(), RSA_CERT_PEM);
    await user.click(screen.getByTitle('Copy Full subject'));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('CN=devtools.test'));
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EnvParserPage from '@/app/env-parser/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/env-parser',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

const toastError = jest.fn();
jest.mock('react-hot-toast', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: jest.fn() },
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <EnvParserPage />
    </SidebarProvider>
  );
}

const input = () => screen.getByLabelText('Dotenv file contents');
const output = () => screen.getByLabelText('Converted output') as HTMLTextAreaElement;
const setValue = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });

describe('EnvParserPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    toastError.mockClear();
  });

  it('starts empty', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: '.env Parser' })).toBeInTheDocument();
    expect(output()).toHaveValue('');
  });

  it('parses variables and lists them with line numbers', () => {
    renderPage();

    setValue(input(), 'PORT=3000\nNODE_ENV=production');

    expect(screen.getByText('PORT')).toBeInTheDocument();
    expect(screen.getByText('NODE_ENV')).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
  });

  it('converts to JSON by default', () => {
    renderPage();

    setValue(input(), 'PORT=3000');

    expect(output()).toHaveValue('{\n  "PORT": "3000"\n}');
  });

  it('converts to shell exports, Docker arguments and YAML', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(input(), 'PORT=3000');

    await user.click(screen.getByRole('button', { name: 'Shell' }));
    expect(output()).toHaveValue("export PORT='3000'");

    await user.click(screen.getByRole('button', { name: 'Docker' }));
    expect(output()).toHaveValue("-e PORT='3000'");

    await user.click(screen.getByRole('button', { name: 'YAML' }));
    expect(output()).toHaveValue('  PORT: "3000"');
  });

  it('masks a secret value until it is revealed', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(input(), 'DB_PASSWORD=supersecret');

    expect(screen.getByText('su*******et')).toBeInTheDocument();
    expect(screen.queryByText('supersecret')).not.toBeInTheDocument();
    expect(screen.getByText('secret')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Masked/i }));

    expect(screen.getByText('supersecret')).toBeInTheDocument();
  });

  it('keeps secrets out of the exported output while masked', () => {
    renderPage();

    setValue(input(), 'DB_PASSWORD=supersecret');

    expect(output().value).not.toContain('supersecret');
  });

  it('reports duplicate keys and malformed lines', () => {
    renderPage();

    setValue(input(), 'PORT=3000\nPORT=4000\nbroken line');

    expect(screen.getByText(/Defined more than once/i)).toBeInTheDocument();
    expect(screen.getByText(/No "=" on this line/)).toBeInTheDocument();
  });

  it('loads the sample', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Sample' }));

    expect(screen.getByText('API_URL')).toBeInTheDocument();
    expect(screen.getByText('export')).toBeInTheDocument();
  });

  it('refuses a file that is not a text or env file', async () => {
    renderPage();

    const picker = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'app.jar', { type: 'application/java-archive' });
    fireEvent.change(picker, { target: { files: [file] } });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/not a supported env or text file/i));
    });
    expect(input()).toHaveValue('');
  });

  it('reads an accepted file into the editor', async () => {
    renderPage();

    const picker = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['PORT=8080'], '.env', { type: '' });
    fireEvent.change(picker, { target: { files: [file] } });

    await waitFor(() => {
      expect(input()).toHaveValue('PORT=8080');
    });
    expect(toastError).not.toHaveBeenCalled();
  });
});

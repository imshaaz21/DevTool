import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import YamlJsonPage from '@/app/yaml-json/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/yaml-json',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <YamlJsonPage />
    </SidebarProvider>
  );
}

const setValue = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });

describe('YamlJsonPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts in the YAML to JSON direction', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'YAML and JSON Converter' })).toBeInTheDocument();
    expect(screen.getByLabelText('YAML input')).toBeInTheDocument();
    expect(screen.getByLabelText('JSON output')).toBeInTheDocument();
  });

  it('converts YAML to JSON', async () => {
    renderPage();

    setValue(screen.getByLabelText('YAML input'), 'name: payments\nreplicas: 3');

    await waitFor(() => {
      expect(screen.getByLabelText('JSON output')).toHaveValue(
        '{\n  "name": "payments",\n  "replicas": 3\n}'
      );
    });
  });

  it('honours the indent choice', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(screen.getByLabelText('YAML input'), 'a: 1');
    await user.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() => {
      expect(screen.getByLabelText('JSON output')).toHaveValue('{\n    "a": 1\n}');
    });
  });

  it('reports a YAML syntax error with the line', async () => {
    renderPage();

    setValue(screen.getByLabelText('YAML input'), 'a: 1\n  b: 2\nc: 3');

    await waitFor(() => {
      expect(screen.getByText(/\(line \d+\)/)).toBeInTheDocument();
    });
  });

  it('offers the other direction when the input is JSON', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(screen.getByLabelText('YAML input'), '{"a": 1 "b": 2}');

    const suggestion = await screen.findByRole('button', { name: /looks like JSON/i });
    await user.click(suggestion);

    expect(screen.getByLabelText('JSON input')).toBeInTheDocument();
  });

  it('swaps the direction and carries the output across', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(screen.getByLabelText('YAML input'), 'a: 1');
    await waitFor(() => {
      expect(screen.getByLabelText('JSON output')).toHaveValue('{\n  "a": 1\n}');
    });

    await user.click(screen.getByRole('button', { name: /Swap/i }));

    expect(screen.getByLabelText('JSON input')).toHaveValue('{\n  "a": 1\n}');
    await waitFor(() => {
      expect(screen.getByLabelText('YAML output')).toHaveValue('a: 1\n');
    });
  });

  it('sorts keys only when asked, and only for JSON to YAML', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Swap/i }));
    setValue(screen.getByLabelText('JSON input'), '{"b":1,"a":2}');

    await waitFor(() => {
      expect(screen.getByLabelText('YAML output')).toHaveValue('b: 1\na: 2\n');
    });

    await user.click(screen.getByRole('button', { name: 'Sort keys' }));

    await waitFor(() => {
      expect(screen.getByLabelText('YAML output')).toHaveValue('a: 2\nb: 1\n');
    });
  });

  it('loads the sample', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Sample/i }));

    await waitFor(() => {
      expect((screen.getByLabelText('JSON output') as HTMLTextAreaElement).value).toContain(
        '"name": "payments-api"'
      );
    });
  });

  it('clears the input', async () => {
    const user = userEvent.setup();
    renderPage();

    setValue(screen.getByLabelText('YAML input'), 'a: 1');
    await user.click(screen.getByTitle('Clear'));

    expect(screen.getByLabelText('YAML input')).toHaveValue('');
    expect(screen.getByLabelText('JSON output')).toHaveValue('');
  });

  it('copies the output', async () => {
    const user = userEvent.setup();
    renderPage();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    setValue(screen.getByLabelText('YAML input'), 'a: 1');
    await waitFor(() => {
      expect(screen.getByLabelText('JSON output')).toHaveValue('{\n  "a": 1\n}');
    });

    await user.click(screen.getByRole('button', { name: /Copy JSON/i }));

    expect(writeText).toHaveBeenCalledWith('{\n  "a": 1\n}');
  });
});

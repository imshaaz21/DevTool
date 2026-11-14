import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SidebarProvider, useSidebar } from '@/components/SidebarContext';

function Probe() {
  const { isCollapsed, toggleSidebar, width } = useSidebar();
  return (
    <div>
      <span data-testid="state">{String(isCollapsed)}</span>
      <span data-testid="width">{width}</span>
      <button type="button" onClick={toggleSidebar}>
        Toggle
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <SidebarProvider>
      <Probe />
    </SidebarProvider>
  );
}

describe('SidebarContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('starts expanded by default', () => {
    renderProbe();

    expect(screen.getByTestId('state')).toHaveTextContent('false');
    expect(screen.getByTestId('width')).toHaveTextContent('256px');
  });

  it('restores the collapsed state from a previous visit', () => {
    window.localStorage.setItem('sidebar-collapsed', 'true');
    renderProbe();

    expect(screen.getByTestId('state')).toHaveTextContent('true');
    expect(screen.getByTestId('width')).toHaveTextContent('80px');
  });

  it('persists the state when toggled', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('state')).toHaveTextContent('true');
    expect(window.localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('still renders when reading storage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    renderProbe();

    expect(screen.getByTestId('state')).toHaveTextContent('false');
  });

  it('still toggles when writing to storage throws', async () => {
    const user = userEvent.setup();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.getByTestId('state')).toHaveTextContent('true');
  });

  it('fails loudly when used outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/within a SidebarProvider/);

    consoleError.mockRestore();
  });
});

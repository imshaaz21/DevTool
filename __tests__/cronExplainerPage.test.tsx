import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CronExplainerPage from '@/app/cron-explainer/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/cron-explainer',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

function renderPage() {
  return render(
    <SidebarProvider>
      <CronExplainerPage />
    </SidebarProvider>
  );
}

const expressionInput = () => screen.getByLabelText('Cron expression');

describe('CronExplainerPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('explains the expression it starts with', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Cron Expression Explainer' })).toBeInTheDocument();
    expect(
      screen.getByText('At 09:00, on Monday, Tuesday, Wednesday, Thursday and Friday.')
    ).toBeInTheDocument();
  });

  it('explains a typed expression', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(expressionInput());
    await user.type(expressionInput(), '*/15 * * * *');

    expect(screen.getByText(/minute 0, 15, 30, 45/)).toBeInTheDocument();
  });

  it('lists each field with its range', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(expressionInput());
    await user.type(expressionInput(), '0 0 1 * *');

    expect(screen.getByText('day of month')).toBeInTheDocument();
    expect(screen.getByText('1-31')).toBeInTheDocument();
    expect(screen.getByText('0-6 or SUN-SAT')).toBeInTheDocument();
  });

  it('reports an invalid expression instead of a description', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(expressionInput());
    await user.type(expressionInput(), '* * *');

    expect(screen.getByText(/Expected 5 fields/)).toBeInTheDocument();
    expect(screen.queryByText(/Next runs/)).not.toBeInTheDocument();
  });

  it('explains why a vendor extension is refused', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(expressionInput());
    await user.type(expressionInput(), '0 0 L * *');

    expect(screen.getByText(/vendor extension/)).toBeInTheDocument();
  });

  it('applies a preset', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Daily at midnight' }));

    expect(expressionInput()).toHaveValue('0 0 * * *');
    expect(screen.getByText('At 00:00, every day.')).toBeInTheDocument();
  });

  it('lists the next run times in UTC', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Every hour' }));

    expect(screen.getByText('Next runs (UTC)')).toBeInTheDocument();
    const runs = screen.getAllByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(runs).toHaveLength(8);
  });

  it('says so when an expression can never fire', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(expressionInput());
    await user.type(expressionInput(), '0 0 30 2 *');

    expect(screen.getByText(/never fires within the next year/i)).toBeInTheDocument();
  });

  it('copies the expression', async () => {
    const user = userEvent.setup();
    renderPage();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await user.click(screen.getByRole('button', { name: /Copy/i }));

    expect(writeText).toHaveBeenCalledWith('0 9 * * MON-FRI');
  });
});

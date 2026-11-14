import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NotFound from '@/app/not-found';
import ErrorBoundary from '@/app/error';
import GlobalError from '@/app/global-error';

describe('not found page', () => {
  it('explains the problem and links back to the suite', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: /does not exist/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to all tools/i })).toHaveAttribute('href', '/');
  });
});

describe('route error boundary', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a recoverable message rather than a blank screen', () => {
    render(<ErrorBoundary error={error} reset={jest.fn()} />);

    expect(screen.getByRole('heading', { name: /hit an error/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all tools/i })).toHaveAttribute('href', '/');
  });

  it('surfaces the digest so a report can be traced', () => {
    render(<ErrorBoundary error={error} reset={jest.fn()} />);

    expect(screen.getByText(/digest: abc123/)).toBeInTheDocument();
  });

  it('retries the route when asked', async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    render(<ErrorBoundary error={error} reset={reset} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('logs the error for the console', () => {
    render(<ErrorBoundary error={error} reset={jest.fn()} />);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});

describe('global error boundary', () => {
  // It renders its own <html>/<body>, which React will warn about in jsdom.
  const error = Object.assign(new Error('fatal'), { digest: 'xyz789' });

  it('offers a reload without relying on the stylesheet', async () => {
    const user = userEvent.setup();
    const reset = jest.fn();
    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByRole('heading', { name: /failed to start/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /reload/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

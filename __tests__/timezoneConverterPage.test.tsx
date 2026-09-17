import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeZoneConverterPage from '@/app/timezone-converter/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/timezone-converter',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('TimeZoneConverterPage', () => {
  it('renders timezone cards with time and unix epoch values', () => {
    render(
      <SidebarProvider>
        <TimeZoneConverterPage />
      </SidebarProvider>
    );

    expect(screen.getByText('Time Zone Converter')).toBeInTheDocument();

    // Type a timestamp into the input
    const input = screen.getByPlaceholderText('e.g. 2026-04-04 11:21:40 or unix epoch 1712568051409');
    fireEvent.change(input, { target: { value: '2026-04-04 12:00:00' } });

    // Verify all 3 timezone cards are displayed
    expect(screen.getAllByText('UTC').length).toBeGreaterThan(0);
    expect(screen.getByText('Saudi Arabia')).toBeInTheDocument();
    expect(screen.getByText('Sri Lanka')).toBeInTheDocument();

    // Verify Unix Epoch displays are rendered for each card
    const epochSecLabels = screen.getAllByText('Epoch (s)');
    expect(epochSecLabels.length).toBe(3);

    const epochMsLabels = screen.getAllByText('Epoch (ms)');
    expect(epochMsLabels.length).toBe(3);

    // Verify Copy Timestamp buttons
    const copyButtons = screen.getAllByText('Copy Timestamp');
    expect(copyButtons.length).toBe(3);
  });

  it('calculates conversions and epoch when inputting numeric epoch', () => {
    render(
      <SidebarProvider>
        <TimeZoneConverterPage />
      </SidebarProvider>
    );

    const input = screen.getByPlaceholderText('e.g. 2026-04-04 11:21:40 or unix epoch 1712568051409');
    fireEvent.change(input, { target: { value: '1712232000' } });

    // Should display matching epoch seconds across all 3 cards
    expect(screen.getAllByText('1712232000').length).toBe(3);
    expect(screen.getAllByText('1712232000000').length).toBe(3);
  });
});

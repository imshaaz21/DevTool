import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JsonPathAggregatorPage from '@/app/json-path-aggregator/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/json-path-aggregator',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('JsonPathAggregatorPage', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders page and calculates sum for default healthcare invoice sample', () => {
    render(
      <SidebarProvider>
        <JsonPathAggregatorPage />
      </SidebarProvider>
    );

    expect(screen.getByText('JSON Path & Aggregator')).toBeInTheDocument();

    // Default query is services.*.companyShareAmount -> sum: 325.6
    expect(screen.getByText('325.6')).toBeInTheDocument();
    expect(screen.getByText(/Total Sum/i)).toBeInTheDocument();
  });

  it('allows changing pattern to calculate different field sums', () => {
    render(
      <SidebarProvider>
        <JsonPathAggregatorPage />
      </SidebarProvider>
    );

    const queryInput = screen.getByPlaceholderText(/services\.\*\.companyShareAmount/i);
    fireEvent.change(queryInput, { target: { value: 'companyTax' } });

    // companyTax in sample is 14.4 + 34.44 = 48.84
    expect(screen.getByText('48.84')).toBeInTheDocument();
  });

  it('renders extracted table and switches view tabs', () => {
    render(
      <SidebarProvider>
        <JsonPathAggregatorPage />
      </SidebarProvider>
    );

    // Click JSON Array tab
    const jsonTab = screen.getByText('JSON Array');
    fireEvent.click(jsonTab);

    expect(screen.getByText(/\[\s*96,\s*229\.6\s*\]/)).toBeInTheDocument();

    // Click Values List tab
    const listTab = screen.getByText('Values List');
    fireEvent.click(listTab);

    expect(
      screen.getByText((content, element) => element?.tagName === 'PRE' && content.includes('96') && content.includes('229.6'))
    ).toBeInTheDocument();
  });

  it('handles copying sum and values to clipboard', async () => {
    render(
      <SidebarProvider>
        <JsonPathAggregatorPage />
      </SidebarProvider>
    );

    const copySumBtn = screen.getByText('Copy');
    fireEvent.click(copySumBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('325.6');
  });
});

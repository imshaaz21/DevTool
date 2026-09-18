import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JsonDiffV2Page from '@/app/json-diff-v2/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/json-diff-v2',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('JsonDiffV2Page', () => {
  it('renders with clean empty inputs by default (no dummy data loaded)', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    expect(screen.getAllByText('JSON Diff v2').length).toBeGreaterThan(0);
    expect(screen.getByText('Sample Data')).toBeInTheDocument();
    expect(screen.getByText('Left JSON (Original)')).toBeInTheDocument();
    expect(screen.getByText('Right JSON (Modified)')).toBeInTheDocument();
    expect(screen.getByText('Compare Semantic Diff')).toBeInTheDocument();

    const leftTextarea = screen.getByPlaceholderText('Enter left JSON to compare...') as HTMLTextAreaElement;
    const rightTextarea = screen.getByPlaceholderText('Enter right JSON to compare...') as HTMLTextAreaElement;
    expect(leftTextarea.value).toBe('');
    expect(rightTextarea.value).toBe('');
  });

  it('loads sample data when Sample Data button is clicked', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    // Click Sample Data
    const sampleBtn = screen.getByText('Sample Data');
    fireEvent.click(sampleBtn);

    expect(screen.getByText(/Found 20 semantic differences/i)).toBeInTheDocument();
    expect(screen.getByText('Left (Original)')).toBeInTheDocument();
    expect(screen.getByText('Right (Modified)')).toBeInTheDocument();
  });

  it('allows navigating differences with next and prev buttons', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Sample Data'));

    expect(screen.getByText('1 of 20')).toBeInTheDocument();
    const nextBtn = screen.getByTitle('Next difference (Right Arrow)');
    fireEvent.click(nextBtn);
    expect(screen.getByText('2 of 20')).toBeInTheDocument();

    const prevBtn = screen.getByTitle('Previous difference (Left Arrow)');
    fireEvent.click(prevBtn);
    expect(screen.getByText('1 of 20')).toBeInTheDocument();
  });

  it('filters differences when toggling checkboxes', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Sample Data'));

    // Initial 20
    expect(screen.getByText('1 of 20')).toBeInTheDocument();

    // Uncheck missing properties (11 missing) -> 20 - 11 = 9 left
    const missingCheckbox = screen.getByLabelText(/missing/i);
    fireEvent.click(missingCheckbox);

    expect(screen.getByText('1 of 9')).toBeInTheDocument();
  });
});

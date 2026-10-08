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

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

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

  it('switches between Visual Diff, Key Diffs, Values & Types, and Summary tabs', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Sample Data'));

    // Switch to Key Diffs
    fireEvent.click(screen.getByText('Key Diffs'));
    expect(screen.getByText('Missing in Right (Original Left Only)')).toBeInTheDocument();
    expect(screen.getByText('Missing in Left (Modified Right Only)')).toBeInTheDocument();

    // Switch to Values & Types
    fireEvent.click(screen.getByText('Values & Types'));
    expect(screen.getByText('Value & Type Differences')).toBeInTheDocument();

    // Switch to Summary
    fireEvent.click(screen.getByText('Summary'));
    expect(screen.getByText('Total Diffs')).toBeInTheDocument();
    expect(screen.getByText('Copy Full Report (.md)')).toBeInTheDocument();
    expect(screen.getByText('Copy Summary Stats')).toBeInTheDocument();

    // Switch back to Visual Diff
    fireEvent.click(screen.getByText('Visual Diff'));
    expect(screen.getByText('Left (Original)')).toBeInTheDocument();
    expect(screen.getByText('Difference Inspector')).toBeInTheDocument();
    expect(screen.getByText('Copy .md')).toBeInTheDocument();
  });

  it('supports copying and downloading reports from Difference Inspector and Summary tab', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Sample Data'));

    // Check Difference Inspector buttons
    const copyMdBtn = screen.getByText('Copy .md');
    expect(copyMdBtn).toBeInTheDocument();
    fireEvent.click(copyMdBtn);
    expect(screen.getByText('Copied')).toBeInTheDocument();

    // Switch to Summary tab
    fireEvent.click(screen.getByText('Summary'));
    const fullReportBtn = screen.getByText('Copy Full Report (.md)');
    fireEvent.click(fullReportBtn);
    expect(screen.getByText('Copied Full Report')).toBeInTheDocument();
  });
});

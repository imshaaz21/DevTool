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
  it('renders header, sample data, and diff view by default', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    expect(screen.getAllByText('JSON Diff v2').length).toBeGreaterThan(0);
    expect(screen.getByText('Sample Data')).toBeInTheDocument();
    expect(screen.getByText(/Found 20 semantic differences/i)).toBeInTheDocument();
    expect(screen.getByText('Left (Original)')).toBeInTheDocument();
    expect(screen.getByText('Right (Modified)')).toBeInTheDocument();
  });

  it('toggles edit inputs and diff view', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

    // Click Edit Inputs
    const editBtn = screen.getByText('Edit Inputs');
    fireEvent.click(editBtn);

    expect(screen.getByText('Left JSON (Original)')).toBeInTheDocument();
    expect(screen.getByText('Right JSON (Modified)')).toBeInTheDocument();
    expect(screen.getByText('Compare Semantic Diff')).toBeInTheDocument();

    // Click Compare Semantic Diff
    fireEvent.click(screen.getByText('Compare Semantic Diff'));
    expect(screen.getByText(/Found 20 semantic differences/i)).toBeInTheDocument();
  });

  it('allows navigating differences with next and prev buttons', () => {
    render(
      <SidebarProvider>
        <JsonDiffV2Page />
      </SidebarProvider>
    );

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

    // Initial 20
    expect(screen.getByText('1 of 20')).toBeInTheDocument();

    // Uncheck missing properties (11 missing) -> 20 - 11 = 9 left
    const missingCheckbox = screen.getByLabelText(/missing/i);
    fireEvent.click(missingCheckbox);

    expect(screen.getByText('1 of 9')).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListComparePage from '@/app/list-compare/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/list-compare',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('ListComparePage', () => {
  it('renders header, inputs and tabs', () => {
    render(
      <SidebarProvider>
        <ListComparePage />
      </SidebarProvider>
    );

    expect(screen.getByText('List Compare & Formatter')).toBeInTheDocument();
    expect(screen.getByText('Load Sample')).toBeInTheDocument();
    expect(screen.getByText('List A (Source)')).toBeInTheDocument();
    expect(screen.getByText('List B (Target)')).toBeInTheDocument();
    expect(screen.getByText('Common in Both (A ∩ B)')).toBeInTheDocument();
    expect(screen.getByText('Only in List A (A \\ B)')).toBeInTheDocument();
    expect(screen.getByText('Only in List B (B \\ A)')).toBeInTheDocument();
  });

  it('loads sample data and calculates comparison correctly', () => {
    render(
      <SidebarProvider>
        <ListComparePage />
      </SidebarProvider>
    );

    // Click Load Sample
    fireEvent.click(screen.getByText('Load Sample'));

    // Check that common items are detected in output textarea
    const textarea = screen.getByPlaceholderText('Formatted output will appear here...') as HTMLTextAreaElement;
    expect(textarea.value).toContain('INV-S2026082569839346983934');
    expect(textarea.value).toContain('INV-S2026081165646936564693');

    // Check duplicate badge detected in List A
    expect(screen.getAllByText(/dupes/i).length).toBeGreaterThan(0);
  });

  it('switches tabs and updates items shown', () => {
    render(
      <SidebarProvider>
        <ListComparePage />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Load Sample'));

    // Switch to 'Only in List A'
    fireEvent.click(screen.getByText('Only in List A (A \\ B)'));
    const textarea = screen.getByPlaceholderText('Formatted output will appear here...') as HTMLTextAreaElement;
    expect(textarea.value).toContain('INV-S2026082369196656919665');
    expect(textarea.value).toContain('INV-S2026082770727072704');
  });

  it('formats output with single and double quotes', () => {
    render(
      <SidebarProvider>
        <ListComparePage />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Load Sample'));

    // By default quoteStyle is 'single'
    const textarea = screen.getByPlaceholderText('Formatted output will appear here...') as HTMLTextAreaElement;
    expect(textarea.value).toContain("'INV-S2026082569839346983934'");

    // Switch to double quotes
    fireEvent.click(screen.getByTitle('Double quotes ("val") - ideal for JSON & code'));
    expect(textarea.value).toContain('"INV-S2026082569839346983934"');

    // Switch to no quotes
    fireEvent.click(screen.getByTitle('No quotes (plain text)'));
    expect(textarea.value).not.toContain('"INV-S2026082569839346983934"');
    expect(textarea.value).toContain('INV-S2026082569839346983934');
  });

  it('clears all inputs when clicking Clear button', () => {
    render(
      <SidebarProvider>
        <ListComparePage />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Load Sample'));
    fireEvent.click(screen.getByText('Clear'));

    const textarea = screen.getByPlaceholderText('Formatted output will appear here...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('toggles duplicate removal with default ON', () => {
    render(
      <SidebarProvider>
        <ListComparePage />
      </SidebarProvider>
    );

    expect(screen.getByText('Duplicates: Remove')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Duplicates: Remove'));
    expect(screen.getByText('Duplicates: Keep')).toBeInTheDocument();
  });
});

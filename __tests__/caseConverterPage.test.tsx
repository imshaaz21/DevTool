import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseConverterPage from '@/app/case-converter/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock URL createObjectURL
window.URL.createObjectURL = jest.fn(() => 'blob:mock');
window.URL.revokeObjectURL = jest.fn();

describe('CaseConverterPage', () => {
  const renderPage = () => {
    return render(
      <SidebarProvider>
        <CaseConverterPage />
      </SidebarProvider>
    );
  };

  it('renders page header and tabs correctly', () => {
    renderPage();
    expect(screen.getByText('Text & Case Studio')).toBeInTheDocument();
    expect(screen.getByText('All Cases Matrix')).toBeInTheDocument();
    expect(screen.getByText('Batch & Multi-Line')).toBeInTheDocument();
    expect(screen.getByText('Delimiters & Cleaner')).toBeInTheDocument();
  });

  it('displays case cards in Matrix view', () => {
    renderPage();
    expect(screen.getByText('camelCase')).toBeInTheDocument();
    expect(screen.getByText('snake_case')).toBeInTheDocument();
    expect(screen.getByText('CONSTANT_CASE')).toBeInTheDocument();
    expect(screen.getByText('kebab-case')).toBeInTheDocument();
    expect(screen.getByText('PascalCase')).toBeInTheDocument();
  });

  it('transforms input when typing into single input textarea', () => {
    renderPage();
    const textarea = screen.getByPlaceholderText(/Enter any text/i);
    fireEvent.change(textarea, { target: { value: 'order_payment_received' } });

    expect(screen.getByText('orderPaymentReceived')).toBeInTheDocument();
    expect(screen.getByText('OrderPaymentReceived')).toBeInTheDocument();
    expect(screen.getAllByText('ORDER_PAYMENT_RECEIVED').length).toBeGreaterThanOrEqual(1);
  });

  it('applies quick action buttons in matrix view', () => {
    renderPage();
    const textarea = screen.getByPlaceholderText(/Enter any text/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'hello world test' } });

    const spacesToUnderscoresBtn = screen.getByRole('button', { name: /Spaces ➔ _/i });
    fireEvent.click(spacesToUnderscoresBtn);
    expect(textarea.value).toBe('hello_world_test');

    const underscoresToSpacesBtn = screen.getByRole('button', { name: /_ ➔ Spaces/i });
    fireEvent.click(underscoresToSpacesBtn);
    expect(textarea.value).toBe('hello world test');
  });

  it('switches to Batch & Multi-Line mode and transforms lines', () => {
    renderPage();
    const batchTabBtn = screen.getByRole('button', { name: /Batch & Multi-Line/i });
    fireEvent.click(batchTabBtn);

    expect(screen.getByText('Batch Transformation Configuration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste database columns/i)).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /Copy Transformed/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('switches to Delimiters & Cleaner mode and executes transformations', () => {
    renderPage();
    const cleanerTabBtn = screen.getByRole('button', { name: /Delimiters & Cleaner/i });
    fireEvent.click(cleanerTabBtn);

    expect(screen.getByText('Find & Replace / Delimiter Rewriter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste or type text to clean/i)).toBeInTheDocument();

    const stripSpacesBtn = screen.getByRole('button', { name: /Strip All Spaces/i });
    fireEvent.click(stripSpacesBtn);

    const cleanerTextarea = screen.getByPlaceholderText(/Paste or type text to clean/i) as HTMLTextAreaElement;
    expect(cleanerTextarea.value).not.toContain(' ');
  });
});

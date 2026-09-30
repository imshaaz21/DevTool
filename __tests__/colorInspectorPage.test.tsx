import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorInspectorPage from '@/app/color-inspector/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('ColorInspectorPage', () => {
  const renderPage = () => {
    return render(
      <SidebarProvider>
        <ColorInspectorPage />
      </SidebarProvider>
    );
  };

  it('renders page header and color details', () => {
    renderPage();
    expect(screen.getByText('Hex Color Decoder & Palette Studio')).toBeInTheDocument();
    expect(screen.getAllByText('Color Inspector').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Text \/ Code Extractor/i)).toBeInTheDocument();
    expect(screen.getByText(/WCAG 2.1 Contrast & Accessibility/i)).toBeInTheDocument();
    expect(screen.getByText(/Generated Tints & Shades Palette/i)).toBeInTheDocument();
  });

  it('updates color details on hex input change', () => {
    renderPage();
    const input = screen.getByPlaceholderText(/e\.g\. #3B82F6/i);
    fireEvent.change(input, { target: { value: '#10B981' } });

    expect(screen.getAllByText('#10B981').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to extractor tab and renders extracted color chips', () => {
    renderPage();
    const extractorTabBtn = screen.getByRole('button', { name: /Text \/ Code Extractor/i });
    fireEvent.click(extractorTabBtn);

    expect(screen.getByText(/Paste Code, CSS, or JSON with Hex Colors/i)).toBeInTheDocument();
    expect(screen.getAllByText(/#3B82F6/i).length).toBeGreaterThanOrEqual(1);
  });
});

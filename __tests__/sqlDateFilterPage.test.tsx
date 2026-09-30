import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SqlDateFilterPage from '@/app/sql-date-filter/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

describe('SqlDateFilterPage', () => {
  const renderPage = () => {
    return render(
      <SidebarProvider>
        <SqlDateFilterPage />
      </SidebarProvider>
    );
  };

  it('renders page header and presets correctly', () => {
    renderPage();
    expect(screen.getByText('SQL Date & Timestamp Range Generator')).toBeInTheDocument();
    expect(screen.getByText('Last 1 Month (30 Days)')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Oracle Database')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('updates SQL outputs when column name is changed', () => {
    renderPage();
    const columnInput = screen.getByPlaceholderText('e.g. BI.CREATED_DATE');
    fireEvent.change(columnInput, { target: { value: 'INVOICE.TXN_DATE' } });

    expect(screen.getAllByText(/INVOICE\.TXN_DATE/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches presets when preset buttons are clicked', () => {
    renderPage();
    const last7DaysBtn = screen.getByRole('button', { name: 'Last 7 Days' });
    fireEvent.click(last7DaysBtn);

    expect(screen.getByText(/Dynamic Relative Expression \(SYSDATE\)/i)).toBeInTheDocument();
  });

  it('displays Saudi default timezone and UTC conversion checkbox', () => {
    renderPage();
    expect(screen.getByText(/Default: Saudi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Convert to UTC in SQL/i)).toBeChecked();
  });

  it('copies SQL code when copy button is clicked', () => {
    renderPage();
    const copyBtns = screen.getAllByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtns[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

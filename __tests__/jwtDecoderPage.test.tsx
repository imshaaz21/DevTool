import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JwtDecoderPage from '@/app/jwt-decoder/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/jwt-decoder',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('JwtDecoderPage', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders header, token input, decoded header, and payload', () => {
    render(
      <SidebarProvider>
        <JwtDecoderPage />
      </SidebarProvider>
    );

    expect(screen.getByRole('heading', { name: 'JWT Decoder' })).toBeInTheDocument();
    expect(screen.getByText('Encoded JWT Token')).toBeInTheDocument();
    expect(screen.getByText(/Header: Algorithm & Token Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Payload: Data \/ Claims/i)).toBeInTheDocument();
  });

  it('accepts and strips Bearer prefix in default sample', () => {
    render(
      <SidebarProvider>
        <JwtDecoderPage />
      </SidebarProvider>
    );

    expect(screen.getByText('Bearer (Stripped)')).toBeInTheDocument();
  });

  it('switches between sample tokens', () => {
    render(
      <SidebarProvider>
        <JwtDecoderPage />
      </SidebarProvider>
    );

    // Click Expired Sample
    const expiredBtn = screen.getByTitle(/Load sample expired token to test expiry indicator/i);
    fireEvent.click(expiredBtn);

    expect(screen.getByText('Expired')).toBeInTheDocument();

    // Click Raw Sample without Bearer
    const rawBtn = screen.getByTitle(/Load sample clean token without Bearer prefix/i);
    fireEvent.click(rawBtn);

    expect(screen.getByText('Direct Token (No Bearer)')).toBeInTheDocument();
  });

  it('clears token input on clear button click', () => {
    render(
      <SidebarProvider>
        <JwtDecoderPage />
      </SidebarProvider>
    );

    const clearBtn = screen.getByTitle('Clear input');
    fireEvent.click(clearBtn);

    const textarea = screen.getByPlaceholderText(/Paste JWT here/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('copies decoded header and payload to clipboard', () => {
    render(
      <SidebarProvider>
        <JwtDecoderPage />
      </SidebarProvider>
    );

    const copyHeaderBtn = screen.getByTitle('Copy Header JSON');
    fireEvent.click(copyHeaderBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    const copyPayloadBtn = screen.getByTitle('Copy Payload JSON');
    fireEvent.click(copyPayloadBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

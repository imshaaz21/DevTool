import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScreenPermissionDecodePage from '@/app/screen-permission-decode/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/screen-permission-decode',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('ScreenPermissionDecodePage', () => {
  it('renders the header and controls properly', () => {
    render(
      <SidebarProvider>
        <ScreenPermissionDecodePage />
      </SidebarProvider>
    );

    expect(screen.getByText('Screen Permission Decode')).toBeInTheDocument();
    expect(screen.getByText('Gzip Online')).toBeInTheDocument();
    expect(screen.getByText('Decompress (Gzip → JSON)')).toBeInTheDocument();
    expect(screen.getByText('Compress (JSON → Gzip)')).toBeInTheDocument();
    expect(screen.getByText('Load Sample Base64 Gzip')).toBeInTheDocument();
  });

  it('loads sample payload and automatically decompresses it', async () => {
    render(
      <SidebarProvider>
        <ScreenPermissionDecodePage />
      </SidebarProvider>
    );

    const loadSampleBtn = screen.getByText('Load Sample Base64 Gzip');
    fireEvent.click(loadSampleBtn);

    await waitFor(() => {
      expect(screen.getByText(/SCR_SECURITY_ROLES_MGMT/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Valid JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/compression savings/i)).toBeInTheDocument();
  });

  it('switches between Decompress and Compress modes', async () => {
    render(
      <SidebarProvider>
        <ScreenPermissionDecodePage />
      </SidebarProvider>
    );

    const compressBtn = screen.getByText('Compress (JSON → Gzip)');
    fireEvent.click(compressBtn);

    expect(screen.getByText('Load Sample JSON')).toBeInTheDocument();
    expect(screen.getByText('Compress Now')).toBeInTheDocument();

    const loadSampleBtn = screen.getByText('Load Sample JSON');
    fireEvent.click(loadSampleBtn);

    await waitFor(() => {
      expect(screen.getByText(/H4sIA/i)).toBeInTheDocument();
    });
  });

  it('shows error on invalid base64 decompression input', async () => {
    render(
      <SidebarProvider>
        <ScreenPermissionDecodePage />
      </SidebarProvider>
    );

    const textarea = screen.getByPlaceholderText(/Paste Base64-encoded Gzip/i);
    fireEvent.change(textarea, { target: { value: '!!!not-valid-base-64!!!' } });

    await waitFor(() => {
      expect(screen.getByText(/Failed to decompress data|Decompression failed/i)).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SaudiDataGeneratorPage from '@/app/saudi-data-generator/page';
import { SidebarProvider } from '@/components/SidebarContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/saudi-data-generator',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('SaudiDataGeneratorPage - Cell-wise Copy to Clipboard', () => {
  let writeTextMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    writeTextMock = jest.fn().mockImplementation(() => Promise.resolve());
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  it('renders Saudi Fake Data Generator page and table headers', async () => {
    render(
      <SidebarProvider>
        <SaudiDataGeneratorPage />
      </SidebarProvider>
    );

    expect(screen.getByRole('heading', { name: 'Saudi Fake Data Generator' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'ID Type' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'ID Number' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Name (EN / AR)' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Phone' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Gender' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'DOB' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Nationality' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Action' })).toBeInTheDocument();
    });
  });

  it('allows copying specific cell values individually (NID, English Name, Arabic Name, Email, Phone)', async () => {
    render(
      <SidebarProvider>
        <SaudiDataGeneratorPage />
      </SidebarProvider>
    );

    // Wait for records to be generated
    await waitFor(() => {
      expect(screen.getAllByTitle(/^Copy NID Number/i).length).toBeGreaterThan(0);
    });

    // 1. Copy NID / ID Number
    const copyIdButtons = screen.getAllByTitle(/^Copy NID Number/i);
    fireEvent.click(copyIdButtons[0]);
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const copiedNid = writeTextMock.mock.calls[0][0];
    expect(typeof copiedNid).toBe('string');
    expect(copiedNid.length).toBeGreaterThan(0);

    // 2. Copy English Name
    const copyEnButtons = screen.getAllByTitle('Copy English Name');
    fireEvent.click(copyEnButtons[0]);
    expect(writeTextMock).toHaveBeenCalledTimes(2);
    const copiedEnName = writeTextMock.mock.calls[1][0];
    expect(typeof copiedEnName).toBe('string');
    expect(copiedEnName).not.toContain(copiedNid);

    // 3. Copy Arabic Name
    const copyArButtons = screen.getAllByTitle('Copy Arabic Name');
    fireEvent.click(copyArButtons[0]);
    expect(writeTextMock).toHaveBeenCalledTimes(3);
    const copiedArName = writeTextMock.mock.calls[2][0];
    expect(typeof copiedArName).toBe('string');
    expect(copiedArName).not.toEqual(copiedEnName);

    // 4. Copy Email
    const copyEmailButtons = screen.getAllByTitle('Copy Email');
    fireEvent.click(copyEmailButtons[0]);
    expect(writeTextMock).toHaveBeenCalledTimes(4);
    const copiedEmail = writeTextMock.mock.calls[3][0];
    expect(copiedEmail).toContain('@');

    // 5. Copy Phone Number
    const copyPhoneButtons = screen.getAllByTitle('Copy Phone Number');
    fireEvent.click(copyPhoneButtons[0]);
    expect(writeTextMock).toHaveBeenCalledTimes(5);
    const copiedPhone = writeTextMock.mock.calls[4][0];
    expect(copiedPhone).toMatch(/^05\d{8}$/);
  });

  it('allows copying row profile JSON and all profiles JSON', async () => {
    render(
      <SidebarProvider>
        <SaudiDataGeneratorPage />
      </SidebarProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByTitle('Copy profile JSON').length).toBeGreaterThan(0);
    });

    // Copy single profile JSON
    const copyProfileButtons = screen.getAllByTitle('Copy profile JSON');
    fireEvent.click(copyProfileButtons[0]);
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const parsedProfile = JSON.parse(writeTextMock.mock.calls[0][0]);
    expect(parsedProfile).toHaveProperty('idNumber');
    expect(parsedProfile).toHaveProperty('englishName');

    // Copy all profiles JSON
    const copyAllButton = screen.getByRole('button', { name: /Copy JSON/i });
    fireEvent.click(copyAllButton);
    expect(writeTextMock).toHaveBeenCalledTimes(2);
    const parsedAll = JSON.parse(writeTextMock.mock.calls[1][0]);
    expect(Array.isArray(parsedAll)).toBe(true);
    expect(parsedAll.length).toBeGreaterThan(0);
  });
});

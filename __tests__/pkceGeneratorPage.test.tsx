import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PkceGeneratorPage from '@/app/pkce-generator/page';
import { SidebarProvider } from '@/components/SidebarContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/pkce-generator',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('PkceGeneratorPage', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders header, verifier, challenge and educational breakdown', () => {
    render(
      <SidebarProvider>
        <PkceGeneratorPage />
      </SidebarProvider>
    );

    expect(screen.getByRole('heading', { name: 'PKCE Generator & Validator' })).toBeInTheDocument();
    expect(screen.getByText('code_verifier')).toBeInTheDocument();
    expect(screen.getByText('code_challenge')).toBeInTheDocument();
    expect(screen.getByText(/Step-by-Step SHA-256 Transformation/i)).toBeInTheDocument();
  });

  it('loads example code verifier and computes expected SHA256 hex and challenge', () => {
    render(
      <SidebarProvider>
        <PkceGeneratorPage />
      </SidebarProvider>
    );

    const exampleBtn = screen.getByTitle('Load example code verifier');
    fireEvent.click(exampleBtn);

    // Verify RFC sample verifier is loaded
    expect(
      screen.getByDisplayValue('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')
    ).toBeInTheDocument();

    // Verify hex SHA-256 and Base64URL code challenge match
    expect(
      screen.getByText('13d31e961a1ad8ec2f16b10c4c982e0876a878ad6df144566ee1894acb70f9c3')
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('allows regenerating code verifiers', () => {
    render(
      <SidebarProvider>
        <PkceGeneratorPage />
      </SidebarProvider>
    );

    const generateBtn = screen.getByTitle('Generate new random code verifier');
    fireEvent.click(generateBtn);

    expect(screen.getByText('code_verifier')).toBeInTheDocument();
  });

  it('switches between S256 and plain method', () => {
    render(
      <SidebarProvider>
        <PkceGeneratorPage />
      </SidebarProvider>
    );

    const plainBtn = screen.getByTitle(/Plain string without hashing/i);
    fireEvent.click(plainBtn);

    expect(screen.getByText('method: plain')).toBeInTheDocument();
  });

  it('switches to verification mode and verifies pair', () => {
    render(
      <SidebarProvider>
        <PkceGeneratorPage />
      </SidebarProvider>
    );

    const verifyTab = screen.getByRole('button', { name: 'Verify Pair' });
    fireEvent.click(verifyTab);

    expect(screen.getByText('Match Confirmed!')).toBeInTheDocument();

    // Enter mismatching challenge
    const challengeInput = screen.getByPlaceholderText('Paste code_challenge...');
    fireEvent.change(challengeInput, { target: { value: 'mismatching-challenge' } });

    expect(screen.getByText('Challenge Mismatch')).toBeInTheDocument();
  });

  it('copies items to clipboard when copy buttons are clicked', () => {
    render(
      <SidebarProvider>
        <PkceGeneratorPage />
      </SidebarProvider>
    );

    const copyVerifierBtn = screen.getByTitle('Copy Code Verifier');
    fireEvent.click(copyVerifierBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

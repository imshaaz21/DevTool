import CryptoJS from 'crypto-js';

export const MIN_VERIFIER_LENGTH = 43;
export const MAX_VERIFIER_LENGTH = 128;
export const DEFAULT_VERIFIER_LENGTH = 64;

// RFC 7636 Section 4.1: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
export const UNRESERVED_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export interface CodeVerifierValidation {
  isValid: boolean;
  length: number;
  hasInvalidChars: boolean;
  invalidChars: string[];
  isTooShort: boolean;
  isTooLong: boolean;
  errors: string[];
}

export interface PkceResult {
  codeVerifier: string;
  codeChallenge: string;
  method: 'S256' | 'plain';
  hexSha256?: string;
  standardBase64?: string;
  validation: CodeVerifierValidation;
}

export function validateCodeVerifier(verifier: string): CodeVerifierValidation {
  const length = verifier.length;
  const isTooShort = length < MIN_VERIFIER_LENGTH;
  const isTooLong = length > MAX_VERIFIER_LENGTH;

  const invalidCharsSet = new Set<string>();
  for (const char of verifier) {
    if (!UNRESERVED_CHARACTERS.includes(char)) {
      invalidCharsSet.add(char);
    }
  }
  const invalidChars = Array.from(invalidCharsSet);
  const hasInvalidChars = invalidChars.length > 0;

  const errors: string[] = [];
  if (isTooShort) {
    errors.push(`Verifier is too short (${length} chars). RFC 7636 requires at least 43 characters.`);
  }
  if (isTooLong) {
    errors.push(`Verifier is too long (${length} chars). RFC 7636 allows at most 128 characters.`);
  }
  if (hasInvalidChars) {
    errors.push(
      `Contains invalid character(s): ${invalidChars.map((c) => JSON.stringify(c)).join(', ')}. RFC 7636 only allows [A-Za-z0-9-._~].`
    );
  }

  return {
    isValid: errors.length === 0,
    length,
    hasInvalidChars,
    invalidChars,
    isTooShort,
    isTooLong,
    errors,
  };
}

export function generateCodeVerifier(length = DEFAULT_VERIFIER_LENGTH): string {
  const targetLength = Math.max(MIN_VERIFIER_LENGTH, Math.min(MAX_VERIFIER_LENGTH, length));
  const charset = UNRESERVED_CHARACTERS;
  const randomValues = new Uint8Array(targetLength);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < targetLength; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }

  let result = '';
  for (let i = 0; i < targetLength; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

export function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deriveCodeChallenge(
  verifier: string,
  method: 'S256' | 'plain' = 'S256'
): { codeChallenge: string; hexSha256?: string; standardBase64?: string } {
  if (method === 'plain') {
    return {
      codeChallenge: verifier,
      hexSha256: undefined,
      standardBase64: undefined,
    };
  }

  const hash = CryptoJS.SHA256(verifier);
  const hexSha256 = hash.toString(CryptoJS.enc.Hex);
  const standardBase64 = hash.toString(CryptoJS.enc.Base64);
  const codeChallenge = toBase64Url(standardBase64);

  return {
    codeChallenge,
    hexSha256,
    standardBase64,
  };
}

export function computePkce(
  verifier: string,
  method: 'S256' | 'plain' = 'S256'
): PkceResult {
  const validation = validateCodeVerifier(verifier);
  const derived = deriveCodeChallenge(verifier, method);

  return {
    codeVerifier: verifier,
    codeChallenge: derived.codeChallenge,
    method,
    hexSha256: derived.hexSha256,
    standardBase64: derived.standardBase64,
    validation,
  };
}

export function verifyPkcePair(
  verifier: string,
  challenge: string,
  method: 'S256' | 'plain' = 'S256'
): {
  matches: boolean;
  expectedChallenge: string;
  verifierValidation: CodeVerifierValidation;
} {
  const verifierValidation = validateCodeVerifier(verifier);
  const { codeChallenge: expectedChallenge } = deriveCodeChallenge(verifier, method);
  const matches = expectedChallenge === challenge.trim();

  return {
    matches,
    expectedChallenge,
    verifierValidation,
  };
}

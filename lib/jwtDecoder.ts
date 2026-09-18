/**
 * JWT Decoder Utilities
 * Handles parsing, Base64URL decoding, claims inspection, and timestamp analysis.
 * Pure client-side execution ensures tokens are never transmitted externally.
 */

export interface JwtClaimInfo {
  key: string;
  value: any;
  description: string;
  isStandard: boolean;
  formattedDate?: string;
  relativeTime?: string;
  isExpired?: boolean;
}

export interface DecodedJwtResult {
  valid: boolean;
  error?: string;
  header: Record<string, any> | null;
  payload: Record<string, any> | null;
  signature: string;
  rawHeader: string;
  rawPayload: string;
  rawSignature: string;
  isExpired: boolean | null;
  expiresInText: string | null;
  issuedAtText: string | null;
  notBeforeNotice: string | null;
  algorithm: string;
  tokenType: string;
  hadBearerPrefix: boolean;
  cleanedToken: string;
}

/**
 * Strips optional "Bearer " prefix (case-insensitive) and cleans outer whitespace / quotes.
 */
export function cleanJwtToken(input: string): { cleaned: string; hadBearerPrefix: boolean } {
  let trimmed = input.trim();
  
  // Remove wrapping quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // Check for Bearer prefix (case-insensitive)
  const bearerRegex = /^bearer\s+/i;
  let hadBearerPrefix = false;
  if (bearerRegex.test(trimmed)) {
    hadBearerPrefix = true;
    trimmed = trimmed.replace(bearerRegex, '').trim();
  }

  return { cleaned: trimmed, hadBearerPrefix };
}

/**
 * Decodes a base64url encoded string to UTF-8 text.
 */
export function base64UrlDecode(base64Url: string): string {
  // Replace base64url characters with base64 standard characters
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  // Pad with '=' so length is a multiple of 4
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  // Decode base64 to binary string then to utf-8
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Use TextDecoder for full Unicode / UTF-8 compatibility
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Standard JWT claim descriptions according to RFC 7519, OpenID Connect & Keycloak.
 */
const STANDARD_CLAIMS_MAP: Record<string, string> = {
  iss: 'Issuer - Identifies the principal that issued the JWT',
  sub: 'Subject - Identifies the subject of the JWT (e.g. User ID)',
  aud: 'Audience - Identifies the recipients that the JWT is intended for',
  exp: 'Expiration Time - Identifies when the token expires',
  nbf: 'Not Before - Identifies the time before which the token must not be accepted',
  iat: 'Issued At - Identifies when the token was issued',
  jti: 'JWT ID - Unique identifier for the JWT',
  typ: 'Token Type (e.g. Bearer)',
  azp: 'Authorized Party - Client ID that requested the token',
  nonce: 'Client Nonce - Mitigates replay attacks',
  auth_time: 'Authentication Time - When user originally authenticated',
  session_state: 'Session State - Identifier for Single Sign-Out',
  acr: 'Authentication Context Class Reference',
  'allowed-origins': 'Allowed Origins - CORS allowed origins for the client',
  realm_access: 'Keycloak Realm Roles - Realm-wide roles assigned to the user',
  resource_access: 'Keycloak Client Roles - Client/resource-specific roles',
  scope: 'OAuth Scopes - Authorized permissions and profile scopes',
  roles: 'User Access Roles',
  email_verified: 'Email Verified - Verification status of email address',
  name: 'User Full Name',
  preferred_username: 'Username',
  given_name: 'Given / First Name',
  family_name: 'Family / Last Name',
  email: 'User Email Address',
};

export function getClaimDescription(key: string): string {
  return STANDARD_CLAIMS_MAP[key] || 'Custom application claim';
}

/**
 * Checks if a JWT claim is a Unix timestamp in seconds.
 */
export function isTimestampClaim(key: string, value: any): boolean {
  if (typeof value !== 'number' || value <= 0) return false;
  if (key === 'exp' || key === 'iat' || key === 'nbf' || key === 'auth_time' || key === 'updated_at') {
    return true;
  }
  // Check if value looks like a valid Unix timestamp in seconds (between year 2000 and 2100)
  return value > 946684800 && value < 4102444800;
}

/**
 * Checks if claim represents Keycloak realm_access with a roles list.
 */
export function isKeycloakRealmAccess(key: string, val: any): boolean {
  return key === 'realm_access' && typeof val === 'object' && val !== null && Array.isArray(val.roles);
}

/**
 * Checks if claim represents Keycloak resource_access with client-specific roles.
 */
export function isKeycloakResourceAccess(key: string, val: any): boolean {
  return key === 'resource_access' && typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * Formats a Unix timestamp (seconds) into human-readable date and time strings with timezone info.
 */
export function formatTimestamp(timestampInSeconds: number, timeZone?: string): {
  formatted: string;
  relative: string;
  isPast: boolean;
  timeZone: string;
  utcFormatted: string;
} {
  const date = new Date(timestampInSeconds * 1000);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const isPast = diffMs < 0;

  const absDiffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const days = Math.floor(absDiffSeconds / 86400);
  const hours = Math.floor((absDiffSeconds % 86400) / 3600);
  const minutes = Math.floor((absDiffSeconds % 3600) / 60);
  const seconds = absDiffSeconds % 60;

  let relative = '';
  if (days > 0) {
    relative = `${days}d ${hours}h ${isPast ? 'ago' : 'remaining'}`;
  } else if (hours > 0) {
    relative = `${hours}h ${minutes}m ${isPast ? 'ago' : 'remaining'}`;
  } else if (minutes > 0) {
    relative = `${minutes}m ${seconds}s ${isPast ? 'ago' : 'remaining'}`;
  } else {
    relative = `${seconds}s ${isPast ? 'ago' : 'remaining'}`;
  }

  let tz = timeZone;
  if (!tz) {
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      tz = 'UTC';
    }
  }

  let formatted = '';
  try {
    formatted = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
      timeZone: tz,
    }).format(date);
  } catch {
    formatted = date.toLocaleString();
  }

  let utcFormatted = '';
  try {
    utcFormatted = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(date) + ' UTC';
  } catch {
    utcFormatted = date.toISOString();
  }

  return { formatted, relative, isPast, timeZone: tz, utcFormatted };
}

/**
 * Decodes and thoroughly analyzes a JWT string.
 */
export function decodeJwt(tokenInput: string, userTimeZone?: string): DecodedJwtResult {
  const { cleaned, hadBearerPrefix } = cleanJwtToken(tokenInput);

  if (!cleaned) {
    return {
      valid: false,
      error: 'Empty token input. Enter or paste a JWT token (with or without Bearer prefix).',
      header: null,
      payload: null,
      signature: '',
      rawHeader: '',
      rawPayload: '',
      rawSignature: '',
      isExpired: null,
      expiresInText: null,
      issuedAtText: null,
      notBeforeNotice: null,
      algorithm: 'Unknown',
      tokenType: 'JWT',
      hadBearerPrefix,
      cleanedToken: '',
    };
  }

  const parts = cleaned.split('.');
  if (parts.length < 2 || parts.length > 3) {
    return {
      valid: false,
      error: `Invalid JWT format. Expected 3 segments separated by dots (header.payload.signature), but found ${parts.length} segment(s).`,
      header: null,
      payload: null,
      signature: '',
      rawHeader: parts[0] || '',
      rawPayload: parts[1] || '',
      rawSignature: parts[2] || '',
      isExpired: null,
      expiresInText: null,
      issuedAtText: null,
      notBeforeNotice: null,
      algorithm: 'Unknown',
      tokenType: 'JWT',
      hadBearerPrefix,
      cleanedToken: cleaned,
    };
  }

  const rawHeader = parts[0];
  const rawPayload = parts[1];
  const rawSignature = parts[2] || '';

  let header: Record<string, any> | null = null;
  let payload: Record<string, any> | null = null;

  try {
    const decodedHeaderStr = base64UrlDecode(rawHeader);
    header = JSON.parse(decodedHeaderStr);
  } catch (err) {
    return {
      valid: false,
      error: `Failed to decode JWT Header: ${(err as Error).message}`,
      header: null,
      payload: null,
      signature: rawSignature,
      rawHeader,
      rawPayload,
      rawSignature,
      isExpired: null,
      expiresInText: null,
      issuedAtText: null,
      notBeforeNotice: null,
      algorithm: 'Unknown',
      tokenType: 'JWT',
      hadBearerPrefix,
      cleanedToken: cleaned,
    };
  }

  try {
    const decodedPayloadStr = base64UrlDecode(rawPayload);
    payload = JSON.parse(decodedPayloadStr);
  } catch (err) {
    return {
      valid: false,
      error: `Failed to decode JWT Payload / Claims: ${(err as Error).message}`,
      header,
      payload: null,
      signature: rawSignature,
      rawHeader,
      rawPayload,
      rawSignature,
      isExpired: null,
      expiresInText: null,
      issuedAtText: null,
      notBeforeNotice: null,
      algorithm: header?.alg || 'Unknown',
      tokenType: header?.typ || 'JWT',
      hadBearerPrefix,
      cleanedToken: cleaned,
    };
  }

  // Analyze timestamps
  let isExpired: boolean | null = null;
  let expiresInText: string | null = null;
  let issuedAtText: string | null = null;
  let notBeforeNotice: string | null = null;

  let resolvedTimeZone = userTimeZone;
  if (!resolvedTimeZone) {
    try {
      resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      resolvedTimeZone = 'UTC';
    }
  }

  if (payload && typeof payload.exp === 'number') {
    const { formatted, relative, isPast, timeZone: tz } = formatTimestamp(payload.exp, resolvedTimeZone);
    isExpired = isPast;
    expiresInText = isPast
      ? `Expired ${relative} (${formatted} · ${tz})`
      : `Active · ${relative} (${formatted} · ${tz})`;
  }

  if (payload && typeof payload.iat === 'number') {
    const { formatted, relative, timeZone: tz } = formatTimestamp(payload.iat, resolvedTimeZone);
    issuedAtText = `${relative} (${formatted} · ${tz})`;
  }

  if (payload && typeof payload.nbf === 'number') {
    if (payload.nbf === 0) {
      notBeforeNotice = 'Immediately valid (no delay)';
    } else {
      const { formatted, isPast, timeZone: tz } = formatTimestamp(payload.nbf, resolvedTimeZone);
      notBeforeNotice = isPast ? `Active since ${formatted} (${tz})` : `Not valid until ${formatted} (${tz})`;
    }
  }

  return {
    valid: true,
    header,
    payload,
    signature: rawSignature,
    rawHeader,
    rawPayload,
    rawSignature,
    isExpired,
    expiresInText,
    issuedAtText,
    notBeforeNotice,
    algorithm: header?.alg || 'None',
    tokenType: header?.typ || 'JWT',
    hadBearerPrefix,
    cleanedToken: cleaned,
  };
}

/**
 * Sample JWTs for instant user demonstration and testing.
 */
export const SAMPLE_ACTIVE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaSBBbC1TaGFocmFuaSIsImVtYWlsIjoiYWxpLnNoYWhyYW5pQGNzaS5jb20iLCJyb2xlcyI6WyJBRE1JTiIsIkRFVkVMT1BFUiJdLCJpYXQiOjE3NDI1NTUyMDAsImV4cCI6MTk5NDk3MjgwMCwiaXNzIjoiZGV2dG9vbHMuaW50ZXJuYWwifQ.G3K4D8iZkK8u9K9R8ZfH5N6J1M0L4P9O3Q2S1U0W8Y';

export const SAMPLE_BEARER_JWT = `Bearer ${SAMPLE_ACTIVE_JWT}`;

export const SAMPLE_EXPIRED_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTk5NDIxIiwibmFtZSI6IlNhcmFoIEhhc3NhbiIsImVtYWlsIjoic2FyYWguaEBjc2kuY29tIiwicm9sZXMiOlsidmlld2VyIl0sImlhdCI6MTY3MjUyODAwMCwiZXhwIjoxNjc1MTIwMDAwLCJpc3MiOiJkZXZ0b29scy5pbnRlcm5hbCJ9.dGVzdC1zaWduYXR1cmUtZm9yLWV4cGlyZWQtdG9rZW4tc2FtcGxl';

export const SAMPLE_KEYCLOAK_JWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2M2QyZTk3NC04M2MwLTRlMzgtODdhZi1mYWFlY2Q3ODljOWQiLCJleHAiOjE3ODk3MzM5MjAsIm5iZiI6MCwiaWF0IjoxNzg5NzIzMTIwLCJpc3MiOiJodHRwczovL2FwcGhpc3MxdmkubW9oLmdvdi5zYS9hdXRoL3JlYWxtcy9hcHBoaXNzMXZpIiwiYXVkIjpbInJlYWxtLW1hbmFnZW1lbnQiLCJzdXBlcnNldCIsImFjY291bnQiXSwic3ViIjoiNmNlNDVlYzgtZTI4Ni00M2Y2LTlkYjEtMGEwYTViZjMwYmFlIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYXBwIiwibm9uY2UiOiIwYzRiNmUwMC1lNDVlLTQ2OWQtODAwOC04ZTRkNjYwNWI5YzMiLCJhdXRoX3RpbWUiOjE3ODk3MTE2NjgsInNlc3Npb25fc3RhdGUiOiI4NmNiZjA0NC0zN2E2LTRmZTYtYTE5ZS0wYjQxZjM5Njg4OTQiLCJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImhoYyBkb2N0b3IiLCJMYWIgQWRtaW5pc3RyYXRvciIsIkNvbmZpZ3VyYXRpb24iLCJvZmZsaW5lX2FjY2VzcyIsIkFwcGxpY2F0aW9uIFN1cHBvcnQiLCJ1bWFfYXV0aG9yaXphdGlvbiIsIkRvY3RvciIsIkJpbGxpbmcgTWFzdGVyIEFkbWluIiwiRVIgRG9jdG9yIiwiQmxvb2QgQmFuayBEb2N0b3IiLCJOdXJzZSIsIkJsb29kIEJhbmsgTWFuYWdlciJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFwcCI6eyJyb2xlcyI6WyJicm93c2VyLWluc3BlY3RvciJdfSwicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LXJlYWxtIl19LCJzdXBlcnNldCI6eyJyb2xlcyI6WyJIb3NwaXRhbF9XaXNlX1JlYWRfT25seV9Vc2VyX0VSIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJyb2xlcyI6WyJIb3NwaXRhbF9XaXNlX1JlYWRfT25seV9Vc2VyX0VSIl0sIm5hbWUiOiJNT0hBIGRvY3RvciIsInByZWZlcnJlZF91c2VybmFtZSI6ImwzIiwiZ2l2ZW5fbmFtZSI6Ik1PSEEiLCJmYW1pbHlfbmFtZSI6ImRvY3RvciIsImVtYWlsIjoiY3Nkb2N0b3JAbW9oLmdvdi5zYSJ9.mock-keycloak-signature';


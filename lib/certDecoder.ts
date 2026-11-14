/**
 * X.509 certificate decoding.
 *
 * Reads a PEM or DER certificate entirely in the browser: nothing is uploaded,
 * which matters because people paste production certificates into these tools.
 * Only the public half of a certificate is ever parsed; a private key pasted
 * here is detected and refused rather than displayed.
 */
import {
  TAG,
  TAG_CLASS,
  type Asn1Node,
  parseAsn1,
  decodeOid,
  decodeInteger,
  decodeString,
  decodeTime,
  toHex,
  base64ToBytes,
} from './asn1';

export interface NamePart {
  oid: string;
  label: string;
  value: string;
}

export interface CertificateName {
  parts: NamePart[];
  /** One line summary, in the usual CN=..., O=..., C=... order. */
  text: string;
  commonName?: string;
  organisation?: string;
  country?: string;
}

export interface SubjectAltNames {
  dns: string[];
  ip: string[];
  email: string[];
  uri: string[];
}

export interface CertificateExtension {
  oid: string;
  label: string;
  critical: boolean;
  value: string;
}

export interface DecodedCertificate {
  version: number;
  serialNumber: string;
  signatureAlgorithm: string;
  issuer: CertificateName;
  subject: CertificateName;
  notBefore: Date | null;
  notAfter: Date | null;
  publicKeyAlgorithm: string;
  publicKeySize?: number;
  publicKeyCurve?: string;
  subjectAltNames: SubjectAltNames;
  extensions: CertificateExtension[];
  isSelfSigned: boolean;
  isCa: boolean;
  /** Bytes of the certificate, for fingerprinting. */
  der: Uint8Array;
}

export interface CertificateValidity {
  expired: boolean;
  notYetValid: boolean;
  daysRemaining: number;
  summary: string;
}

export interface DecodeResult {
  ok: boolean;
  error?: string;
  certificate?: DecodedCertificate;
}

const OID_LABELS: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.5': 'serialNumber',
  '2.5.4.4': 'SN',
  '2.5.4.42': 'GN',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '0.9.2342.19200300.100.1.25': 'DC',
};

const SIGNATURE_ALGORITHMS: Record<string, string> = {
  '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
  '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
  '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
  '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.10045.4.3.2': 'ECDSA with SHA-256',
  '1.2.840.10045.4.3.3': 'ECDSA with SHA-384',
  '1.2.840.10045.4.3.4': 'ECDSA with SHA-512',
  '1.3.101.112': 'Ed25519',
};

const KEY_ALGORITHMS: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.10045.2.1': 'EC',
  '1.3.101.112': 'Ed25519',
  '1.2.840.10040.4.1': 'DSA',
};

const CURVES: Record<string, string> = {
  '1.2.840.10045.3.1.7': 'P-256 (prime256v1)',
  '1.3.132.0.34': 'P-384 (secp384r1)',
  '1.3.132.0.35': 'P-521 (secp521r1)',
  '1.3.132.0.10': 'secp256k1',
};

const EXTENSION_LABELS: Record<string, string> = {
  '2.5.29.14': 'Subject Key Identifier',
  '2.5.29.15': 'Key Usage',
  '2.5.29.17': 'Subject Alternative Name',
  '2.5.29.19': 'Basic Constraints',
  '2.5.29.31': 'CRL Distribution Points',
  '2.5.29.32': 'Certificate Policies',
  '2.5.29.35': 'Authority Key Identifier',
  '2.5.29.37': 'Extended Key Usage',
  '1.3.6.1.5.5.7.1.1': 'Authority Information Access',
  '1.3.6.1.4.1.11129.2.4.2': 'Certificate Transparency SCTs',
};

const EXTENDED_KEY_USAGES: Record<string, string> = {
  '1.3.6.1.5.5.7.3.1': 'TLS server authentication',
  '1.3.6.1.5.5.7.3.2': 'TLS client authentication',
  '1.3.6.1.5.5.7.3.3': 'Code signing',
  '1.3.6.1.5.5.7.3.4': 'Email protection',
  '1.3.6.1.5.5.7.3.8': 'Timestamping',
  '1.3.6.1.5.5.7.3.9': 'OCSP signing',
};

const KEY_USAGE_BITS = [
  'Digital signature',
  'Non repudiation',
  'Key encipherment',
  'Data encipherment',
  'Key agreement',
  'Certificate signing',
  'CRL signing',
  'Encipher only',
  'Decipher only',
];

function readName(node: Asn1Node): CertificateName {
  const parts: NamePart[] = [];

  for (const rdn of node.children) {
    for (const attribute of rdn.children) {
      if (attribute.children.length < 2) continue;
      const oid = decodeOid(attribute.children[0].content);
      const value = decodeString(attribute.children[1]);
      parts.push({ oid, label: OID_LABELS[oid] ?? oid, value });
    }
  }

  const find = (label: string) => parts.find((part) => part.label === label)?.value;

  return {
    parts,
    text: parts.map((part) => `${part.label}=${part.value}`).join(', '),
    commonName: find('CN'),
    organisation: find('O'),
    country: find('C'),
  };
}

function readSubjectAltNames(content: Uint8Array): SubjectAltNames {
  const names: SubjectAltNames = { dns: [], ip: [], email: [], uri: [] };

  let sequence: Asn1Node;
  try {
    sequence = parseAsn1(content);
  } catch {
    return names;
  }

  for (const entry of sequence.children) {
    if (entry.tagClass !== TAG_CLASS.CONTEXT) continue;

    let text = '';
    for (let i = 0; i < entry.content.length; i += 1) {
      text += String.fromCharCode(entry.content[i]);
    }

    switch (entry.tagNumber) {
      case 1:
        names.email.push(text);
        break;
      case 2:
        names.dns.push(text);
        break;
      case 6:
        names.uri.push(text);
        break;
      case 7:
        names.ip.push(formatIpAddress(entry.content));
        break;
      default:
        break;
    }
  }

  return names;
}

function formatIpAddress(bytes: Uint8Array): string {
  if (bytes.length === 4) return Array.from(bytes).join('.');
  if (bytes.length === 16) {
    const groups: string[] = [];
    for (let i = 0; i < 16; i += 2) {
      groups.push(((bytes[i] << 8) | bytes[i + 1]).toString(16));
    }
    return groups.join(':');
  }
  return toHex(bytes, ':');
}

function readKeyUsage(content: Uint8Array): string {
  let node: Asn1Node;
  try {
    node = parseAsn1(content);
  } catch {
    return '';
  }

  const bits = node.content;
  if (bits.length < 2) return '';

  const unused = bits[0];
  const usages: string[] = [];
  const totalBits = (bits.length - 1) * 8 - unused;

  for (let i = 0; i < Math.min(totalBits, KEY_USAGE_BITS.length); i += 1) {
    const byte = bits[1 + Math.floor(i / 8)];
    if ((byte & (0x80 >> i % 8)) !== 0) usages.push(KEY_USAGE_BITS[i]);
  }

  return usages.join(', ');
}

function readExtendedKeyUsage(content: Uint8Array): string {
  try {
    const sequence = parseAsn1(content);
    return sequence.children
      .map((child) => {
        const oid = decodeOid(child.content);
        return EXTENDED_KEY_USAGES[oid] ?? oid;
      })
      .join(', ');
  } catch {
    return '';
  }
}

function readBasicConstraints(content: Uint8Array): { text: string; isCa: boolean } {
  try {
    const sequence = parseAsn1(content);
    const isCa = sequence.children.some(
      (child) => child.tagNumber === TAG.BOOLEAN && child.content[0] !== 0
    );
    const pathLength = sequence.children.find((child) => child.tagNumber === TAG.INTEGER);
    const parts = [`CA: ${isCa ? 'yes' : 'no'}`];
    if (pathLength) parts.push(`path length: ${decodeInteger(pathLength.content)}`);
    return { text: parts.join(', '), isCa };
  } catch {
    return { text: '', isCa: false };
  }
}

function readPublicKey(node: Asn1Node): {
  algorithm: string;
  size?: number;
  curve?: string;
} {
  const algorithmNode = node.children[0];
  const oid = algorithmNode?.children[0] ? decodeOid(algorithmNode.children[0].content) : '';
  const algorithm = KEY_ALGORITHMS[oid] ?? oid ?? 'unknown';

  if (algorithm === 'EC') {
    const curveNode = algorithmNode.children[1];
    const curveOid = curveNode ? decodeOid(curveNode.content) : '';
    return { algorithm, curve: CURVES[curveOid] ?? curveOid };
  }

  if (algorithm === 'RSA') {
    try {
      // The BIT STRING holds a leading "unused bits" byte before the DER key.
      const keyBytes = node.children[1].content.subarray(1);
      const keySequence = parseAsn1(keyBytes);
      const modulus = keySequence.children[0].content;
      // Strip the sign byte DER adds to keep the integer positive.
      const significant = modulus[0] === 0 ? modulus.subarray(1) : modulus;
      return { algorithm, size: significant.length * 8 };
    } catch {
      return { algorithm };
    }
  }

  return { algorithm };
}

const PEM_BLOCK = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/;

export function extractDer(input: string): { bytes?: Uint8Array; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { error: 'Paste a certificate in PEM format, or upload a .cer file.' };

  const match = PEM_BLOCK.exec(trimmed);
  if (match) {
    const label = match[1];
    if (/PRIVATE KEY/.test(label)) {
      return { error: 'That is a private key. Paste the certificate instead, never the key.' };
    }
    // A CSR carries the word CERTIFICATE but holds a request, not a certificate.
    if (/REQUEST/.test(label)) {
      return { error: 'That is a certificate signing request, not a certificate.' };
    }
    if (!/^(X509 |TRUSTED )?CERTIFICATE$/.test(label)) {
      return { error: `That is a "${label}" block, not a certificate.` };
    }
    try {
      return { bytes: base64ToBytes(match[2]) };
    } catch {
      return { error: 'The PEM body is not valid base64.' };
    }
  }

  if (/PRIVATE KEY/.test(trimmed)) {
    return { error: 'That is a private key. Paste the certificate instead, never the key.' };
  }

  // Bare base64, no armour.
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
    try {
      return { bytes: base64ToBytes(trimmed) };
    } catch {
      return { error: 'That does not decode as base64.' };
    }
  }

  return { error: 'No PEM certificate block found.' };
}

export function decodeCertificate(input: string): DecodeResult {
  const { bytes, error } = extractDer(input);
  if (!bytes) return { ok: false, error };

  try {
    const certificate = parseAsn1(bytes);
    const tbs = certificate.children[0];
    if (!tbs) return { ok: false, error: 'That is not a certificate structure.' };

    let index = 0;
    let version = 1;
    if (tbs.children[0]?.tagClass === TAG_CLASS.CONTEXT && tbs.children[0].tagNumber === 0) {
      const versionNode = tbs.children[0].children[0];
      version = versionNode ? Number(decodeInteger(versionNode.content) || '0') + 1 : 1;
      index = 1;
    }

    const serialNode = tbs.children[index];
    const signatureNode = tbs.children[index + 1];
    const issuerNode = tbs.children[index + 2];
    const validityNode = tbs.children[index + 3];
    const subjectNode = tbs.children[index + 4];
    const publicKeyNode = tbs.children[index + 5];

    if (!serialNode || !issuerNode || !validityNode || !subjectNode || !publicKeyNode) {
      return { ok: false, error: 'That certificate is missing required fields.' };
    }

    const signatureOid = signatureNode?.children[0]
      ? decodeOid(signatureNode.children[0].content)
      : '';

    const issuer = readName(issuerNode);
    const subject = readName(subjectNode);
    const publicKey = readPublicKey(publicKeyNode);

    let subjectAltNames: SubjectAltNames = { dns: [], ip: [], email: [], uri: [] };
    const extensions: CertificateExtension[] = [];
    let isCa = false;

    const extensionsWrapper = tbs.children.find(
      (child) => child.tagClass === TAG_CLASS.CONTEXT && child.tagNumber === 3
    );

    for (const extension of extensionsWrapper?.children[0]?.children ?? []) {
      const oidNode = extension.children[0];
      if (!oidNode) continue;

      const oid = decodeOid(oidNode.content);
      const critical =
        extension.children[1]?.tagNumber === TAG.BOOLEAN && extension.children[1].content[0] !== 0;
      const valueNode = extension.children[extension.children.length - 1];

      let value = '';
      if (oid === '2.5.29.17') {
        subjectAltNames = readSubjectAltNames(valueNode.content);
        value = [
          ...subjectAltNames.dns,
          ...subjectAltNames.ip,
          ...subjectAltNames.email,
          ...subjectAltNames.uri,
        ].join(', ');
      } else if (oid === '2.5.29.15') {
        value = readKeyUsage(valueNode.content);
      } else if (oid === '2.5.29.37') {
        value = readExtendedKeyUsage(valueNode.content);
      } else if (oid === '2.5.29.19') {
        const basic = readBasicConstraints(valueNode.content);
        value = basic.text;
        isCa = basic.isCa;
      } else if (oid === '2.5.29.14' || oid === '2.5.29.35') {
        value = toHex(valueNode.content, ':');
      }

      extensions.push({ oid, label: EXTENSION_LABELS[oid] ?? oid, critical, value });
    }

    return {
      ok: true,
      certificate: {
        version,
        // Uppercase hex, the way openssl prints a serial.
        serialNumber: decodeInteger(serialNode.content).toUpperCase(),
        signatureAlgorithm: SIGNATURE_ALGORITHMS[signatureOid] ?? signatureOid,
        issuer,
        subject,
        notBefore: validityNode.children[0] ? decodeTime(validityNode.children[0]) : null,
        notAfter: validityNode.children[1] ? decodeTime(validityNode.children[1]) : null,
        publicKeyAlgorithm: publicKey.algorithm,
        publicKeySize: publicKey.size,
        publicKeyCurve: publicKey.curve,
        subjectAltNames,
        extensions,
        isSelfSigned: issuer.text === subject.text && issuer.text !== '',
        isCa,
        der: bytes,
      },
    };
  } catch (caught) {
    return {
      ok: false,
      error: caught instanceof Error ? caught.message : 'That certificate could not be parsed.',
    };
  }
}

export function checkValidity(
  certificate: DecodedCertificate,
  now: Date = new Date()
): CertificateValidity {
  const { notBefore, notAfter } = certificate;

  if (!notAfter) {
    return { expired: false, notYetValid: false, daysRemaining: 0, summary: 'No expiry date found.' };
  }

  const notYetValid = Boolean(notBefore && now < notBefore);
  const expired = now > notAfter;
  const daysRemaining = Math.floor((notAfter.getTime() - now.getTime()) / 86400000);

  let summary: string;
  if (expired) summary = `Expired ${Math.abs(daysRemaining)} days ago.`;
  else if (notYetValid) summary = 'Not valid yet.';
  else if (daysRemaining <= 30) summary = `Expires in ${daysRemaining} days.`;
  else summary = `Valid for another ${daysRemaining} days.`;

  return { expired, notYetValid, daysRemaining, summary };
}

/** SHA-1 and SHA-256 fingerprints of the DER bytes, as openssl prints them. */
export async function fingerprint(der: Uint8Array, algorithm: 'SHA-1' | 'SHA-256'): Promise<string> {
  // Digest a freshly allocated view rather than der.slice().buffer: WebCrypto
  // under Node 20 rejects a bare ArrayBuffer that came from another realm, and
  // a view keeps the byte offset honest when der is a subarray of a larger
  // buffer. The copy also pins the buffer type, which BufferSource requires.
  const data = new Uint8Array(der.length);
  data.set(der);
  const digest = await crypto.subtle.digest(algorithm, data);
  return toHex(new Uint8Array(digest), ':').toUpperCase();
}

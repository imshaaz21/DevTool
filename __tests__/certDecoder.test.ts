import {
  decodeCertificate,
  extractDer,
  checkValidity,
  fingerprint,
} from '../lib/certDecoder';
import { RSA_CERT_PEM, EC_CERT_PEM } from './fixtures/certificates';

// jsdom ships no WebCrypto, so the digest used for fingerprints has to be
// borrowed from Node before the module under test reaches for crypto.subtle.
import { webcrypto } from 'crypto';

beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

// Values below were taken from `openssl x509` output for the same fixtures.
describe('certificate decoder', () => {
  describe('extractDer', () => {
    it('rejects empty input', () => {
      expect(extractDer('').error).toMatch(/Paste a certificate/i);
    });

    it('refuses a private key rather than parsing it', () => {
      const key = '-----BEGIN PRIVATE KEY-----\nMIIabc\n-----END PRIVATE KEY-----';
      expect(extractDer(key).error).toMatch(/private key/i);
    });

    it('refuses a PEM block that is not a certificate', () => {
      const csr = '-----BEGIN CERTIFICATE REQUEST-----\nMIIabc\n-----END CERTIFICATE REQUEST-----';
      expect(extractDer(csr).error).toMatch(/not a certificate/i);
    });

    it('rejects text that is not PEM at all', () => {
      expect(extractDer('just some words <>').error).toMatch(/No PEM certificate block/i);
    });

    it('reads the base64 body of a real certificate', () => {
      const { bytes, error } = extractDer(RSA_CERT_PEM);
      expect(error).toBeUndefined();
      expect(bytes!.length).toBeGreaterThan(400);
      // Every DER certificate starts with a SEQUENCE tag.
      expect(bytes![0]).toBe(0x30);
    });
  });

  describe('an RSA certificate', () => {
    const result = decodeCertificate(RSA_CERT_PEM);
    const certificate = result.certificate!;

    it('parses successfully', () => {
      expect(result.ok).toBe(true);
    });

    it('reads it as X.509 v3', () => {
      expect(certificate.version).toBe(3);
    });

    it('reads the serial number as openssl prints it', () => {
      expect(certificate.serialNumber).toBe('14EA6B765BC7E1C15A595E6AD29070CFC7BA7020');
    });

    it('names the signature algorithm', () => {
      expect(certificate.signatureAlgorithm).toBe('SHA-256 with RSA');
    });

    it('reads every part of the subject', () => {
      expect(certificate.subject.commonName).toBe('devtools.test');
      expect(certificate.subject.organisation).toBe('DevTools Suite');
      expect(certificate.subject.country).toBe('SA');
      expect(certificate.subject.text).toContain('OU=Engineering');
      expect(certificate.subject.text).toContain('ST=Riyadh');
    });

    it('recognises it as self signed', () => {
      expect(certificate.issuer.text).toBe(certificate.subject.text);
      expect(certificate.isSelfSigned).toBe(true);
    });

    it('reads the validity window', () => {
      expect(certificate.notBefore).toBeInstanceOf(Date);
      expect(certificate.notAfter).toBeInstanceOf(Date);
      expect(certificate.notAfter!.getTime()).toBeGreaterThan(certificate.notBefore!.getTime());
      expect(certificate.notBefore!.getUTCFullYear()).toBe(2026);
      expect(certificate.notAfter!.getUTCFullYear()).toBe(2029);
    });

    it('reads the key algorithm and size', () => {
      expect(certificate.publicKeyAlgorithm).toBe('RSA');
      expect(certificate.publicKeySize).toBe(2048);
    });

    it('reads every subject alternative name', () => {
      expect(certificate.subjectAltNames.dns).toEqual(['devtools.test', '*.devtools.test']);
      expect(certificate.subjectAltNames.ip).toEqual(['127.0.0.1']);
      expect(certificate.subjectAltNames.email).toEqual(['ops@devtools.test']);
    });

    it('reads key usage', () => {
      const usage = certificate.extensions.find((e) => e.label === 'Key Usage');
      expect(usage?.value).toContain('Digital signature');
      expect(usage?.value).toContain('Key encipherment');
    });

    it('reads extended key usage', () => {
      const usage = certificate.extensions.find((e) => e.label === 'Extended Key Usage');
      expect(usage?.value).toContain('TLS server authentication');
      expect(usage?.value).toContain('TLS client authentication');
    });

    it('reads basic constraints and the critical flag', () => {
      const basic = certificate.extensions.find((e) => e.label === 'Basic Constraints');
      expect(basic?.critical).toBe(true);
      expect(basic?.value).toContain('CA: yes');
      expect(certificate.isCa).toBe(true);
    });

    it('labels the subject key identifier', () => {
      const ski = certificate.extensions.find((e) => e.label === 'Subject Key Identifier');
      expect(ski?.value).toMatch(/^[0-9a-f]{2}(:[0-9a-f]{2})+$/);
    });
  });

  describe('an EC certificate', () => {
    const certificate = decodeCertificate(EC_CERT_PEM).certificate!;

    it('reads the curve rather than a key size', () => {
      expect(certificate.publicKeyAlgorithm).toBe('EC');
      expect(certificate.publicKeyCurve).toContain('P-256');
      expect(certificate.publicKeySize).toBeUndefined();
    });

    it('reads the subject', () => {
      expect(certificate.subject.commonName).toBe('ec.devtools.test');
    });
  });

  describe('checkValidity', () => {
    const certificate = decodeCertificate(RSA_CERT_PEM).certificate!;

    it('reports a live certificate as valid', () => {
      const validity = checkValidity(certificate, certificate.notBefore!);
      expect(validity.expired).toBe(false);
      expect(validity.notYetValid).toBe(false);
      expect(validity.daysRemaining).toBeGreaterThan(0);
    });

    it('reports an expired certificate', () => {
      const after = new Date(certificate.notAfter!.getTime() + 10 * 86400000);
      const validity = checkValidity(certificate, after);
      expect(validity.expired).toBe(true);
      expect(validity.summary).toMatch(/Expired/);
    });

    it('reports one that is not valid yet', () => {
      const before = new Date(certificate.notBefore!.getTime() - 86400000);
      expect(checkValidity(certificate, before).notYetValid).toBe(true);
    });

    it('warns when expiry is close', () => {
      const soon = new Date(certificate.notAfter!.getTime() - 5 * 86400000);
      expect(checkValidity(certificate, soon).summary).toMatch(/Expires in \d+ days/);
    });
  });

  describe('malformed input', () => {
    it('reports a parse failure rather than throwing', () => {
      const broken = '-----BEGIN CERTIFICATE-----\nMIIBAgEC\n-----END CERTIFICATE-----';
      const result = decodeCertificate(broken);
      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('fingerprint', () => {
    it('matches the sha256 fingerprint openssl reports', async () => {
      const certificate = decodeCertificate(RSA_CERT_PEM).certificate!;
      await expect(fingerprint(certificate.der, 'SHA-256')).resolves.toBe(
        '27:05:50:AD:26:8A:95:42:53:39:C4:00:24:BC:C8:07:20:AD:88:F0:40:A5:FA:4D:49:7A:3E:ED:AE:CF:36:98'
      );
    });
  });
});

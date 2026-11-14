'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import { useCopyFeedback } from '@/lib/clipboard';
import { checkUpload, CERTIFICATE_UPLOAD_RULE } from '@/lib/fileGuards';
import {
  BadgeCheck,
  Upload,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import {
  decodeCertificate,
  checkValidity,
  fingerprint,
  type DecodedCertificate,
} from '@/lib/certDecoder';

interface Fingerprints {
  sha1: string;
  sha256: string;
}

function Row({
  label,
  value,
  mono = true,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="px-4 py-2 flex items-start justify-between gap-3">
      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 w-40 shrink-0">{label}</span>
      <span
        className={`text-xs text-neutral-900 dark:text-neutral-100 flex-1 break-all select-all ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
          title={`Copy ${label}`}
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">{title}</span>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{children}</div>
    </div>
  );
}

function formatDate(date: Date | null): string {
  if (!date) return 'unknown';
  return `${date.toISOString().replace('T', ' ').replace('.000Z', ' UTC')}`;
}

export default function CertDecoderPage() {
  const { width } = useSidebar();
  const { copiedKey, handleCopy } = useCopyFeedback();
  const fileInput = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const [fingerprints, setFingerprints] = useState<Fingerprints | null>(null);

  const result = useMemo(() => (input.trim() ? decodeCertificate(input) : null), [input]);
  const certificate: DecodedCertificate | undefined = result?.certificate;

  const validity = useMemo(
    () => (certificate ? checkValidity(certificate, new Date()) : null),
    [certificate]
  );

  // Digests are async and come from WebCrypto, which needs a secure context.
  useEffect(() => {
    if (!certificate) {
      setFingerprints(null);
      return;
    }

    let current = true;
    Promise.all([fingerprint(certificate.der, 'SHA-1'), fingerprint(certificate.der, 'SHA-256')])
      .then(([sha1, sha256]) => {
        if (current) setFingerprints({ sha1, sha256 });
      })
      .catch(() => {
        if (current) setFingerprints(null);
      });

    return () => {
      current = false;
    };
  }, [certificate]);

  const readFile = (file: File | undefined) => {
    if (!file) return;

    const guard = checkUpload(file, CERTIFICATE_UPLOAD_RULE);
    if (!guard.ok) {
      toast.error(guard.error ?? 'That file cannot be read here.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setInput(String(reader.result ?? ''));
    reader.onerror = () => toast.error('That file could not be read.');
    reader.readAsText(file);
  };

  const altNames = certificate
    ? [
        ...certificate.subjectAltNames.dns.map((value) => ({ kind: 'DNS', value })),
        ...certificate.subjectAltNames.ip.map((value) => ({ kind: 'IP', value })),
        ...certificate.subjectAltNames.email.map((value) => ({ kind: 'Email', value })),
        ...certificate.subjectAltNames.uri.map((value) => ({ kind: 'URI', value })),
      ]
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-200"
        style={{ marginLeft: width }}
      >
        <PageHeader
          icon={BadgeCheck}
          title="X.509 Certificate Decoder"
          description="Read a PEM or DER certificate: subject, issuer, validity, key, alternative names, extensions and fingerprints."
          badge="Client side"
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pem,.crt,.cer,.cert,.der,application/x-x509-ca-cert,application/pkix-cert"
            className="hidden"
            onChange={(event) => {
              readFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <button onClick={() => fileInput.current?.click()} className="btn btn-secondary btn-sm">
            <Upload size={13} />
            <span>Open file</span>
          </button>
          <button
            onClick={() => setInput('')}
            disabled={!input}
            className="btn btn-secondary btn-sm"
            title="Clear"
          >
            <Trash2 size={13} />
          </button>
        </PageHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            <div
              className="card p-0 overflow-hidden"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                readFile(event.dataTransfer.files?.[0]);
              }}
            >
              <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 font-mono">
                  Certificate
                </span>
                <span className="text-[11px] font-mono text-neutral-400">PEM, or drop a .cer file</span>
              </div>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={'-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----'}
                aria-label="Certificate in PEM format"
                spellCheck={false}
                className="w-full h-40 p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
            </div>

            {result && !result.ok && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{result.error}</span>
              </div>
            )}

            {certificate && validity && (
              <>
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-medium ${
                    validity.expired || validity.notYetValid
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                      : validity.daysRemaining <= 30
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {validity.expired || validity.notYetValid ? (
                    <AlertCircle size={14} className="shrink-0" />
                  ) : validity.daysRemaining <= 30 ? (
                    <AlertTriangle size={14} className="shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} className="shrink-0" />
                  )}
                  <span>{validity.summary}</span>
                  {certificate.isSelfSigned && (
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-current opacity-80">
                      self signed
                    </span>
                  )}
                  {certificate.isCa && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-current opacity-80">
                      CA
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Panel title="Subject">
                    <Row label="Common name" value={certificate.subject.commonName ?? 'not set'} />
                    <Row label="Organisation" value={certificate.subject.organisation ?? 'not set'} />
                    <Row label="Country" value={certificate.subject.country ?? 'not set'} />
                    <Row
                      label="Full subject"
                      value={certificate.subject.text}
                      onCopy={() => handleCopy(certificate.subject.text, 'subject')}
                      copied={copiedKey === 'subject'}
                    />
                  </Panel>

                  <Panel title="Issuer">
                    <Row label="Common name" value={certificate.issuer.commonName ?? 'not set'} />
                    <Row label="Organisation" value={certificate.issuer.organisation ?? 'not set'} />
                    <Row label="Country" value={certificate.issuer.country ?? 'not set'} />
                    <Row
                      label="Full issuer"
                      value={certificate.issuer.text}
                      onCopy={() => handleCopy(certificate.issuer.text, 'issuer')}
                      copied={copiedKey === 'issuer'}
                    />
                  </Panel>
                </div>

                <Panel title="Certificate">
                  <Row label="Version" value={`X.509 v${certificate.version}`} />
                  <Row
                    label="Serial number"
                    value={certificate.serialNumber}
                    onCopy={() => handleCopy(certificate.serialNumber, 'serial')}
                    copied={copiedKey === 'serial'}
                  />
                  <Row label="Signature algorithm" value={certificate.signatureAlgorithm} />
                  <Row label="Valid from" value={formatDate(certificate.notBefore)} />
                  <Row label="Valid until" value={formatDate(certificate.notAfter)} />
                  <Row
                    label="Public key"
                    value={
                      certificate.publicKeySize
                        ? `${certificate.publicKeyAlgorithm} ${certificate.publicKeySize} bit`
                        : `${certificate.publicKeyAlgorithm}${certificate.publicKeyCurve ? ` ${certificate.publicKeyCurve}` : ''}`
                    }
                  />
                </Panel>

                {altNames.length > 0 && (
                  <Panel title={`Subject alternative names (${altNames.length})`}>
                    {altNames.map((name) => (
                      <Row key={`${name.kind}-${name.value}`} label={name.kind} value={name.value} />
                    ))}
                  </Panel>
                )}

                {certificate.extensions.length > 0 && (
                  <Panel title={`Extensions (${certificate.extensions.length})`}>
                    {certificate.extensions.map((extension) => (
                      <div key={extension.oid} className="px-4 py-2 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100">
                            {extension.label}
                          </span>
                          {extension.critical && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400">
                              critical
                            </span>
                          )}
                          <span className="ml-auto text-[10px] font-mono text-neutral-400">{extension.oid}</span>
                        </div>
                        <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 break-all">
                          {extension.value}
                        </p>
                      </div>
                    ))}
                  </Panel>
                )}

                <Panel title="Fingerprints">
                  {fingerprints ? (
                    <>
                      <Row
                        label="SHA-256"
                        value={fingerprints.sha256}
                        onCopy={() => handleCopy(fingerprints.sha256, 'sha256')}
                        copied={copiedKey === 'sha256'}
                      />
                      <Row
                        label="SHA-1"
                        value={fingerprints.sha1}
                        onCopy={() => handleCopy(fingerprints.sha1, 'sha1')}
                        copied={copiedKey === 'sha1'}
                      />
                    </>
                  ) : (
                    <Row
                      label="Digest"
                      value="Fingerprints need WebCrypto, which browsers expose only over HTTPS or on localhost."
                      mono={false}
                    />
                  )}
                </Panel>
              </>
            )}

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
              The certificate is parsed in your browser and never uploaded. Only the public half of a
              key pair belongs here: a pasted private key is refused rather than displayed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

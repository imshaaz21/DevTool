'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import {
  decodeJwt,
  getClaimDescription,
  SAMPLE_ACTIVE_JWT,
  SAMPLE_BEARER_JWT,
  SAMPLE_EXPIRED_JWT,
  DecodedJwtResult,
} from '@/lib/jwtDecoder';
import {
  KeyRound,
  Sparkles,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info,
  Layers,
  Code2,
} from 'lucide-react';

export default function JwtDecoderPage() {
  const { isCollapsed } = useSidebar();
  const [tokenInput, setTokenInput] = useState<string>(SAMPLE_BEARER_JWT);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Decode and analyze token
  const result: DecodedJwtResult = useMemo(() => {
    return decodeJwt(tokenInput);
  }, [tokenInput]);

  // Copy helper
  const handleCopy = useCallback((text: string, key: string, label: string = 'Copied') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  }, []);

  const handleClear = () => {
    setTokenInput('');
  };

  const loadSampleActive = () => {
    setTokenInput(SAMPLE_ACTIVE_JWT);
  };

  const loadSampleBearer = () => {
    setTokenInput(SAMPLE_BEARER_JWT);
  };

  const loadSampleExpired = () => {
    setTokenInput(SAMPLE_EXPIRED_JWT);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col h-full overflow-hidden ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={KeyRound}
          title="JWT Decoder"
          description="Decode JSON Web Tokens, inspect header algorithms, payload claims, expiration timestamps, and signature segments."
          badge="RFC 7519 · Client-Side"
        >
          <button
            onClick={loadSampleBearer}
            className="btn btn-secondary btn-sm flex items-center gap-1 text-xs shrink-0"
            title="Load sample token with 'Bearer ' prefix"
          >
            <Sparkles size={12} />
            <span>Sample (Bearer)</span>
          </button>
          <button
            onClick={loadSampleActive}
            className="btn btn-secondary btn-sm flex items-center gap-1 text-xs shrink-0"
            title="Load sample clean token without Bearer prefix"
          >
            <Sparkles size={12} />
            <span>Sample (Raw JWT)</span>
          </button>
          <button
            onClick={loadSampleExpired}
            className="btn btn-secondary btn-sm flex items-center gap-1 text-xs shrink-0"
            title="Load sample expired token to test expiry indicator"
          >
            <Clock size={12} />
            <span>Expired Sample</span>
          </button>
          <button
            onClick={handleClear}
            disabled={!tokenInput}
            className="btn btn-secondary btn-sm flex items-center gap-1 text-xs shrink-0 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
            title="Clear input"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </PageHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Status & Summary Cards */}
            {result.valid && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prefix Status */}
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900/50">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">
                      Authorization Prefix
                    </span>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                      {result.hadBearerPrefix ? 'Bearer (Stripped)' : 'Direct Token (No Bearer)'}
                    </span>
                  </div>
                </div>

                {/* Expiration Status */}
                <div className="card p-4 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      result.isExpired === false
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                        : result.isExpired === true
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {result.isExpired === false ? (
                      <CheckCircle2 size={16} />
                    ) : result.isExpired === true ? (
                      <XCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">
                      Token Status
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        result.isExpired === false
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : result.isExpired === true
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {result.isExpired === false
                        ? 'Active & Valid'
                        : result.isExpired === true
                        ? 'Expired'
                        : 'No Expiry (Permanent)'}
                    </span>
                  </div>
                </div>

                {/* Algorithm */}
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50">
                    <Code2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-neutral-400 block uppercase tracking-wider">
                      Algorithm & Type
                    </span>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                      {result.algorithm} ({result.tokenType})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {!result.valid && tokenInput.trim() && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-start gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Unable to decode token</p>
                  <p>{result.error}</p>
                </div>
              </div>
            )}

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Raw Input & Segment Visualizer (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Input Card */}
                <div className="card p-0 overflow-hidden flex flex-col min-h-[300px]">
                  <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound size={14} className="text-neutral-500" />
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 font-mono">
                        Encoded JWT Token
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.hadBearerPrefix && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                          Bearer stripped
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-neutral-400">
                        {tokenInput.length.toLocaleString()} chars
                      </span>
                    </div>
                  </div>

                  <textarea
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste JWT here (e.g. Bearer eyJhbGciOi... or eyJhbGciOi...)"
                    className="flex-1 p-4 bg-transparent border-0 resize-none font-mono text-xs focus:outline-none min-h-[220px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 leading-relaxed"
                    spellCheck={false}
                  />

                  {/* Visual Token Segment Breakdown */}
                  {result.valid && (
                    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 text-[11px] font-mono break-all leading-relaxed">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1.5 font-sans">
                        <span>Segment Color Coding:</span>
                        <button
                          onClick={() => handleCopy(result.cleanedToken, 'cleaned_token', 'Cleaned JWT')}
                          className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
                        >
                          {copiedKey === 'cleaned_token' ? <Check size={11} /> : <Copy size={11} />}
                          <span>Copy Clean Token</span>
                        </button>
                      </div>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold" title="Header (Algorithm & Token Type)">
                        {result.rawHeader}
                      </span>
                      <span className="text-neutral-400">.</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold" title="Payload / Claims">
                        {result.rawPayload}
                      </span>
                      {result.rawSignature && (
                        <>
                          <span className="text-neutral-400">.</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-semibold" title="Signature">
                            {result.rawSignature}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Token Parts Legend Card */}
                <div className="card p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <Info size={14} className="text-neutral-500" />
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      JWT Structure Guide
                    </span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-600 dark:text-rose-400">Header:</strong> Specifies algorithm (e.g. HS256, RS256) and token type.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-purple-600 dark:text-purple-400">Payload:</strong> Contains claims (user ID, roles, permissions, expiration).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-cyan-600 dark:text-cyan-400">Signature:</strong> Cryptographic verification hash produced with the secret/private key.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Decoded Header, Payload & Signature (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {result.valid ? (
                  <>
                    {/* Header JSON Card */}
                    <div className="card p-0 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-rose-50/30 dark:bg-rose-950/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 font-mono uppercase tracking-wider">
                            Header: Algorithm & Token Type
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(JSON.stringify(result.header, null, 2), 'header_json', 'Header JSON')}
                          className="btn btn-secondary btn-sm flex items-center gap-1 text-[11px]"
                          title="Copy Header JSON"
                        >
                          {copiedKey === 'header_json' ? <Check size={12} /> : <Copy size={12} />}
                          <span>Copy Header</span>
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono bg-white dark:bg-[#0d0d10] overflow-x-auto text-neutral-800 dark:text-neutral-200">
                        {JSON.stringify(result.header, null, 2)}
                      </pre>
                    </div>

                    {/* Payload JSON Card */}
                    <div className="card p-0 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-purple-50/30 dark:bg-purple-950/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 font-mono uppercase tracking-wider">
                            Payload: Data / Claims
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(JSON.stringify(result.payload, null, 2), 'payload_json', 'Payload JSON')}
                          className="btn btn-secondary btn-sm flex items-center gap-1 text-[11px]"
                          title="Copy Payload JSON"
                        >
                          {copiedKey === 'payload_json' ? <Check size={12} /> : <Copy size={12} />}
                          <span>Copy Payload</span>
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono bg-white dark:bg-[#0d0d10] overflow-x-auto text-neutral-800 dark:text-neutral-200">
                        {JSON.stringify(result.payload, null, 2)}
                      </pre>
                    </div>

                    {/* Standard Claims Human Breakdown */}
                    {result.payload && (
                      <div className="card p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-neutral-500" />
                            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                              Claim Insights & Timestamps
                            </span>
                          </div>
                          {result.expiresInText && (
                            <span
                              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                result.isExpired
                                  ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
                                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                              }`}
                            >
                              {result.expiresInText}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-xs">
                          {Object.entries(result.payload).map(([key, val]) => (
                            <div
                              key={key}
                              className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0 gap-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                                  {key}
                                </span>
                                <span className="text-[11px] text-neutral-400">
                                  ({getClaimDescription(key)})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </span>
                                <button
                                  onClick={() => handleCopy(typeof val === 'object' ? JSON.stringify(val) : String(val), `claim_${key}`, key)}
                                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                                  title={`Copy ${key}`}
                                >
                                  {copiedKey === `claim_${key}` ? <Check size={11} /> : <Copy size={11} />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signature Card */}
                    <div className="card p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono uppercase tracking-wider text-[11px]">
                            Signature
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(result.signature, 'signature', 'Signature')}
                          className="btn btn-secondary btn-sm flex items-center gap-1 text-[11px]"
                          title="Copy Signature"
                        >
                          {copiedKey === 'signature' ? <Check size={12} /> : <Copy size={12} />}
                          <span>Copy Signature</span>
                        </button>
                      </div>
                      <p className="font-mono text-[11px] text-cyan-700 dark:text-cyan-400 break-all bg-neutral-50 dark:bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                        {result.signature || '(No signature provided / Unsecured JWT)'}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
                        <ShieldAlert size={13} className="text-amber-500 shrink-0" />
                        <span>
                          Decoded client-side only. Signature verification requires your private/secret key which should never be pasted into public websites.
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card p-12 text-center flex flex-col items-center justify-center text-neutral-400 space-y-3 min-h-[300px]">
                    <KeyRound size={36} className="text-neutral-300 dark:text-neutral-700" />
                    <p className="text-xs font-medium text-neutral-500">
                      Paste a valid JWT token on the left or click a sample to see decoded header, claims, and timestamps.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

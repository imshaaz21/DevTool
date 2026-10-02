'use client';

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/components/SidebarContext';
import { PageHeader } from '@/components/PageHeader';
import {
  generateCodeVerifier,
  deriveCodeChallenge,
  validateCodeVerifier,
  verifyPkcePair,
  DEFAULT_VERIFIER_LENGTH,
} from '@/lib/pkce';
import {
  Key,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Code2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const RFC_SAMPLE_VERIFIER =
  'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

export default function PkceGeneratorPage() {
  const { isCollapsed } = useSidebar();
  const [tab, setTab] = useState<'generate' | 'validate'>('generate');

  // Generator state
  const [verifierLength, setVerifierLength] = useState<number>(DEFAULT_VERIFIER_LENGTH);
  const [method, setMethod] = useState<'S256' | 'plain'>('S256');
  const [codeVerifier, setCodeVerifier] = useState<string>(() =>
    generateCodeVerifier(DEFAULT_VERIFIER_LENGTH)
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Validator state
  const [testVerifier, setTestVerifier] = useState<string>(RFC_SAMPLE_VERIFIER);
  const [testChallenge, setTestChallenge] = useState<string>(
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
  );
  const [testMethod, setTestMethod] = useState<'S256' | 'plain'>('S256');

  // Generator calculations
  const verifierValidation = useMemo(
    () => validateCodeVerifier(codeVerifier),
    [codeVerifier]
  );

  const derived = useMemo(
    () => deriveCodeChallenge(codeVerifier, method),
    [codeVerifier, method]
  );

  // Validator calculations
  const testResult = useMemo(
    () => verifyPkcePair(testVerifier, testChallenge, testMethod),
    [testVerifier, testChallenge, testMethod]
  );

  const handleCopy = useCallback((text: string, key: string, label: string = 'Copied') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  }, []);

  const handleRegenerate = useCallback(() => {
    const newVerifier = generateCodeVerifier(verifierLength);
    setCodeVerifier(newVerifier);
    toast.success(`Generated new ${verifierLength}-character code verifier`);
  }, [verifierLength]);

  const handleLoadUserExample = useCallback(() => {
    setCodeVerifier(RFC_SAMPLE_VERIFIER);
    setVerifierLength(RFC_SAMPLE_VERIFIER.length);
    setMethod('S256');
    toast.success('Loaded RFC 7636 sample code verifier');
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      <Sidebar />

      <main
        className={`flex-1 transition-[margin] duration-200 ease-in-out flex flex-col h-full overflow-hidden ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <PageHeader
          icon={Key}
          title="PKCE Generator & Validator"
          description="Generate RFC 7636 compliant Code Verifiers & Challenges (S256 / plain), verify pairs, and inspect SHA-256 transformations."
          badge="RFC 7636 · OAuth 2.0 / 2.1"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadUserExample}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
              title="Load example code verifier"
            >
              <Sparkles size={12} />
              <span>Example</span>
            </button>
            <button
              onClick={handleRegenerate}
              className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
              title="Generate new random code verifier"
            >
              <RefreshCw size={12} />
              <span>Generate New</span>
            </button>
          </div>
        </PageHeader>

        {/* Tab & Controls Bar */}
        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Mode Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                <button
                  onClick={() => setTab('generate')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === 'generate'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Generate & Inspect
                </button>
                <button
                  onClick={() => setTab('validate')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tab === 'validate'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  Verify Pair
                </button>
              </div>

              {tab === 'generate' && (
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Method Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-medium">Method:</span>
                    <div className="flex p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
                      <button
                        onClick={() => setMethod('S256')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          method === 'S256'
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                        title="SHA-256 Base64URL (Recommended by RFC 7636 & OAuth 2.1)"
                      >
                        S256 (Recommended)
                      </button>
                      <button
                        onClick={() => setMethod('plain')}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          method === 'plain'
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                        title="Plain string without hashing (Not recommended)"
                      >
                        plain
                      </button>
                    </div>
                  </div>

                  {/* Length quick selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-medium">Length:</span>
                    <div className="flex items-center gap-1">
                      {[43, 64, 96, 128].map((len) => (
                        <button
                          key={len}
                          onClick={() => {
                            setVerifierLength(len);
                            setCodeVerifier(generateCodeVerifier(len));
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                            verifierLength === len
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-medium'
                              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TAB 1: GENERATE & INSPECT */}
            {tab === 'generate' && (
              <div className="space-y-6">
                {/* Warnings / Errors */}
                {!verifierValidation.isValid && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-1">
                      <p className="font-semibold">RFC 7636 Specification Notice</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {verifierValidation.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Primary Two Cards: Code Verifier & Code Challenge */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Code Verifier Card */}
                  <div className="card p-0 overflow-hidden flex flex-col">
                    <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                          code_verifier
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            verifierValidation.isValid
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                          }`}
                        >
                          {verifierValidation.length} chars {verifierValidation.isValid ? '· Valid RFC' : '· Non-standard'}
                        </span>
                        <button
                          onClick={() => handleCopy(codeVerifier, 'code_verifier', 'Code Verifier')}
                          className="btn btn-secondary btn-sm flex items-center gap-1 text-[11px]"
                          title="Copy Code Verifier"
                        >
                          {copiedKey === 'code_verifier' ? <Check size={12} /> : <Copy size={12} />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={codeVerifier}
                      onChange={(e) => setCodeVerifier(e.target.value)}
                      placeholder="Enter or paste code verifier..."
                      rows={4}
                      className="p-4 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                      spellCheck={false}
                    />
                    <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-neutral-900/30 text-[11px] text-neutral-400 flex items-center justify-between">
                      <span>High-entropy cryptographic random string [A-Z, a-z, 0-9, -, ., _, ~]</span>
                      <button
                        onClick={handleRegenerate}
                        className="text-xs text-neutral-600 dark:text-neutral-300 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={11} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Challenge Card */}
                  <div className="card p-0 overflow-hidden flex flex-col">
                    <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                          code_challenge
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                          method: {method}
                        </span>
                        <button
                          onClick={() => handleCopy(derived.codeChallenge, 'code_challenge', 'Code Challenge')}
                          className="btn btn-secondary btn-sm flex items-center gap-1 text-[11px]"
                          title="Copy Code Challenge"
                        >
                          {copiedKey === 'code_challenge' ? <Check size={12} /> : <Copy size={12} />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-neutral-50/50 dark:bg-neutral-950 flex-1 flex flex-col justify-center">
                      <p className="font-mono text-xs text-neutral-900 dark:text-neutral-100 break-all select-all leading-relaxed font-semibold">
                        {derived.codeChallenge}
                      </p>
                    </div>
                    <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-neutral-900/30 text-[11px] text-neutral-400">
                      <span>
                        {method === 'S256'
                          ? 'BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))'
                          : 'Plain verifier without transformation'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Educational Visual Transformation Card */}
                {method === 'S256' && derived.hexSha256 && (
                  <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        <HelpCircle size={16} className="text-neutral-500" />
                        <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          Step-by-Step SHA-256 Transformation &amp; Encodings
                        </h2>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        Why SHA-256 Hex is different from PKCE Challenge
                      </span>
                    </div>

                    <div className="space-y-4 text-xs font-mono">
                      {/* Step 1 */}
                      <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="font-sans font-medium flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-[10px] font-mono">
                              1
                            </span>
                            Input Code Verifier (ASCII text)
                          </span>
                          <span className="font-mono text-[10px]">{codeVerifier.length} characters</span>
                        </div>
                        <p className="text-neutral-800 dark:text-neutral-200 break-all select-all text-[11px]">
                          {codeVerifier}
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="font-sans font-medium flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-mono">
                              2
                            </span>
                            SHA-256 Digest in Hexadecimal (Standard hash tools)
                          </span>
                          <button
                            onClick={() => handleCopy(derived.hexSha256!, 'hex_sha256', 'Hex SHA-256')}
                            className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 font-sans text-[10px]"
                          >
                            {copiedKey === 'hex_sha256' ? <Check size={11} /> : <Copy size={11} />}
                            <span>Copy Hex</span>
                          </button>
                        </div>
                        <p className="text-amber-700 dark:text-amber-400 break-all select-all text-[11px]">
                          {derived.hexSha256}
                        </p>
                        <p className="font-sans text-[10px] text-neutral-400 pt-0.5">
                          Standard SHA-256 tools display the raw 32-byte hash as 64 hex characters (0-9, a-f).
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className="font-sans font-medium flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center text-[10px] font-mono">
                              3
                            </span>
                            Raw 32 Hash Bytes in Standard Base64
                          </span>
                          <button
                            onClick={() => handleCopy(derived.standardBase64!, 'std_base64', 'Standard Base64')}
                            className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 font-sans text-[10px]"
                          >
                            {copiedKey === 'std_base64' ? <Check size={11} /> : <Copy size={11} />}
                            <span>Copy Base64</span>
                          </button>
                        </div>
                        <p className="text-purple-700 dark:text-purple-400 break-all select-all text-[11px]">
                          {derived.standardBase64}
                        </p>
                        <p className="font-sans text-[10px] text-neutral-400 pt-0.5">
                          Raw binary 32 bytes encoded in standard Base64 (contains `=` padding and potential `+` or `/` symbols).
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-400">
                          <span className="font-sans font-medium flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                              4
                            </span>
                            PKCE Code Challenge (Base64URL without padding)
                          </span>
                          <button
                            onClick={() => handleCopy(derived.codeChallenge, 'pkce_challenge_step', 'Code Challenge')}
                            className="hover:text-blue-900 dark:hover:text-blue-200 flex items-center gap-1 font-sans text-[10px]"
                          >
                            {copiedKey === 'pkce_challenge_step' ? <Check size={11} /> : <Copy size={11} />}
                            <span>Copy Challenge</span>
                          </button>
                        </div>
                        <p className="text-blue-800 dark:text-blue-300 font-semibold break-all select-all text-[11px]">
                          {derived.codeChallenge}
                        </p>
                        <p className="font-sans text-[10px] text-blue-600/80 dark:text-blue-400/80 pt-0.5">
                          RFC 7636 strips `=` padding and replaces `+` with `-` and `/` with `_` so it is safely transmitted in HTTP query parameters without URL encoding.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* OAuth 2.0 Integration Request Helper */}
                <div className="card p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Code2 size={16} className="text-neutral-500" />
                      <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        OAuth 2.0 / 2.1 Request Snippets
                      </h2>
                    </div>
                    <span className="text-[11px] text-neutral-400">Ready to copy into your OAuth flow</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Snippet 1 */}
                    <div className="space-y-2 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          1. Authorization Request (GET query params)
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `&code_challenge=${derived.codeChallenge}&code_challenge_method=${method}`,
                              'auth_query',
                              'Query parameters'
                            )
                          }
                          className="btn btn-secondary btn-sm flex items-center gap-1 text-[10px]"
                        >
                          {copiedKey === 'auth_query' ? <Check size={11} /> : <Copy size={11} />}
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="p-2.5 rounded bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 font-mono text-[11px] overflow-x-auto text-neutral-800 dark:text-neutral-200">
                        &code_challenge={derived.codeChallenge}&#10;&code_challenge_method={method}
                      </pre>
                    </div>

                    {/* Snippet 2 */}
                    <div className="space-y-2 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          2. Token Exchange (POST body param)
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `grant_type=authorization_code&code_verifier=${codeVerifier}`,
                              'token_body',
                              'Token parameters'
                            )
                          }
                          className="btn btn-secondary btn-sm flex items-center gap-1 text-[10px]"
                        >
                          {copiedKey === 'token_body' ? <Check size={11} /> : <Copy size={11} />}
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="p-2.5 rounded bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 font-mono text-[11px] overflow-x-auto text-neutral-800 dark:text-neutral-200">
                        grant_type=authorization_code&#10;&code_verifier={codeVerifier}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VERIFY PAIR */}
            {tab === 'validate' && (
              <div className="space-y-6">
                {/* Result Status Banner */}
                {testVerifier.trim() && testChallenge.trim() ? (
                  testResult.matches ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="font-semibold">Match Confirmed!</p>
                        <p className="text-[11px] mt-0.5">
                          The code challenge matches the {testMethod} digest derived from this code verifier.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start gap-3">
                      <XCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                      <div className="space-y-1">
                        <p className="font-semibold">Challenge Mismatch</p>
                        <p className="text-[11px]">
                          The provided challenge does not match the derived {testMethod} challenge.
                        </p>
                        <p className="font-mono text-[11px] text-red-900 dark:text-red-200 pt-1">
                          Expected challenge: {testResult.expectedChallenge}
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span>Enter both a code_verifier and code_challenge to verify whether they match.</span>
                  </div>
                )}

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Verifier Input */}
                  <div className="card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Code Verifier
                      </label>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {testVerifier.length} chars
                      </span>
                    </div>
                    <textarea
                      value={testVerifier}
                      onChange={(e) => setTestVerifier(e.target.value)}
                      placeholder="Paste code_verifier..."
                      rows={4}
                      className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
                      spellCheck={false}
                    />
                    {!testResult.verifierValidation.isValid && testVerifier && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Notice: {testResult.verifierValidation.errors[0]}
                      </p>
                    )}
                  </div>

                  {/* Challenge Input & Method */}
                  <div className="card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Code Challenge to Test
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTestMethod('S256')}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            testMethod === 'S256'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium'
                              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          S256
                        </button>
                        <button
                          onClick={() => setTestMethod('plain')}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            testMethod === 'plain'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium'
                              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          plain
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={testChallenge}
                      onChange={(e) => setTestChallenge(e.target.value)}
                      placeholder="Paste code_challenge..."
                      rows={4}
                      className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Quick RFC Reference Card */}
                <div className="card p-4 space-y-2 text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    About RFC 7636 Verification
                  </span>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                    During token exchange in OAuth 2.0 / 2.1, the authorization server computes{' '}
                    <code className="font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">
                      BASE64URL(SHA256(code_verifier))
                    </code>{' '}
                    and compares it to the <code className="font-mono">code_challenge</code> sent previously during authorization. If they do not match, the server returns an <code className="font-mono text-red-600 dark:text-red-400">invalid_grant</code> error.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

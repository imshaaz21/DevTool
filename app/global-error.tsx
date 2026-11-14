'use client';

/**
 * Last resort boundary: a throw in the root layout itself.
 *
 * This replaces the root layout, so there is no stylesheet and no provider to
 * rely on. Everything here is inline on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
          color: '#18181b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: '28rem', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            DevTools Suite failed to start
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#71717a', lineHeight: 1.6 }}>
            Something broke before the app could load. Reloading usually fixes it.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.7rem', color: '#a1a1aa', fontFamily: 'monospace' }}>
              digest: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1rem',
              padding: '0.4rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#ffffff',
              background: '#18181b',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}

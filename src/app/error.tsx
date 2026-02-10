'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        minHeight: '50vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2 style={{ margin: 0 }}>Something went wrong</h2>
      <p style={{ margin: 0, color: 'var(--mono-text-low-contrast)' }}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--mono-border)',
          background: 'var(--mono-subtle-bg)',
          color: 'var(--mono-text)',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}

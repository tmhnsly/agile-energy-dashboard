export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        minHeight: '50vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2 style={{ margin: 0 }}>404 — Page not found</h2>
      <p style={{ margin: 0, color: 'var(--mono-text-low-contrast)' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
    </div>
  );
}

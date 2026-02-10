'use client';

import styles from './status-page.module.scss';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Something went wrong</h2>
      <p className={styles.message}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button onClick={reset} className={styles.retryBtn}>
        Try again
      </button>
    </div>
  );
}

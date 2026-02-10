import styles from './status-page.module.scss';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>404 — Page not found</h2>
      <p className={styles.message}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
    </div>
  );
}

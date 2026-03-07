import { TbWifiOff } from 'react-icons/tb';
import styles from '../status-page.module.scss';

export default function OfflinePage() {
  return (
    <div className={styles.page}>
      <div className={styles.icon} style={{ color: 'var(--mono-text-low-contrast)' }} aria-hidden="true">
        <TbWifiOff size="100%" />
      </div>
      <h2 className={styles.heading}>You&apos;re offline</h2>
      <p className={styles.message}>
        Check your connection and try again.
      </p>
    </div>
  );
}

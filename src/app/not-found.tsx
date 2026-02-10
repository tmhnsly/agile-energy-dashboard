import { TbMapOff } from 'react-icons/tb';
import { BackButton } from '@/components/UI/BackButton/BackButton';
import styles from './status-page.module.scss';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.icon} style={{ color: 'var(--warning-text-low-contrast)' }} aria-hidden="true">
        <TbMapOff size="100%" />
      </div>
      <h2 className={styles.heading}>Lost in the grid</h2>
      <p className={styles.message}>
        This page doesn&apos;t exist — or maybe it never did.
      </p>
      <BackButton className={styles.link} />
    </div>
  );
}

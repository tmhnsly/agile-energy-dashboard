import { TbError404 } from 'react-icons/tb';
import { BackButton } from '@/components/UI/BackButton/BackButton';
import styles from './status-page.module.scss';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.icon} aria-hidden="true">
        <TbError404 size="100%" />
      </div>
      <p className={styles.code}>404</p>
      <h2 className={styles.heading}>Lost in the grid</h2>
      <p className={styles.message}>
        This page doesn&apos;t exist — or maybe it never did.
      </p>
      <BackButton className={styles.link} />
    </div>
  );
}

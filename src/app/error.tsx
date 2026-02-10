'use client';

import { TbPlugX } from 'react-icons/tb';
import { Button } from '@/components/UI/Button/Button';
import styles from './status-page.module.scss';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.icon} aria-hidden="true">
        <TbPlugX size="100%" />
      </div>
      <p className={styles.code}>500</p>
      <h2 className={styles.heading}>Well, that&apos;s not great</h2>
      <p className={styles.message}>
        Something broke on our end. Give it another go.
      </p>
      <Button label="Try again" variant="soft" color="accent" size="small" onClick={reset} />
    </div>
  );
}

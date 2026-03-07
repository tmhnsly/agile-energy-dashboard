'use client';

import { TbWifiOff } from 'react-icons/tb';
import styles from './OfflineBanner.module.scss';

export function OfflineBanner() {
  return (
    <div className={styles.banner} role="status">
      <TbWifiOff aria-hidden="true" />
      <span>You&apos;re offline — showing cached data</span>
    </div>
  );
}

'use client';

import { TbFlask } from 'react-icons/tb';
import styles from './SampleDataBanner.module.scss';

/**
 * Shown when the live Agile price feed is unreachable and the dashboard is
 * running on the bundled fallback snapshot rather than current market prices.
 */
export function SampleDataBanner() {
  return (
    <div className={styles.banner} role="status">
      <TbFlask aria-hidden="true" />
      <span>Live prices unavailable — showing sample data</span>
    </div>
  );
}

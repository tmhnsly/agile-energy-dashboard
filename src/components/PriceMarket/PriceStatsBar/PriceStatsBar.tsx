import type { PriceStats } from "@/types/energy";
import { formatPricePerKwh, formatTime } from "@/utils/format";
import styles from "./PriceStatsBar.module.scss";

export interface PriceStatsBarProps {
  stats: PriceStats;
}

export const PriceStatsBar = ({ stats }: PriceStatsBarProps) => {
  return (
    <div className={styles.statsRow}>
      {stats.min && (
        <div className={styles.statCard} data-color="low">
          <div className={styles.statHeader}>
            <span className={styles.statDot} data-color="low" />
            <span className={styles.statLabel}>Low</span>
          </div>
          <span className={`${styles.statValue} ${styles.statValueLow}`}>
            {formatPricePerKwh(stats.min.price)}
          </span>
          <span className={styles.statTime}>{formatTime(stats.min.ts)}</span>
        </div>
      )}
      {stats.max && (
        <div className={styles.statCard} data-color="high">
          <div className={styles.statHeader}>
            <span className={styles.statDot} data-color="high" />
            <span className={styles.statLabel}>High</span>
          </div>
          <span className={`${styles.statValue} ${styles.statValueHigh}`}>
            {formatPricePerKwh(stats.max.price)}
          </span>
          <span className={styles.statTime}>{formatTime(stats.max.ts)}</span>
        </div>
      )}
    </div>
  );
};

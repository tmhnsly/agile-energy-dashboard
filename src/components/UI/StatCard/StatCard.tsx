import { memo, type ReactNode } from 'react';
import styles from './StatCard.module.scss';

export type StatCardTone = 'neutral' | 'positive' | 'negative' | 'accent';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  icon?: ReactNode;
  tone?: StatCardTone;
  className?: string;
}

export const StatCard = memo(function StatCard({
  label,
  value,
  subValue,
  icon,
  tone = 'neutral',
  className,
}: StatCardProps) {
  return (
    <div
      className={`${styles.card} ${className ?? ''}`}
      data-tone={tone}
    >
      <div className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{label}</span>
      </div>
      <span className={styles.value}>{value}</span>
      {subValue && <span className={styles.subValue}>{subValue}</span>}
    </div>
  );
});

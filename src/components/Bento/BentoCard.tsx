import styles from './BentoCard.module.scss';

export interface BentoCardProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3;
  className?: string;
  /** When true, renders skeleton instead of children. */
  loading?: boolean;
  /** Custom skeleton layout to show when loading. Falls back to a default block. */
  skeleton?: React.ReactNode;
}

export const BentoCard = ({
  children,
  span = 1,
  className,
  loading = false,
  skeleton,
}: BentoCardProps) => {
  return (
    <div
      className={`${styles.card}${className ? ` ${className}` : ''}`}
      data-span={span}
      {...(loading ? { 'aria-busy': 'true' } : {})}
    >
      {loading ? (skeleton ?? <div className={styles.skelFallback} />) : children}
    </div>
  );
};

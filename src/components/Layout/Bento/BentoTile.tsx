import { cx } from '@/utils/cx';
import styles from './BentoTile.module.scss';

export interface BentoTileProps {
  children: React.ReactNode;
  /** Grid column span — controls how many columns the tile occupies. */
  span?: 'standard' | 'feature' | 'wide' | 'tall' | 'compact';
  className?: string;
  /** When true, renders skeleton instead of children. */
  loading?: boolean;
  /** Custom skeleton to show when loading. Falls back to a default shimmer. */
  skeleton?: React.ReactNode;
}

export const BentoTile = ({
  children,
  span = 'standard',
  className,
  loading = false,
  skeleton,
}: BentoTileProps) => {
  return (
    <div
      className={cx(styles.tile, className)}
      data-span={span}
      {...(loading ? { 'aria-busy': 'true', 'data-loading': 'true' } : {})}
    >
      {loading ? (skeleton ?? <div className={styles.skelFallback} />) : children}
    </div>
  );
};

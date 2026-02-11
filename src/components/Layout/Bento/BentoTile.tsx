import { cx } from '@/utils/cx';
import styles from './BentoTile.module.scss';

export type BentoTileTone = 'accent' | 'secondary' | 'warning';

export interface BentoTileProps {
  children: React.ReactNode;
  /** Grid column span — controls how many columns the tile occupies. */
  span?: 'standard' | 'feature' | 'wide' | 'tall' | 'compact';
  /** Semantic color tone — remaps surface and mono tokens for the entire card. */
  tone?: BentoTileTone;
  className?: string;
  /** When true, renders skeleton instead of children. */
  loading?: boolean;
  /** Custom skeleton to show when loading. Falls back to a default shimmer. */
  skeleton?: React.ReactNode;
}

export const BentoTile = ({
  children,
  span = 'standard',
  tone,
  className,
  loading = false,
  skeleton,
}: BentoTileProps) => {
  return (
    <div
      className={cx(styles.tile, className)}
      data-span={span}
      {...(tone ? { 'data-tone': tone } : {})}
      {...(loading ? { 'aria-busy': 'true', 'data-loading': 'true' } : {})}
    >
      {loading ? (skeleton ?? <div className={styles.skelFallback} />) : children}
    </div>
  );
};

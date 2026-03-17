'use client';

import { cx } from '@/utils/cx';
import { motion, AnimatePresence } from 'motion/react';
import { reveal, stagger, crossfade } from '@/config/motion';
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
  /** Stagger index for entrance animation. */
  index?: number;
}

export const BentoTile = ({
  children,
  span = 'standard',
  tone,
  className,
  loading = false,
  skeleton,
  index = 0,
}: BentoTileProps) => {
  return (
    <motion.div
      className={cx(styles.tile, className)}
      data-span={span}
      {...(tone ? { 'data-tone': tone } : {})}
      {...(loading ? { 'aria-busy': 'true', 'data-loading': 'true' } : {})}
      variants={reveal.fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={reveal.viewport}
      transition={reveal.transition(index * stagger.normal)}
    >
      <AnimatePresence initial={false}>
        {loading && (
          <motion.div
            key="skeleton"
            className={styles.skeletonOverlay}
            exit={crossfade.exit}
            transition={crossfade.transition}
          >
            {skeleton ?? <div className={styles.skelFallback} />}
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </motion.div>
  );
};

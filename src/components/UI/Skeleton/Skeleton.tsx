import { cx } from '@/utils/cx';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: 'none' | 'small' | 'medium' | 'full';
  className?: string;
}

export const Skeleton = ({
  width,
  height,
  radius = 'medium',
  className,
}: SkeletonProps) => {
  return (
    <div
      className={cx(styles.skeleton, className)}
      data-radius={radius}
      aria-hidden="true"
      role="presentation"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: string | number;
  gap?: string;
  className?: string;
}

export const SkeletonText = ({
  lines = 3,
  lineHeight = 14,
  gap = 'var(--space-2)',
  className,
}: SkeletonTextProps) => {
  return (
    <div
      className={cx(styles.textGroup, className)}
      style={{ gap }}
      aria-hidden="true"
      role="presentation"
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? '60%' : '100%'}
          radius="small"
        />
      ))}
    </div>
  );
};

export interface SkeletonCircleProps {
  size?: string | number;
  className?: string;
}

export const SkeletonCircle = ({
  size = 40,
  className,
}: SkeletonCircleProps) => {
  const s = typeof size === 'number' ? `${size}px` : size;
  return <Skeleton width={s} height={s} radius="full" className={className} />;
};

export interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export const SkeletonCard = ({ lines = 3, className }: SkeletonCardProps) => {
  return (
    <div
      className={cx(styles.card, className)}
      aria-hidden="true"
      role="presentation"
    >
      <Skeleton height={20} width="40%" radius="small" />
      <SkeletonText lines={lines} />
    </div>
  );
};

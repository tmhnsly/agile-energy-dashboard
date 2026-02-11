import { cx } from '@/utils/cx';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: 'none' | 'small' | 'medium' | 'full' | 'pill';
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

import { cx } from '@/utils/cx';
import styles from './BentoGrid.module.scss';

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div className={cx(styles.grid, className)}>
      {children}
    </div>
  );
};

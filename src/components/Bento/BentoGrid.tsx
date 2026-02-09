import styles from './BentoGrid.module.scss';

export interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div className={`${styles.grid}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
};

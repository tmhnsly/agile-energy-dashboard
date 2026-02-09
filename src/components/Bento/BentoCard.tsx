import styles from './BentoCard.module.scss';

export interface BentoCardProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3;
  className?: string;
}

export const BentoCard = ({
  children,
  span = 1,
  className,
}: BentoCardProps) => {
  return (
    <div
      className={`${styles.card}${className ? ` ${className}` : ''}`}
      data-span={span}
    >
      {children}
    </div>
  );
};

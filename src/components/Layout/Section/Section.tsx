import styles from './Section.module.scss';

export interface SectionProps {
  children: React.ReactNode;
  variant?: 'default' | 'surface' | 'contrast';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Section = ({
  children,
  variant = 'default',
  size = 'medium',
  className,
}: SectionProps) => {
  return (
    <section
      className={`${styles.section}${className ? ` ${className}` : ''}`}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </section>
  );
};

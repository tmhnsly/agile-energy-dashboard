import styles from './Container.module.scss';

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container = ({ children, className }: ContainerProps) => {
  return (
    <div className={`${styles.container}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
};

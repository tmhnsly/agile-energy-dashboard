import styles from './Navbar.module.scss';

export interface NavbarProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Navbar = ({ title, children, className }: NavbarProps) => {
  return (
    <nav className={`${styles.navbar}${className ? ` ${className}` : ''}`}>
      <div className={styles.inner}>
        {title && <span className={styles.title}>{title}</span>}
        {children && <div className={styles.actions}>{children}</div>}
      </div>
    </nav>
  );
};

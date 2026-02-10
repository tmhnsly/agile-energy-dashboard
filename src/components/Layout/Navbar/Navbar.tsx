import { HiLightningBolt, HiUser } from 'react-icons/hi';
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
        <div className={styles.brand}>
          <span className={styles.brandIcon}><HiLightningBolt /></span>
          {title && <span className={styles.title}>{title}</span>}
        </div>
        <div className={styles.actions}>
          {children}
          <span className={styles.avatar}><HiUser /></span>
        </div>
      </div>
    </nav>
  );
};

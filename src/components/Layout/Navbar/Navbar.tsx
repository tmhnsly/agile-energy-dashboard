import { TbBoltFilled } from 'react-icons/tb';
import { cx } from '@/utils/cx';
import styles from './Navbar.module.scss';

export interface NavbarProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Navbar = ({ title, children, className }: NavbarProps) => {
  return (
    <nav className={cx(styles.navbar, className)}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true"><TbBoltFilled /></span>
          {title && <span className={styles.title}>{title}</span>}
        </div>
        <div className={styles.actions}>
          {children}
        </div>
      </div>
    </nav>
  );
};

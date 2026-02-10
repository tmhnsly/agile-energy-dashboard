import { CgSpinner } from 'react-icons/cg';
import styles from './Spinner.module.scss';

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  label?: string;
  className?: string;
}

export const Spinner = ({
  size = 'medium',
  label = 'Loading…',
  className,
}: SpinnerProps) => {
  return (
    <span
      role="status"
      className={`${styles.spinner} ${className ?? ''}`}
      data-size={size}
    >
      <CgSpinner className={styles.icon} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
};

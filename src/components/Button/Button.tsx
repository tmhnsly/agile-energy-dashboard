import styles from './Button.module.scss';

export interface ButtonProps {
  /** Is this the principal call to action on the page? */
  primary?: boolean;
  /** How large should the button be? */
  size?: 'small' | 'medium' | 'large';
  /** Button contents */
  label: string;
  /** Optional click handler */
  onClick?: () => void;
}

/** Primary UI component for user interaction */
export const Button = ({
  primary = false,
  size = 'medium',
  label,
  ...props
}: ButtonProps) => {
  const mode = primary ? styles.primary : styles.secondary;
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[size]} ${mode}`}
      {...props}
    >
      {label}
    </button>
  );
};

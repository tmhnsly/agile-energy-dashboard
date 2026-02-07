import styles from './Button.module.scss';

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';
export type ButtonColor = 'accent' | 'error' | 'success' | 'warning' | 'info';

export interface ButtonProps {
  /** Visual weight of the button */
  variant?: ButtonVariant;
  /** How large should the button be? */
  size?: 'small' | 'medium' | 'large';
  /** Which color scale to use */
  color?: ButtonColor;
  /** Button contents */
  label: string;
  /** Optional click handler */
  onClick?: () => void;
}

export const Button = ({
  variant = 'solid',
  size = 'medium',
  color = 'accent',
  label,
  ...props
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={styles.button}
      data-variant={variant}
      data-size={size}
      data-color={color}
      {...props}
    >
      {label}
    </button>
  );
};

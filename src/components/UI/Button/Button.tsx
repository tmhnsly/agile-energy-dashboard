import styles from './Button.module.scss';

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';
export type ButtonColor = 'accent' | 'error' | 'success' | 'warning' | 'info' | 'mono';

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
  /** Disabled state */
  disabled?: boolean;
  /** Toggle pressed state — sets `aria-pressed` for toggle-button semantics. */
  pressed?: boolean;
}

export const Button = ({
  variant = 'solid',
  size = 'medium',
  color = 'accent',
  label,
  disabled,
  pressed,
  ...props
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={styles.button}
      data-variant={variant}
      data-size={size}
      data-color={color}
      disabled={disabled}
      {...(pressed != null ? { 'aria-pressed': pressed } : {})}
      {...props}
    >
      {label}
    </button>
  );
};

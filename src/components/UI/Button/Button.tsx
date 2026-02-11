import { forwardRef, type ReactNode } from 'react';
import styles from './Button.module.scss';

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';
export type ButtonColor = 'accent' | 'secondary' | 'error' | 'success' | 'warning' | 'info' | 'mono';

export interface ButtonProps {
  /** Visual weight of the button */
  variant?: ButtonVariant;
  /** How large should the button be? */
  size?: 'small' | 'medium' | 'large';
  /** Which color scale to use */
  color?: ButtonColor;
  /** Button contents */
  label: string;
  /** Optional leading icon */
  icon?: ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Toggle pressed state — sets `aria-pressed` for toggle-button semantics. */
  pressed?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'solid',
      size = 'medium',
      color = 'accent',
      label,
      icon,
      disabled,
      pressed,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={styles.button}
        data-variant={variant}
        data-size={size}
        data-color={color}
        disabled={disabled}
        {...(pressed != null ? { 'aria-pressed': pressed } : {})}
        {...props}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        {label}
      </button>
    );
  },
);

Button.displayName = 'Button';

import type { ComponentPropsWithoutRef } from 'react';
import { cx } from '@/utils/cx';
import styles from './Navbar.module.scss';

type NavActionButtonProps = {
  as?: 'button';
  label?: string;
} & ComponentPropsWithoutRef<'button'>;

type NavActionLinkProps = {
  as: 'a';
  label?: string;
} & ComponentPropsWithoutRef<'a'>;

export type NavActionProps = NavActionButtonProps | NavActionLinkProps;

export const NavAction = ({ as: Tag = 'button', label, className, children, ...props }: NavActionProps) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag className={cx(styles.navAction, label && styles.navActionWithLabel, className)} {...(props as any)}>
      {children}
      {label && <span className={styles.navActionLabel}>{label}</span>}
    </Tag>
  );
};

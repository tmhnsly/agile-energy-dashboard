import type { ComponentPropsWithoutRef } from 'react';
import { cx } from '@/utils/cx';
import styles from './Navbar.module.scss';

type NavActionButtonProps = {
  as?: 'button';
} & ComponentPropsWithoutRef<'button'>;

type NavActionLinkProps = {
  as: 'a';
} & ComponentPropsWithoutRef<'a'>;

export type NavActionProps = NavActionButtonProps | NavActionLinkProps;

export const NavAction = ({ as: Tag = 'button', className, ...props }: NavActionProps) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag className={cx(styles.navAction, className)} {...(props as any)} />
  );
};

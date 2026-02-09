import type { ElementType, ComponentPropsWithoutRef } from 'react';
import styles from './Container.module.scss';

type ContainerTag = 'div' | 'section' | 'main' | 'nav' | 'aside' | 'header' | 'footer' | 'article';

export type ContainerProps<T extends ContainerTag = 'div'> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'className' | 'children'>;

export const Container = <T extends ContainerTag = 'div'>({
  as,
  children,
  className,
  ...rest
}: ContainerProps<T>) => {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag className={`${styles.container}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
};

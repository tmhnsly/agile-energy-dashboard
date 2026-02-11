'use client';

import { type ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { TbInfoCircleFilled } from 'react-icons/tb';
import styles from './InfoTooltip.module.scss';

interface InfoTooltipProps {
  children: ReactNode;
  label?: string;
}

export const InfoTooltip = ({ children, label = 'More info' }: InfoTooltipProps) => (
  <Tooltip.Provider delayDuration={300} skipDelayDuration={150}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className={styles.trigger}
          aria-label={label}
        >
          <TbInfoCircleFilled />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={styles.content} sideOffset={8} collisionPadding={12} align="start">
          {children}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

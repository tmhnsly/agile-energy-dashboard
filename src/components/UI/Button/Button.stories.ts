import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { Button } from './Button';

/**
 * Button with four style variants and five colour options.
 * Use `solid` for primary actions, `soft` for secondary, `outline` for
 * low-emphasis, and `ghost` for inline or nav-style actions.
 */
const meta = {
  title: 'UI / Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    color: {
      control: 'select',
      options: ['accent', 'error', 'success', 'warning', 'info'],
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Primary action style — filled background. */
export const Solid: Story = {
  args: {
    variant: 'solid',
    label: 'Button',
  },
};

/** Secondary action style — tinted background. */
export const Soft: Story = {
  args: {
    variant: 'soft',
    label: 'Button',
  },
};

/** Low-emphasis style — border only. */
export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Button',
  },
};

/** Minimal style for inline or nav-style actions. */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Button',
  },
};

/** Destructive action colour. */
export const Error: Story = {
  args: {
    variant: 'solid',
    color: 'error',
    label: 'Delete',
  },
};

/** Confirmation action colour. */
export const Success: Story = {
  args: {
    variant: 'solid',
    color: 'success',
    label: 'Confirm',
  },
};

/** Caution action colour. */
export const Warning: Story = {
  args: {
    variant: 'solid',
    color: 'warning',
    label: 'Caution',
  },
};

/** Informational action colour. */
export const Info: Story = {
  args: {
    variant: 'solid',
    color: 'info',
    label: 'Details',
  },
};

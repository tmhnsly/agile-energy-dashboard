import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: { controls: { disable: true } },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outline', 'ghost'],
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

export const Solid: Story = {
  args: {
    variant: 'solid',
    label: 'Button',
  },
};

export const Soft: Story = {
  args: {
    variant: 'soft',
    label: 'Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Button',
  },
};

export const Error: Story = {
  args: {
    variant: 'solid',
    color: 'error',
    label: 'Delete',
  },
};

export const Success: Story = {
  args: {
    variant: 'solid',
    color: 'success',
    label: 'Confirm',
  },
};

export const Warning: Story = {
  args: {
    variant: 'solid',
    color: 'warning',
    label: 'Caution',
  },
};

export const Info: Story = {
  args: {
    variant: 'solid',
    color: 'info',
    label: 'Details',
  },
};

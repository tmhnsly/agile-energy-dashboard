import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { Button } from './Button';

const meta = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {},
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Button',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Button',
  },
};

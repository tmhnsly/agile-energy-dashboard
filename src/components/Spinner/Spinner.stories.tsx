import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: 'small', label: 'Loading data' },
};

export const Medium: Story = {
  args: { size: 'medium', label: 'Loading data' },
};

export const Large: Story = {
  args: { size: 'large', label: 'Loading data' },
};

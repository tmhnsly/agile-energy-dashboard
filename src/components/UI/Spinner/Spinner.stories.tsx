import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Spinner } from './Spinner';

/** Spinning loading indicator. Includes a screen-reader label for accessibility. */
const meta = {
  title: 'UI / Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Small spinner for inline indicators. */
export const Small: Story = {
  args: { size: 'small', label: 'Loading data' },
};

/** Medium spinner — default size. */
export const Medium: Story = {
  args: { size: 'medium', label: 'Loading data' },
};

/** Large spinner for page-level loading states. */
export const Large: Story = {
  args: { size: 'large', label: 'Loading data' },
};

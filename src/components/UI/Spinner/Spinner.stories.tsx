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

/** Medium spinner with default "Loading" label. */
export const Default: Story = {
  args: { size: 'medium', label: 'Loading data' },
};

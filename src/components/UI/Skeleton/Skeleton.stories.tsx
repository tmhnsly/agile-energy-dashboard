import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Skeleton } from './Skeleton';

/**
 * Loading placeholders with a pulse animation. Use the base `Skeleton` for
 * custom shapes.
 */
const meta = {
  title: 'UI / Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    radius: {
      control: 'select',
      options: ['none', 'small', 'medium', 'full'],
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Basic skeleton blocks in graduated sizes. */
export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: 300 }}>
      <Skeleton width="100%" height={12} radius="small" />
      <Skeleton width="100%" height={20} radius="small" />
      <Skeleton width="100%" height={40} radius="medium" />
      <Skeleton width="100%" height={120} radius="medium" />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Skeleton, SkeletonText, SkeletonCard } from './Skeleton';

/**
 * Loading placeholders with a pulse animation. Use the base `Skeleton` for
 * custom shapes, or the ready-made `SkeletonText` and `SkeletonCard` composites.
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

/** Multi-line text placeholder. */
export const Text: Story = {
  render: () => (
    <div style={{ width: 300 }}>
      <SkeletonText lines={3} />
    </div>
  ),
};

/** Card skeleton with title and text lines. */
export const Card: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <SkeletonCard lines={3} />
    </div>
  ),
};

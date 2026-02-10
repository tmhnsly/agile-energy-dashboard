import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Skeleton, SkeletonText, SkeletonCard } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Basic skeleton block in various sizes. */
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

/** Composed loading state — stat row + chart area. */
export const PageLoadingState: Story = {
  render: () => (
    <div style={{ width: 600, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>
      <Skeleton width="100%" height={300} radius="medium" />
    </div>
  ),
};

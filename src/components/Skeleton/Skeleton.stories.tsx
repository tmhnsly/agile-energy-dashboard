import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonText } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    width: 200,
    height: 20,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: 300 }}>
      <Skeleton width="100%" height={12} radius="small" />
      <Skeleton width="100%" height={20} radius="small" />
      <Skeleton width="100%" height={40} radius="medium" />
      <Skeleton width="100%" height={120} radius="medium" />
    </div>
  ),
};

export const Text: Story = {
  render: () => (
    <div style={{ width: 300 }}>
      <SkeletonText lines={3} />
    </div>
  ),
};

export const Circle: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
      <SkeletonCircle size={32} />
      <SkeletonCircle size={40} />
      <SkeletonCircle size={56} />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <SkeletonCard lines={3} />
    </div>
  ),
};

export const PageLoadingState: Story = {
  render: () => (
    <div style={{ width: 600, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </div>
      {/* Chart area */}
      <Skeleton width="100%" height={300} radius="medium" />
    </div>
  ),
};

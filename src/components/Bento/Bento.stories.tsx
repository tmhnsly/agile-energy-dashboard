import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoGrid } from './BentoGrid';
import { BentoCard } from './BentoCard';
import { Skeleton } from '@/components/Skeleton/Skeleton';

/**
 * ## Purpose
 * Simple responsive bento-style grid for dashboard layouts.
 *
 * ## Props
 * **BentoGrid** — `children`, `className`
 * **BentoCard** — `children`, `span` (1 | 2 | 3), `loading`, `skeleton`, `className`
 *
 * ## Usage notes
 * - Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column.
 * - Use `span` on BentoCard to control how many columns a tile occupies.
 * - Use `loading` + `skeleton` to show a tile-level loading silhouette.
 */
const meta = {
  title: 'Components/BentoGrid',
  component: BentoGrid,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof BentoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Placeholder = ({ label, height = 120 }: { label: string; height?: number }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height,
      color: 'var(--mono-text-low-contrast)',
      fontSize: 'var(--text-sm)',
    }}
  >
    {label}
  </div>
);

export const Default: Story = {
  args: {
    children: (
      <>
        <BentoCard span={3}><Placeholder label="Full-width tile (span 3)" height={200} /></BentoCard>
        <BentoCard><Placeholder label="Tile A" /></BentoCard>
        <BentoCard><Placeholder label="Tile B" /></BentoCard>
        <BentoCard><Placeholder label="Tile C" /></BentoCard>
      </>
    ),
  },
};

export const MixedSpans: Story = {
  args: {
    children: (
      <>
        <BentoCard span={2}><Placeholder label="Span 2" height={160} /></BentoCard>
        <BentoCard><Placeholder label="Span 1" height={160} /></BentoCard>
        <BentoCard><Placeholder label="Span 1" /></BentoCard>
        <BentoCard><Placeholder label="Span 1" /></BentoCard>
        <BentoCard><Placeholder label="Span 1" /></BentoCard>
      </>
    ),
  },
};

export const SingleColumn: Story = {
  args: {
    children: (
      <>
        <BentoCard><Placeholder label="Card 1" /></BentoCard>
        <BentoCard><Placeholder label="Card 2" /></BentoCard>
        <BentoCard><Placeholder label="Card 3" /></BentoCard>
      </>
    ),
  },
};

/** Demonstrates the `loading` prop on BentoCard tiles. */
export const LoadingStates: Story = {
  args: {
    children: (
      <>
        <BentoCard span={3} loading>
          <Placeholder label="This content is hidden" height={200} />
        </BentoCard>
        <BentoCard loading>
          <Placeholder label="Hidden" />
        </BentoCard>
        <BentoCard>
          <Placeholder label="Loaded tile" />
        </BentoCard>
        <BentoCard
          loading
          skeleton={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Skeleton width="60%" height="1.25rem" radius="small" />
              <Skeleton width="100%" height="5rem" radius="small" />
            </div>
          }
        >
          <Placeholder label="Hidden" />
        </BentoCard>
      </>
    ),
  },
};

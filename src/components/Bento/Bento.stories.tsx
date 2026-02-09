import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoGrid } from './BentoGrid';
import { BentoCard } from './BentoCard';

/**
 * ## Purpose
 * Simple responsive bento-style grid for dashboard layouts.
 *
 * ## Props
 * **BentoGrid** — `children`, `className`
 * **BentoCard** — `children`, `span` (1 | 2 | 3), `className`
 *
 * ## Usage notes
 * - Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column.
 * - Use `span` on BentoCard to control how many columns a tile occupies.
 * - Items that already have card styling (e.g. PriceMarketView) can be
 *   placed directly inside BentoGrid without BentoCard.
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

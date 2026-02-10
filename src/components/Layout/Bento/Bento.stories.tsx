import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoGrid } from './BentoGrid';
import { BentoTile } from './BentoTile';
import { Skeleton } from '@/components/UI/Skeleton/Skeleton';

/**
 * Dashboard grid layout. Drop `BentoTile` components inside a `BentoGrid` and they
 * arrange themselves automatically. Each tile's `variant` controls how much space
 * it takes up — `wide` spans a full row, `feature` takes two columns, and so on.
 * Tiles also act as container-query containers so their children can adapt to the
 * available width rather than the viewport.
 */
const meta = {
  title: 'Layout / BentoGrid',
  component: BentoGrid,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof BentoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Placeholder = ({ label, height = '7.5rem' }: { label: string; height?: string }) => (
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

/** One wide tile followed by three standard tiles. */
export const Default: Story = {
  args: {
    children: (
      <>
        <BentoTile variant="wide"><Placeholder label="Wide tile" height="12rem" /></BentoTile>
        <BentoTile><Placeholder label="Standard A" /></BentoTile>
        <BentoTile><Placeholder label="Standard B" /></BentoTile>
        <BentoTile><Placeholder label="Standard C" /></BentoTile>
      </>
    ),
  },
};

/** Mixing different tile variants — the grid fills gaps automatically. */
export const MixedVariants: Story = {
  args: {
    children: (
      <>
        <BentoTile variant="feature"><Placeholder label="Feature" height="12rem" /></BentoTile>
        <BentoTile><Placeholder label="Standard A" /></BentoTile>
        <BentoTile variant="tall"><Placeholder label="Tall" height="100%" /></BentoTile>
        <BentoTile><Placeholder label="Standard B" /></BentoTile>
        <BentoTile variant="compact"><Placeholder label="Compact" height="3rem" /></BentoTile>
        <BentoTile><Placeholder label="Standard C" /></BentoTile>
      </>
    ),
  },
};

/** Three equally-sized tiles in a row. */
export const StandardOnly: Story = {
  args: {
    children: (
      <>
        <BentoTile><Placeholder label="Tile 1" /></BentoTile>
        <BentoTile><Placeholder label="Tile 2" /></BentoTile>
        <BentoTile><Placeholder label="Tile 3" /></BentoTile>
      </>
    ),
  },
};

/** Tiles with `loading` show a skeleton placeholder instead of their content. */
export const LoadingStates: Story = {
  args: {
    children: (
      <>
        <BentoTile variant="wide" loading>
          <Placeholder label="Hidden" height="12rem" />
        </BentoTile>
        <BentoTile loading>
          <Placeholder label="Hidden" />
        </BentoTile>
        <BentoTile>
          <Placeholder label="Loaded tile" />
        </BentoTile>
        <BentoTile
          loading
          skeleton={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Skeleton width="60%" height="1.25rem" radius="small" />
              <Skeleton width="100%" height="5rem" radius="small" />
            </div>
          }
        >
          <Placeholder label="Hidden" />
        </BentoTile>
      </>
    ),
  },
};

/** Larger tiles leave gaps that smaller tiles flow into. */
export const AutoFlowDemo: Story = {
  args: {
    children: (
      <>
        <BentoTile variant="feature"><Placeholder label="Feature 1" height="10rem" /></BentoTile>
        <BentoTile><Placeholder label="A" /></BentoTile>
        <BentoTile><Placeholder label="B" /></BentoTile>
        <BentoTile><Placeholder label="C" /></BentoTile>
        <BentoTile variant="feature"><Placeholder label="Feature 2" height="10rem" /></BentoTile>
        <BentoTile><Placeholder label="D" /></BentoTile>
      </>
    ),
  },
};

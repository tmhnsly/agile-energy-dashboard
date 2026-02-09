import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoGrid } from './BentoGrid';
import { BentoTile } from './BentoTile';
import { Skeleton } from '@/components/Skeleton/Skeleton';

/**
 * ## BentoGrid + BentoTile
 * CSS Grid auto-placement dashboard layout.
 *
 * ### Props
 * **BentoGrid** — `children`, `className`
 * **BentoTile** — `children`, `variant`, `loading`, `skeleton`, `className`
 *
 * ### Variants
 * | Variant    | Tablet  | Desktop | Notes                |
 * |------------|---------|---------|----------------------|
 * | `standard` | 1 col   | 1 col   | Default              |
 * | `feature`  | 2 cols  | 2 cols  | Prominent tile       |
 * | `wide`     | 2 cols  | 3 cols  | Full-row tile        |
 * | `tall`     | 2 rows  | 2 rows  | Vertically extended  |
 * | `compact`  | 1 col   | 1 col   | Smaller min-height   |
 *
 * ### Usage notes
 * - Grid uses `grid-auto-flow: dense` — tiles flow and fill gaps automatically.
 * - Tiles declare *intent* via `variant`, not explicit column spans.
 * - Use `loading` + `skeleton` for tile-level loading silhouettes.
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

/** Feature tiles take 2 columns on tablet+; standard tiles fill remaining gaps. */
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

/** Demonstrates the `loading` prop with default and custom skeletons. */
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

/** Dense auto-flow fills gaps when tiles have different sizes. */
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

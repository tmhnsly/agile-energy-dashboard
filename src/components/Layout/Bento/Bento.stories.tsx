import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BentoGrid } from './BentoGrid';
import { BentoTile, type BentoTileProps } from './BentoTile';
import { Skeleton } from '@/components/UI/Skeleton/Skeleton';

const SPAN_OPTIONS: BentoTileProps['span'][] = [
  'standard',
  'feature',
  'wide',
  'tall',
  'compact',
];

/**
 * Responsive dashboard grid. `BentoGrid` creates a CSS grid that goes from
 * 1 column (mobile) → 2 columns (tablet ≥ 768 px) → 3 columns (desktop ≥ 1280 px).
 * Each `BentoTile` sets its `span` to control how many columns / rows it occupies.
 * `grid-auto-flow: dense` fills gaps automatically.
 *
 * ### Span reference
 *
 * | Value | Mobile | Tablet (2 col) | Desktop (3 col) |
 * |-------|--------|----------------|-----------------|
 * | `standard` | 1 col | 1 col | 1 col |
 * | `feature` | 1 col | 2 cols | 2 cols |
 * | `wide` | 1 col | 2 cols | 3 cols (full row) |
 * | `tall` | 1 row | 2 rows | 2 rows |
 * | `compact` | 1 col, min-height removed | same | same |
 *
 * Tiles also set `container-type: inline-size` so children can use
 * container queries (via the `cq.medium` / `cq.large` mixins) to adapt
 * to the tile's width rather than the viewport.
 *
 * **Resize the browser** to see how spans behave at each breakpoint.
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

/* ── Helpers ─────────────────────────────────────── */

const tileStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  height: '100%',
  minHeight: '5rem',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-mono, monospace)',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--mono-text)',
  fontWeight: 600,
};

const metaStyle: React.CSSProperties = {
  color: 'var(--mono-text-low-contrast)',
  fontSize: 'var(--text-xs)',
};

function Tile({ label, span = 'standard', height }: { label: string; span?: BentoTileProps['span']; height?: string }) {
  return (
    <BentoTile span={span}>
      <div style={{ ...tileStyle, ...(height ? { minHeight: height } : {}) }}>
        <span style={labelStyle}>{label}</span>
        <span style={metaStyle}>span=&quot;{span}&quot;</span>
      </div>
    </BentoTile>
  );
}

/* ── Stories ──────────────────────────────────────── */

/**
 * The default dashboard layout — a full-width tile at the top followed by
 * a 2-column feature and a standard tile, then three standard tiles.
 * Resize your browser past the 768 px and 1280 px breakpoints to see the
 * grid columns change.
 */
export const Default: Story = {
  args: {
    children: (
      <>
        <Tile label="Hero" span="wide" height="10rem" />
        <Tile label="Primary" span="feature" height="9rem" />
        <Tile label="Sidebar" />
        <Tile label="A" />
        <Tile label="B" />
        <Tile label="C" />
      </>
    ),
  },
};

/**
 * All five span values at once, showing how the grid auto-places them.
 * Each tile displays its `span` value.
 */
export const AllSpans: Story = {
  args: {
    children: (
      <>
        <Tile label="Wide" span="wide" height="6rem" />
        <Tile label="Feature" span="feature" height="8rem" />
        <Tile label="Standard" span="standard" />
        <Tile label="Tall" span="tall" height="100%" />
        <Tile label="Compact" span="compact" />
        <Tile label="Standard" span="standard" />
        <Tile label="Compact" span="compact" />
      </>
    ),
  },
};

/**
 * Interactive sandbox — click a tile to cycle its `span` value.
 * Demonstrates how the dense auto-flow algorithm re-packs tiles as their
 * sizes change.
 */
export const Playground: Story = {
  args: { children: null },
  render: function Playground() {
    const [tiles, setTiles] = useState<{ id: number; label: string; span: BentoTileProps['span'] }[]>([
      { id: 1, label: 'A', span: 'wide' },
      { id: 2, label: 'B', span: 'feature' },
      { id: 3, label: 'C', span: 'standard' },
      { id: 4, label: 'D', span: 'standard' },
      { id: 5, label: 'E', span: 'standard' },
      { id: 6, label: 'F', span: 'compact' },
    ]);

    const cycleSpan = (id: number) => {
      setTiles(prev =>
        prev.map(t => {
          if (t.id !== id) return t;
          const idx = SPAN_OPTIONS.indexOf(t.span);
          return { ...t, span: SPAN_OPTIONS[(idx + 1) % SPAN_OPTIONS.length] };
        }),
      );
    };

    const addTile = () => {
      setTiles(prev => {
        const next = prev.length + 1;
        return [...prev, { id: Date.now(), label: String.fromCharCode(64 + next), span: 'standard' as const }];
      });
    };

    const removeLast = () => {
      setTiles(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <button
            type="button"
            onClick={addTile}
            style={btnStyle}
          >
            + Add tile
          </button>
          <button
            type="button"
            onClick={removeLast}
            style={btnStyle}
          >
            - Remove last
          </button>
          <span style={{ color: 'var(--mono-text-low-contrast)', alignSelf: 'center' }}>
            Click a tile to cycle its span
          </span>
        </div>
        <BentoGrid>
          {tiles.map(t => (
            <BentoTile key={t.id} span={t.span}>
              <button
                type="button"
                onClick={() => cycleSpan(t.id)}
                style={{
                  ...tileStyle,
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  minHeight: t.span === 'tall' ? '12rem' : t.span === 'wide' || t.span === 'feature' ? '8rem' : '5rem',
                }}
              >
                <span style={labelStyle}>{t.label}</span>
                <span style={metaStyle}>span=&quot;{t.span}&quot;</span>
              </button>
            </BentoTile>
          ))}
        </BentoGrid>
      </div>
    );
  },
};

const btnStyle: React.CSSProperties = {
  padding: 'var(--space-1) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--mono-border)',
  background: 'var(--mono-subtle-bg)',
  color: 'var(--mono-text)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
};

/**
 * Tiles with `loading` show a skeleton instead of content.
 * Pass a custom `skeleton` to override the default shimmer.
 */
export const LoadingStates: Story = {
  args: {
    children: (
      <>
        <BentoTile span="wide" loading>
          <div style={tileStyle}>Hidden</div>
        </BentoTile>
        <BentoTile loading>
          <div style={tileStyle}>Hidden</div>
        </BentoTile>
        <BentoTile>
          <div style={tileStyle}>
            <span style={labelStyle}>Loaded</span>
          </div>
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
          <div style={tileStyle}>Hidden</div>
        </BentoTile>
      </>
    ),
  },
};

/**
 * `grid-auto-flow: dense` lets smaller tiles flow into gaps left by
 * larger ones. Resize the viewport to watch tiles re-pack.
 */
export const DenseAutoFlow: Story = {
  args: {
    children: (
      <>
        <Tile label="Feature 1" span="feature" height="10rem" />
        <Tile label="A" />
        <Tile label="B" />
        <Tile label="C" />
        <Tile label="Feature 2" span="feature" height="10rem" />
        <Tile label="D" />
      </>
    ),
  },
};

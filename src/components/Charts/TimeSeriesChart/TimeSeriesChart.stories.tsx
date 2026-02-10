import { useState, useMemo, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { TimeRange } from '@/types/energy';
import { formatTime, formatDuration } from '@/utils/format';
import { lowerBound, upperBound } from '@/utils/binarySearch';
import { TimeSeriesChart } from './TimeSeriesChart';
import { mockSeriesA, mockBands, mockRange } from './mockData';

/**
 * General-purpose time-series line chart built on [visx](https://airbnb.io/visx/).
 *
 * ### Key concepts
 *
 * | Prop | Purpose |
 * |------|---------|
 * | `series` | Array of `ChartSeries` — each renders as a coloured line. The first series is treated as "primary" for min/max markers. |
 * | `bands` | Array of `ChartBand` — translucent overlays behind the lines (e.g. flex events). Click a band to zoom to its range. |
 * | `fullRange` | The total time extent of the data. The x-axis always spans this range. |
 * | `activeRange` | The currently selected sub-range. When equal to `fullRange`, no selection overlay is shown. |
 * | `onRangeChange` | Called with the new `TimeRange` when the user finishes a drag or clicks a band. |
 * | `onRangePreview` | Called on **every frame** during a drag with the in-progress range (or `null` on drag end). Use this to show live stats while dragging. |
 *
 * ### Pointer interactions
 *
 * - **Drag** on empty space to draw a new selection.
 * - **Drag handles** to resize an existing selection.
 * - **Drag inside** the selection to pan it (duration stays locked).
 * - **Click a band** to snap the selection to that band's range.
 * - **Hover** to see a crosshair tooltip with values and band info.
 *
 * ### Keyboard navigation
 *
 * Tab to the chart to focus it — a pulsing ring appears on the first
 * data point and a tooltip shows its value. Then use the following keys:
 *
 * | Key | Action |
 * |-----|--------|
 * | `ArrowRight` | Move focus to next data point |
 * | `ArrowLeft` | Move focus to previous data point |
 * | `Space` | Place range boundary — first press sets the start, second press sets the end and commits the selection |
 * | `Shift + ArrowRight` | Extend/start selection rightward (power-user shortcut) |
 * | `Shift + ArrowLeft` | Extend/start selection leftward (power-user shortcut) |
 * | `Home` | Jump to first data point |
 * | `End` | Jump to last data point |
 * | `Escape` | Clear selection and pending boundary, reset to full range |
 * | `Enter` | Confirm current Shift+Arrow selection |
 *
 * Keyboard and pointer input use a **last-input-wins** model — moving
 * the pointer dismisses the keyboard focus indicator and vice-versa.
 * Both write to the same `activeRange` via `onRangeChange`.
 *
 * ### Sizing
 *
 * The component requires explicit `width` and `height` — wrap it in
 * `ParentSize` from `@visx/responsive` for responsive layouts. The left
 * margin auto-sizes to fit the widest y-axis label; override via the
 * `margin` prop if needed.
 */
const meta = {
  title: 'Charts / TimeSeriesChart',
  component: TimeSeriesChart,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    series: { table: { disable: true } },
    bands: { table: { disable: true } },
    fullRange: { table: { disable: true } },
    activeRange: { table: { disable: true } },
    onRangeChange: { table: { disable: true } },
    onRangePreview: { table: { disable: true } },
    width: { table: { disable: true } },
    height: { table: { disable: true } },
    showMinMaxMarkers: {
      control: 'boolean',
      description: 'Show circle markers at the min and max values within the active range.',
    },
  },
} satisfies Meta<typeof TimeSeriesChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const CHART_HEIGHT = 380;

/** Observe an element's content width via ResizeObserver. */
function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Compute min/max stats for a given range. */
function useRangeStats(range: TimeRange) {
  return useMemo(() => {
    const data = mockSeriesA.data;
    const start = lowerBound(data, range.fromTs);
    const end = upperBound(data, range.toTs);
    if (start >= end) return { min: null, max: null };
    let min = data[start];
    let max = data[start];
    for (let i = start + 1; i < end; i++) {
      if (data[i].value < min.value) min = data[i];
      if (data[i].value > max.value) max = data[i];
    }
    return {
      min: { value: min.value, ts: min.ts },
      max: { value: max.value, ts: max.ts },
    };
  }, [range]);
}

/**
 * Fully interactive demo — drag to select a range, click bands, hover for tooltip.
 * The status bar above the chart shows live min/max values and the current drag state,
 * demonstrating how `onRangePreview` can drive external UI during a drag.
 *
 * **Keyboard:** Tab to the chart to focus it. Use Arrow keys to navigate
 * data points. Press Space to set a range start, navigate, then Space
 * again to set the range end. Press Escape to reset.
 */
export const Interactive: Story = {
  args: {
    series: [mockSeriesA],
    bands: mockBands,
    fullRange: mockRange,
    activeRange: mockRange,
    onRangeChange: () => {},
    width: 800,
    height: CHART_HEIGHT,
  },
  render: function Interactive() {
    const containerRef = useRef<HTMLDivElement>(null);
    const width = useContainerWidth(containerRef);
    const [activeRange, setActiveRange] = useState<TimeRange>(mockRange);
    const [previewRange, setPreviewRange] = useState<TimeRange | null>(null);
    const displayRange = previewRange ?? activeRange;
    const stats = useRangeStats(displayRange);

    const isFullRange =
      activeRange.fromTs === mockRange.fromTs &&
      activeRange.toTs === mockRange.toTs;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 'var(--text-sm)',
            color: 'var(--mono-text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>Min: {stats.min ? stats.min.value.toFixed(1) : '—'}</span>
          <span>Max: {stats.max ? stats.max.value.toFixed(1) : '—'}</span>
          <span style={{ color: 'var(--mono-text-low-contrast)' }}>
            {previewRange
              ? `Dragging: ${formatTime(previewRange.fromTs)} – ${formatTime(previewRange.toTs)} (${formatDuration(previewRange.fromTs, previewRange.toTs)})`
              : isFullRange
                ? 'Full range'
                : `Selected: ${formatTime(activeRange.fromTs)} – ${formatTime(activeRange.toTs)}`}
          </span>
        </div>
        <div ref={containerRef} style={{ width: '100%' }}>
          {width > 0 && (
            <TimeSeriesChart
              series={[mockSeriesA]}
              bands={mockBands}
              fullRange={mockRange}
              activeRange={activeRange}
              onRangeChange={setActiveRange}
              onRangePreview={setPreviewRange}
              width={width}
              height={CHART_HEIGHT}
            />
          )}
        </div>
      </div>
    );
  },
};

/**
 * Band overlays highlight time windows over the line (e.g. flex events, peak periods).
 * Click a band to zoom the selection to its range. Hover a band to see it highlight
 * and show its label in the tooltip.
 */
export const WithBands: Story = {
  args: {
    series: [mockSeriesA],
    bands: mockBands,
    fullRange: mockRange,
    activeRange: mockRange,
    onRangeChange: () => {},
    width: 800,
    height: CHART_HEIGHT,
  },
  render: function WithBands() {
    const containerRef = useRef<HTMLDivElement>(null);
    const width = useContainerWidth(containerRef);
    const [activeRange, setActiveRange] = useState<TimeRange>(mockRange);

    return (
      <div ref={containerRef} style={{ width: '100%' }}>
        {width > 0 && (
          <TimeSeriesChart
            series={[mockSeriesA]}
            bands={mockBands}
            fullRange={mockRange}
            activeRange={activeRange}
            onRangeChange={setActiveRange}
            width={width}
            height={CHART_HEIGHT}
          />
        )}
      </div>
    );
  },
};

/**
 * Starts with a pre-selected sub-range showing the dim overlay and drag handles.
 * Drag the handles to resize, drag inside the selection to pan, or draw a new
 * selection outside the current one.
 */
export const WithSelection: Story = {
  args: {
    series: [mockSeriesA],
    fullRange: mockRange,
    activeRange: mockRange,
    onRangeChange: () => {},
    width: 800,
    height: CHART_HEIGHT,
  },
  render: function WithSelection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const width = useContainerWidth(containerRef);
    const [activeRange, setActiveRange] = useState<TimeRange>({
      fromTs: mockSeriesA.data[10].ts,
      toTs: mockSeriesA.data[38].ts,
    });

    return (
      <div ref={containerRef} style={{ width: '100%' }}>
        {width > 0 && (
          <TimeSeriesChart
            series={[mockSeriesA]}
            fullRange={mockRange}
            activeRange={activeRange}
            onRangeChange={setActiveRange}
            width={width}
            height={CHART_HEIGHT}
          />
        )}
      </div>
    );
  },
};

/**
 * Demonstrates keyboard navigation. Press **Tab** to focus the chart —
 * a pulsing focus ring and tooltip appear on the first data point.
 *
 * ### Selecting a range with Space
 *
 * 1. Navigate to a data point with Arrow keys
 * 2. Press **Space** to place the range start (a dashed line appears)
 * 3. Navigate to the end point
 * 4. Press **Space** again to commit the selection
 *
 * ### All keys
 *
 * | Key | Action |
 * |-----|--------|
 * | `ArrowRight` / `ArrowLeft` | Move to next / previous data point |
 * | `Space` | Place range start, then range end |
 * | `Shift + Arrow` | Extend or start a selection (power-user shortcut) |
 * | `Home` / `End` | Jump to first / last data point |
 * | `Escape` | Clear selection and pending boundary |
 * | `Enter` | Confirm current Shift+Arrow selection |
 *
 * Moving the pointer back over the chart dismisses keyboard mode
 * (last-input-wins).
 */
export const KeyboardNavigation: Story = {
  args: {
    series: [mockSeriesA],
    bands: mockBands,
    fullRange: mockRange,
    activeRange: mockRange,
    onRangeChange: () => {},
    width: 800,
    height: CHART_HEIGHT,
  },
  render: function KeyboardNavigation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const width = useContainerWidth(containerRef);
    const [activeRange, setActiveRange] = useState<TimeRange>(mockRange);

    const isFullRange =
      activeRange.fromTs === mockRange.fromTs &&
      activeRange.toTs === mockRange.toTs;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 'var(--text-sm)',
            color: 'var(--mono-text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>
            <kbd style={kbdStyle}>Tab</kbd> to focus
            {' '}<kbd style={kbdStyle}>&larr;</kbd> <kbd style={kbdStyle}>&rarr;</kbd> navigate
            {' '}<kbd style={kbdStyle}>Space</kbd> set start/end
            {' '}<kbd style={kbdStyle}>Esc</kbd> reset
          </span>
          <span style={{ color: 'var(--mono-text-low-contrast)' }}>
            {isFullRange
              ? 'Full range — navigate then press Space to start selecting'
              : `Selected: ${formatTime(activeRange.fromTs)} – ${formatTime(activeRange.toTs)} (${formatDuration(activeRange.fromTs, activeRange.toTs)})`}
          </span>
        </div>
        <div ref={containerRef} style={{ width: '100%' }}>
          {width > 0 && (
            <TimeSeriesChart
              series={[mockSeriesA]}
              bands={mockBands}
              fullRange={mockRange}
              activeRange={activeRange}
              onRangeChange={setActiveRange}
              width={width}
              height={CHART_HEIGHT}
            />
          )}
        </div>
      </div>
    );
  },
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  fontSize: 'var(--text-xs)',
  fontFamily: 'inherit',
  lineHeight: 1.4,
  color: 'var(--mono-text)',
  background: 'var(--mono-subtle-bg)',
  border: '1px solid var(--mono-border)',
  borderRadius: 'var(--radius-sm)',
};

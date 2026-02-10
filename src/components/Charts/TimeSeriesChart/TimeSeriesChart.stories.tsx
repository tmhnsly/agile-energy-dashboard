import { useState, useMemo, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { TimeRange } from '@/types/energy';
import { formatTime, formatDuration } from '@/utils/format';
import { lowerBound, upperBound } from '@/utils/binarySearch';
import { TimeSeriesChart } from './TimeSeriesChart';
import { mockSeriesA, mockBands, mockRange } from './mockData';

/**
 * General-purpose time-series line chart. Supports drag-to-select a time range,
 * clickable band overlays, min/max markers, and a hover tooltip. Pass `onRangePreview`
 * to receive live updates during a drag (useful for showing stats in real time).
 *
 * Expects explicit `width` / `height` — wrap in `ParentSize` if you need responsive sizing.
 */
const meta = {
  title: 'Charts / TimeSeriesChart',
  component: TimeSeriesChart,
  parameters: {
    layout: 'padded',
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
 * Fully interactive — drag to select a range, click bands, hover for tooltip.
 * The debug bar above the chart shows live min/max and drag state.
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
 * Click a band to zoom the selection to its range. Drag to select a custom range.
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
 * Starts with a pre-selected sub-range showing the dim overlay and selection handles.
 * Drag the handles or draw a new selection to change the range.
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

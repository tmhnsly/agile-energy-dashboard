import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TooltipCrosshair, TooltipContent } from './TooltipLayer';
import { mockSeriesA, mockBands } from './mockData';
import { ChartCanvas, INNER_WIDTH, INNER_HEIGHT, createMockScales } from './storyUtils';
import type { TooltipData } from '@/types/chart';

const { xScale, yScale } = createMockScales();
const midPoint = mockSeriesA.data[24];
const bandPoint = mockSeriesA.data[6]; // Inside first mock band

const tooltipData: TooltipData = {
  ts: midPoint.ts,
  values: [{ seriesId: 'price', label: 'Price', value: midPoint.value, tone: 'accent' }],
  inBand: null,
};

const tooltipDataWithBand: TooltipData = {
  ts: bandPoint.ts,
  values: [{ seriesId: 'price', label: 'Price', value: bandPoint.value, tone: 'accent' }],
  inBand: mockBands[0],
};

/* ── TooltipCrosshair ─────────────────────────────── */

/**
 * Vertical crosshair line and dot marker rendered in SVG at the hovered data point.
 */
const crosshairMeta = {
  title: 'Charts / TimeSeriesChart / TooltipCrosshair',
  component: TooltipCrosshair,
  parameters: { layout: 'padded' },
  decorators: [
    (Story: React.ComponentType) => (
      <ChartCanvas>
        <rect
          x={0}
          y={0}
          width={INNER_WIDTH}
          height={INNER_HEIGHT}
          fill="var(--mono-subtle-bg)"
          rx={4}
        />
        <Story />
      </ChartCanvas>
    ),
  ],
} satisfies Meta<typeof TooltipCrosshair>;

export default crosshairMeta;
type CrosshairStory = StoryObj<typeof crosshairMeta>;

/** Crosshair line and dot at a mid-range data point. */
export const Default: CrosshairStory = {
  args: {
    tooltipData,
    xScale: xScale as unknown as (d: Date) => number,
    yScale: yScale as unknown as (v: number) => number,
    innerHeight: INNER_HEIGHT,
  },
};

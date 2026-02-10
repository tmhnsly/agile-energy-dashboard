import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { hoursToMilliseconds } from 'date-fns';

import { BentoTile } from '@/components/Layout';
import { UsageStatsBar } from './UsageStatsBar';
import { mockUsage, mockPrices } from '../mockData';

const mockRange = {
  fromTs: mockUsage[0].ts,
  toTs: mockUsage[mockUsage.length - 1].ts,
};

/**
 * Row of Peak and Total stat cards for household usage.
 * Used inside `HouseholdUsagePanel` header. Displays kWh and estimated cost.
 */
const meta = {
  title: 'Features / Household Usage / UsageStatsBar',
  component: UsageStatsBar,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <BentoTile span="wide">
        <Story />
      </BentoTile>
    ),
  ],
} satisfies Meta<typeof UsageStatsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full range with peak and total stats. */
export const Default: Story = {
  args: {
    stats: {
      totalKwh: 28.5,
      estimatedCostPence: 680.4,
      peak: { kwh: 2.0, ts: mockUsage[36].ts },
      low: { kwh: 0.05, ts: mockUsage[5].ts },
      count: mockUsage.length,
    },
    range: mockRange,
  },
};

/** Narrower sub-range. */
export const SubRange: Story = {
  args: {
    stats: {
      totalKwh: 12.3,
      estimatedCostPence: 294.2,
      peak: { kwh: 1.8, ts: mockUsage[18].ts },
      low: { kwh: 0.1, ts: mockUsage[2].ts },
      count: 24,
    },
    range: {
      fromTs: mockRange.fromTs,
      toTs: mockRange.fromTs + hoursToMilliseconds(12),
    },
  },
};

/** Empty state when no data is available. */
export const NoData: Story = {
  args: {
    stats: {
      totalKwh: 0,
      estimatedCostPence: 0,
      peak: null,
      low: null,
      count: 0,
    },
    range: mockRange,
  },
};

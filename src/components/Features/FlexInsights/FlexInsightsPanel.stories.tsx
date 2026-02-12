import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { HouseholdKey } from '@/types/energy';
import { BentoTile, BentoGrid } from '@/components/Layout';
import { FlexInsightsPanel } from './FlexInsightsPanel';
import { FlexInsightsSkeleton } from './FlexInsightsSkeleton';
import { ShiftSimulator } from './ShiftSimulator/ShiftSimulator';
import { ShiftSimulatorSkeleton } from './ShiftSimulatorSkeleton';
import { mockPrices, mockFlexEvents, mockUsage } from './mockData';

/**
 * Flex insights panel showing daily cost and earning potential from
 * flexibility events. Switch household type to compare costs. Pair with
 * `ShiftSimulator` on the dashboard to model load-shifting savings.
 */
const meta = {
  title: 'Features / Flex Insights / FlexInsightsPanel',
  component: FlexInsightsPanel,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof FlexInsightsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default view — all data present with interactive household selector. */
export const Default: Story = {
  args: {
    prices: mockPrices,
    usage: mockUsage,
    flexEvents: mockFlexEvents,
    household: 'standard',
    onHouseholdChange: () => {},
  },
};

/** No flex events — only daily costs shown. */
export const NoFlexEvents: Story = {
  args: {
    prices: mockPrices,
    usage: mockUsage,
    flexEvents: [],
    household: 'standard',
    onHouseholdChange: () => {},
  },
};

/** Both tiles in a BentoGrid — matches how they sit on the dashboard. */
export const InBentoTile: Story = {
  args: {
    prices: mockPrices,
    usage: mockUsage,
    flexEvents: mockFlexEvents,
    household: 'standard',
    onHouseholdChange: () => {},
  },
  decorators: [
    () => {
      const [household, setHousehold] = useState<HouseholdKey>('standard');
      return (
        <BentoGrid>
          <BentoTile span="feature">
            <FlexInsightsPanel
              prices={mockPrices}
              usage={mockUsage}
              flexEvents={mockFlexEvents}
              household={household}
              onHouseholdChange={setHousehold}
            />
          </BentoTile>
          <BentoTile span="standard">
            <ShiftSimulator
              usage={mockUsage}
              prices={mockPrices}
              household={household}
            />
          </BentoTile>
        </BentoGrid>
      );
    },
  ],
};

/** Skeleton states for both tiles while loading. */
export const Loading: Story = {
  args: {
    prices: mockPrices,
    usage: mockUsage,
    flexEvents: mockFlexEvents,
    household: 'standard',
    onHouseholdChange: () => {},
  },
  decorators: [
    () => (
      <BentoGrid>
        <BentoTile span="feature" loading skeleton={<FlexInsightsSkeleton />}>
          {null}
        </BentoTile>
        <BentoTile span="standard" loading skeleton={<ShiftSimulatorSkeleton />}>
          {null}
        </BentoTile>
      </BentoGrid>
    ),
  ],
};

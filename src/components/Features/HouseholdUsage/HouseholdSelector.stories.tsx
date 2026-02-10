import { useState, useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { HouseholdKey } from '@/types/energy';
import { HouseholdSelector } from './HouseholdSelector';

/**
 * Toggle-button group for selecting household types. At least one must remain
 * selected — clicking the last active button is a no-op. "All" re-selects
 * every type.
 */
const ALL: ReadonlySet<HouseholdKey> = new Set<HouseholdKey>(['standard', 'heatPump', 'heatPumpBattery']);

const meta = {
  title: 'Features / Household Usage / HouseholdSelector',
  component: HouseholdSelector,
  parameters: {
    layout: 'centered',
  },
  args: {
    selected: ALL,
    onToggle: () => {},
  },
} satisfies Meta<typeof HouseholdSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulSelector({ initial }: { initial: ReadonlySet<HouseholdKey> }) {
  const [selected, setSelected] = useState<ReadonlySet<HouseholdKey>>(initial);
  const handleToggle = useCallback((next: ReadonlySet<HouseholdKey>) => {
    setSelected(next);
  }, []);
  return <HouseholdSelector selected={selected} onToggle={handleToggle} />;
}

/** All three household types selected. */
export const AllSelected: Story = {
  render: () => (
    <StatefulSelector
      initial={new Set<HouseholdKey>(['standard', 'heatPump', 'heatPumpBattery'])}
    />
  ),
};

/** Only Standard selected. */
export const SingleSelected: Story = {
  render: () => (
    <StatefulSelector initial={new Set<HouseholdKey>(['standard'])} />
  ),
};

/** Standard and Heat Pump selected. */
export const TwoSelected: Story = {
  render: () => (
    <StatefulSelector
      initial={new Set<HouseholdKey>(['standard', 'heatPump'])}
    />
  ),
};

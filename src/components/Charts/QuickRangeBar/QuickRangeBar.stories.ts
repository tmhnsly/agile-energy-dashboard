import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { QuickRangeBar } from './QuickRangeBar';

/**
 * Row of time-range preset buttons (6 h, 12 h, 24 h, 48 h, All).
 * The active preset is highlighted; clicking a button fires `onPresetSelect`
 * with the corresponding hour count (or `null` for "All").
 */
const meta = {
  title: 'Charts / QuickRangeBar',
  component: QuickRangeBar,
  parameters: {
    layout: 'centered',
  },
  args: { onPresetSelect: fn() },
} satisfies Meta<typeof QuickRangeBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "All" preset selected — the default state when no zoom is active. */
export const Default: Story = {
  args: {
    activePreset: 'All',
  },
};

/** A specific duration preset is active. */
export const PresetActive: Story = {
  args: {
    activePreset: '6h',
  },
};

/** No preset matches the current range (e.g. after a manual drag). */
export const NoPreset: Story = {
  args: {
    activePreset: null,
  },
};

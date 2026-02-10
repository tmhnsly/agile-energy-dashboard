import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { StatCard } from './StatCard';
import { STAT_CARD_ICONS } from './iconOptions';

/**
 * Single-stat display card with a label, value, and optional sub-value.
 * Set `tone` to colour the card and pass an `icon` to add a directional indicator.
 */
const meta = {
  title: 'UI / StatCard',
  component: StatCard,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'positive', 'negative', 'accent'],
    },
    icon: {
      control: 'select',
      options: Object.keys(STAT_CARD_ICONS),
      mapping: STAT_CARD_ICONS,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ containerType: 'inline-size', containerName: 'tile' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default neutral tone with no icon. */
export const Neutral: Story = {
  args: {
    label: 'Average',
    value: '22.4p/kWh',
    subValue: '12:00',
    tone: 'neutral',
  },
};

/** Green-tinted card for favourable values. */
export const Positive: Story = {
  args: {
    label: 'Low',
    value: '17.7p/kWh',
    subValue: '02:30',
    icon: 'Down' as unknown as React.ReactNode,
    tone: 'positive',
  },
};

/** Red-tinted card for unfavourable values. */
export const Negative: Story = {
  args: {
    label: 'High',
    value: '44.5p/kWh',
    subValue: '18:00',
    icon: 'Up' as unknown as React.ReactNode,
    tone: 'negative',
  },
};

/** Accent-tinted card for highlighted values. */
export const Accent: Story = {
  args: {
    label: 'Current',
    value: '20.1p/kWh',
    subValue: 'Now',
    tone: 'accent',
  },
};

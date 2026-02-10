import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TbArrowDown, TbArrowUp, TbBoltFilled, TbTriangleFilled } from 'react-icons/tb';

import { StatsBar } from './StatsBar';

/**
 * Horizontal row of stat cards. Configure each card declaratively via the
 * `cards` prop — label, value, sub-value, icon, and tone.
 */
const meta = {
  title: 'UI / StatsBar',
  component: StatsBar,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof StatsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three stat cards — typical price-tile layout (Low, High, Total). */
export const ThreeCards: Story = {
  args: {
    ariaLabel: 'Price statistics',
    cards: [
      {
        key: 'low',
        label: 'Low',
        value: '17.7p/kWh',
        subValue: 'Wed 02:30',
        icon: <TbArrowDown aria-hidden="true" />,
        tone: 'positive',
      },
      {
        key: 'high',
        label: 'High',
        value: '44.5p/kWh',
        subValue: 'Wed 18:00',
        icon: <TbArrowUp aria-hidden="true" />,
        tone: 'negative',
      },
      {
        key: 'total',
        label: 'Total',
        value: '1,128.2p',
        subValue: '48 periods',
        icon: <TbBoltFilled aria-hidden="true" />,
        tone: 'neutral',
      },
    ],
  },
};

/** Two stat cards — typical usage-tile layout (Peak, Total). */
export const TwoCards: Story = {
  args: {
    ariaLabel: 'Usage statistics',
    cards: [
      {
        key: 'peak',
        label: 'Peak',
        value: '1.20 kWh',
        subValue: 'Wed 18:00',
        icon: <TbTriangleFilled aria-hidden="true" />,
        tone: 'negative',
      },
      {
        key: 'total',
        label: 'Total',
        value: '25.4 kWh',
        subValue: 'Est. £5.80',
        icon: <TbBoltFilled aria-hidden="true" />,
        tone: 'neutral',
      },
    ],
  },
};

/** Empty state — no cards rendered. */
export const Empty: Story = {
  args: {
    ariaLabel: 'Empty statistics',
    cards: [],
  },
};

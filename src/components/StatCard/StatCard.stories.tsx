import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TbTriangleFilled, TbTriangleInvertedFilled } from 'react-icons/tb';

import { StatCard } from './StatCard';

const meta = {
  title: 'Components/StatCard',
  component: StatCard,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: {
    label: 'Average',
    value: '22.4p/kWh',
    subValue: '12:00',
    tone: 'neutral',
  },
};

export const HighWithTriangle: Story = {
  args: {
    label: 'High',
    value: '44.5p/kWh',
    subValue: '18:00',
    icon: <TbTriangleFilled />,
    tone: 'negative',
  },
};

export const LowWithTriangle: Story = {
  args: {
    label: 'Low',
    value: '17.7p/kWh',
    subValue: '02:30',
    icon: <TbTriangleInvertedFilled />,
    tone: 'positive',
  },
};

export const Accent: Story = {
  args: {
    label: 'Current',
    value: '20.1p/kWh',
    subValue: 'Now',
    tone: 'accent',
  },
};

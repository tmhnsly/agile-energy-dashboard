import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@/components/Button/Button';

import { Navbar } from './Navbar';

/**
 * ## Purpose
 * Sticky glass-effect navigation bar. Content scrolls behind it,
 * revealing the blur/transparency effect.
 *
 * ## Props
 * - `title` — brand text on the left
 * - `children` — right-side actions (buttons, links)
 *
 * ## Usage notes
 * Place once in the root layout above page content.
 * Height is fixed at 56 px so no layout jump occurs.
 */
const meta = {
  title: 'Layout/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Shuffle Energy',
    children: <Button label="Sign in" variant="soft" size="small" />,
  },
};

export const WithActions: Story = {
  args: {
    title: 'Shuffle Energy',
    children: (
      <>
        <Button label="Docs" variant="ghost" size="small" />
        <Button label="Sign in" variant="soft" size="small" />
      </>
    ),
  },
};

export const ScrollBehind: Story = {
  render: () => (
    <div style={{ minHeight: '200vh', background: 'var(--mono-app-bg)' }}>
      <Navbar title="Shuffle Energy">
        <Button label="Sign in" variant="soft" size="small" />
      </Navbar>
      <div style={{ padding: 'var(--space-6)' }}>
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} style={{ color: 'var(--mono-text)', margin: '0 0 var(--space-4) 0' }}>
            Scroll down to see content pass behind the glass navbar — line {i + 1}
          </p>
        ))}
      </div>
    </div>
  ),
};

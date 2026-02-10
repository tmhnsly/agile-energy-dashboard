import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Container } from './Container';

/** Centres content at a max width with responsive side padding. Use inside a `Section`. */
const meta = {
  title: 'Layout / Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['div', 'section', 'main', 'nav', 'aside', 'header', 'footer', 'article'],
    },
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default `<div>` wrapper with responsive gutters. */
export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: 'var(--space-4)', background: 'var(--mono-subtle-bg)' }}>
        <p style={{ color: 'var(--mono-text)' }}>
          Content is constrained to a max-width with responsive gutters.
          Resize the viewport to see the padding change at each breakpoint.
        </p>
      </div>
    ),
  },
};

/** Renders as a `<section>` element for semantic HTML. */
export const AsSection: Story = {
  args: {
    as: 'section',
    children: (
      <div style={{ padding: 'var(--space-4)', background: 'var(--mono-subtle-bg)' }}>
        <p style={{ color: 'var(--mono-text)' }}>
          Renders as a {'<section>'} element for semantic HTML.
        </p>
      </div>
    ),
  },
};

/** Full-width tinted background with constrained content inside. */
export const WithBackground: Story = {
  args: { children: null },
  render: () => (
    <div style={{ background: 'var(--mono-subtle-bg)', padding: 'var(--space-8) 0' }}>
      <Container>
        <div style={{ padding: 'var(--space-4)', background: 'var(--mono-app-bg)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--mono-text)' }}>
            The tinted background extends full-width while the Container constrains the content.
          </p>
        </div>
      </Container>
    </div>
  ),
};

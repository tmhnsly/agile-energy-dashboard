import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Container } from '../Container/Container';
import { Section } from './Section';

/**
 * Full-width page section. Use `variant` to set the background tone and `size`
 * to control vertical padding. Pair with `Container` to constrain content width.
 */
const meta = {
  title: 'Layout / Section',
  component: Section,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'surface', 'contrast'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Transparent background — inherits whatever is behind it. */
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'small',
    children: (
      <Container>
        <p style={{ color: 'var(--mono-text)', margin: 0 }}>
          Default — transparent, inherits the page background.
        </p>
      </Container>
    ),
  },
};

/** Subtle tinted background to visually separate adjacent regions. */
export const Surface: Story = {
  args: {
    variant: 'surface',
    size: 'small',
    children: (
      <Container>
        <p style={{ color: 'var(--mono-text)', margin: 0 }}>
          Surface — tinted background for visual separation.
        </p>
      </Container>
    ),
  },
};

/** Stronger opaque background for high-emphasis content like CTAs or footers. */
export const Contrast: Story = {
  args: {
    variant: 'contrast',
    size: 'small',
    children: (
      <Container>
        <p style={{ color: 'var(--mono-text)', margin: 0 }}>
          Contrast — solid background for high-emphasis areas.
        </p>
      </Container>
    ),
  },
};

/** Three sizes stacked to compare vertical padding. */
export const Sizes: Story = {
  args: { children: null },
  render: () => (
    <div>
      <Section size="small" variant="surface">
        <Container>
          <p style={{ color: 'var(--mono-text)', margin: 0 }}>Small</p>
        </Container>
      </Section>
      <Section size="medium" variant="contrast">
        <Container>
          <p style={{ color: 'var(--mono-text)', margin: 0 }}>Medium (default)</p>
        </Container>
      </Section>
      <Section size="large" variant="surface">
        <Container>
          <p style={{ color: 'var(--mono-text)', margin: 0 }}>Large</p>
        </Container>
      </Section>
    </div>
  ),
};

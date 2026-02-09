# Styles

## Imports (aliases)

```scss
@use "mixins/container" as container;
@use "mixins/typography" as type;
@use "mixins/layout" as layout;
@use "mixins/breakpoints" as bp;
```

## Fonts

Two font families are used:
- **Heading** — Space Grotesk (titles, numbers, labels)
- **Body** — Inter (body text, meta, buttons, tooltips)

### How fonts load

Fonts are loaded via `next/font/google` in `app/layout.tsx`. Each font is
configured with a `variable` option that sets a CSS custom property on
`<html>`:

| next/font variable | Token | Resolves to |
|--------------------|-------|-------------|
| `--font-space-grotesk` | `--font-heading` | Space Grotesk |
| `--font-inter` | `--font-body` | Inter |

The tokens are defined in `theme/typography.scss` with named fallbacks:

```scss
--font-heading: var(--font-space-grotesk, "Space Grotesk", system-ui, sans-serif);
--font-body: var(--font-inter, "Inter", system-ui, sans-serif);
```

### Storybook

`@storybook/nextjs-vite` handles `next/font` at build time. If the CSS
variables from `next/font` are not available (e.g. the layout doesn't run),
the named font fallbacks in the token definitions provide a graceful
degradation to `system-ui`. No Storybook config changes are needed.

## Section vs Container

- **Section** = background owner (full width, no gutters). Use `container.fullBleed`.
- **Container** = inner alignment (gutters + max-width). Use `container.content`.

Nest Container inside Section:

```html
<Section variant="surface">
  <Container>content here</Container>
</Section>
```

## Layout mixins

| Mixin | Use for |
|-------|---------|
| `layout.stack($gap)` | Vertical flow (cards, form fields, tooltip internals) |
| `layout.cluster($gap)` | Horizontal wrapping row (tags, buttons, legend + controls) |

Defaults: `--stack-gap` for stack, `--cluster-gap` for cluster.

## Typography

Use presets instead of manual `font-size` / `font-weight` / `font-family`:

```scss
@include type.typography(card-title);
```

Each preset sets `font-family`, `font-size`, `line-height`, `font-weight`,
and `letter-spacing` in one call.

| Preset | Font | Intended use |
|--------|------|-------------|
| `page-title` | heading | Top-level page heading |
| `card-title` | heading | Card / panel heading |
| `number` | heading | Large numeric displays (stat values) |
| `label` | heading | Uppercase chip labels (LOW, HIGH, badge text) |
| `tooltip-value` | heading | Tooltip primary value |
| `body` | body | Default body text |
| `meta` | body | Timestamps, secondary info, sub-values |
| `button` | body | Button text |
| `tooltip-date` | body | Tooltip datetime row |

### How to apply typography in components

Always use the preset mixin — never set `font-family` directly:

```scss
// Good
.title { @include type.typography(card-title); }

// Bad
.title { font-family: var(--font-heading); font-size: var(--text-lg); }
```

## Spacing tokens

All spacing uses `--space-*` CSS variables defined in `theme/spacing.scss`.
Semantic aliases (e.g. `--card-padding`, `--tooltip-gap`) reference these.

Tokens are defined in `rem` so they scale with the user's root font-size
preference. No additional `em`/`rem` conversion is needed at the component
level -- the CSS variables are the source of truth.

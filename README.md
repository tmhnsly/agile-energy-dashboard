# Shuffle Energy

An interactive energy dashboard visualising real-time electricity market pricing from Octopus Energy's Agile tariff alongside household consumption patterns and demand-side flexibility insights.

> **Live links**
>
> | Environment | URL |
> |-------------|-----|
> | Production  | _coming soon_ |

---

## Quick start

```bash
pnpm install
```

| Command | URL / Description |
|---------|-------------------|
| `pnpm dev` | [localhost:3000](http://localhost:3000) — app |
| `pnpm storybook` | [localhost:6006](http://localhost:6006) — component library & design system docs |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `npx vitest run` | Unit + Storybook smoke tests (Playwright) |

## Tech stack

| | |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/docs) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/docs/) (strict) |
| **Styling** | [Sass/SCSS modules](https://sass-lang.com/documentation/), CSS custom properties, [container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) |
| **Colours** | [Radix UI Colors](https://www.radix-ui.com/colors/docs/overview/installation) (12-step semantic scale) |
| **Components** | [Radix UI primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) |
| **Charts** | [visx](https://airbnb.io/visx/docs) |
| **Icons** | [Tabler](https://tabler.io/icons) via [react-icons](https://react-icons.github.io/react-icons/icons/tb/) |
| **Fonts** | [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) / [Inter](https://fonts.google.com/specimen/Inter) via next/font |
| **Testing** | [Vitest](https://vitest.dev/guide/) + [Playwright](https://playwright.dev/docs/intro) |
| **Docs** | [Storybook 10](https://storybook.js.org/docs) with MDX |

## Architecture

`DashboardShell` fetches data once via `useMarketData()` and fans it out to four tiles in a responsive bento grid:

| Tile | Description |
|------|-------------|
| **Market Price** | Half-hourly Agile tariff chart with flex event overlays |
| **Household Usage** | Consumption chart for the selected household profile |
| **Shift Simulator** | Drag to simulate moving load to cheaper periods |
| **Flex Insights** | Potential earnings from demand-side flexibility events |

Three household profiles drive tone-mapped theming: **Standard** (blue), **Heat Pump** (amber), **Heat Pump + Battery** (orange).

### Data flow

```
Octopus Energy API
  └─ /api/agile-prices (ISR, 15 min cache)
       └─ useMarketData()  ← CSV + JSON fetch, maps to typed domain models
            ├─ usePriceStats()   → stat cards
            ├─ useUsageStats()   → stat cards
            └─ DashboardShell    → chart series, flex events, usage rows
```

### Styling

Two-layer token architecture — **tokens** (`src/styles/theme/`) for colours, spacing, and typography, plus **mixins** (`src/styles/mixins/`) for layout, container queries, and surfaces. All responsive layout within tiles uses container queries so components respond to their own width.

## Project structure

```
src/
├── app/                    Next.js App Router
│   ├── api/agile-prices/   Octopus Energy proxy route
│   ├── layout.tsx          Root layout, fonts, providers
│   └── page.tsx            Dashboard page
├── components/
│   ├── Features/           Domain components (DashboardShell, MarketPrice, etc.)
│   ├── Charts/             TimeSeriesChart, interaction hooks
│   ├── Layout/             Bento grid, Navbar, Container, Section
│   └── UI/                 Button, StatCard, StatsBar, Skeleton, Slider, Spinner
├── config/                 Household themes
├── docs/                   Storybook MDX documentation (see below)
├── hooks/                  useMarketData, usePriceStats, useUsageStats, useTimeRange
├── styles/
│   ├── theme/              CSS custom property definitions
│   └── mixins/             SCSS mixins (layout, typography, container queries)
├── types/                  energy.ts, chart.ts
└── utils/                  Formatters, binary search, energy mappers, constants
```

## Storybook docs

Run `pnpm storybook` for auto-generated component docs plus hand-written guides:

**Design System** — [Colors](src/docs/Colors.mdx) · [Typography](src/docs/Typography.mdx) · [Spacing](src/docs/Spacing.mdx) · [Surfaces](src/docs/Surfaces.mdx) · [Icons](src/docs/Icons.mdx)

**Domain** — [Energy Model](src/docs/EnergyModel.mdx) · [Chart System](src/docs/ChartSystem.mdx) · [Flexibility & Shifting](src/docs/FlexibilityInsights.mdx) · [Hooks Reference](src/docs/HooksReference.mdx)

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OCTOPUS_PRODUCT_CODE` | `AGILE-24-10-01` | Octopus Agile tariff product code |
| `OCTOPUS_REGION` | `L` | DNO region code |

No `.env` file is required — defaults are used when variables are not set.

## Reference docs

External documentation for libraries and tools used in this project.

| | |
|---|---|
| [Next.js](https://nextjs.org/docs) | App Router, API routes, next/font |
| [Sass](https://sass-lang.com/documentation/) | SCSS modules, mixins, functions |
| [Radix Colors](https://www.radix-ui.com/colors/docs/overview/installation) | 12-step colour scale, dark mode |
| [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) | Accessible headless components |
| [visx](https://airbnb.io/visx/docs) | Low-level React + D3 chart primitives |
| [Storybook](https://storybook.js.org/docs) | Component docs, MDX, addons |
| [Vitest](https://vitest.dev/guide/) | Unit testing, coverage |
| [Playwright](https://playwright.dev/docs/intro) | Browser testing |
| [Tabler Icons](https://tabler.io/icons) | Icon set reference |
| [Octopus Agile API](https://developer.octopus.energy/rest/) | Upstream pricing data |
| [MDN Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) | `@container` spec reference |

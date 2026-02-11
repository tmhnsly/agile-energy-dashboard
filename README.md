# Shuffle Energy

An interactive energy dashboard built with Next.js, visualising real-time electricity market pricing from Octopus Energy's Agile tariff alongside household consumption patterns and demand-side flexibility insights.

> **Live links**
>
> | Environment | URL |
> |-------------|-----|
> | Production  | _add link_ |
> | Storybook   | _add link_ |

---

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm storybook    # http://localhost:6006
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm storybook` | Storybook dev server (port 6006) |
| `pnpm build-storybook` | Static Storybook build |
| `npx vitest run` | Unit + Storybook smoke tests |

## Tech stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | SCSS modules, CSS custom properties, container queries |
| **Colours** | Radix UI Colors (12-step semantic scale) |
| **Charts** | visx |
| **Components** | Radix UI primitives (Slider, Tooltip, Popover) |
| **Icons** | Tabler (react-icons/tb) |
| **Fonts** | Space Grotesk (headings), Inter (body) via next/font |
| **Testing** | Vitest + Playwright browser tests |
| **Docs** | Storybook 10 with MDX |
| **Deployment** | Vercel (Analytics + Speed Insights) |

## Architecture

### Dashboard

`DashboardShell` is the top-level orchestrator. It calls `useMarketData()` once on mount, then fans data out to four tiles in a responsive bento grid:

| Tile | Description |
|------|-------------|
| **Market Price** | Half-hourly Agile tariff chart with flex event overlays |
| **Household Usage** | Consumption chart for the selected household profile |
| **Shift Simulator** | Drag to simulate moving load to cheaper periods |
| **Flex Insights** | Potential earnings from demand-side flexibility events |

Three household profiles drive tone-mapped theming across the UI:

- **Standard** — accent (blue)
- **Heat Pump** — secondary (amber)
- **Heat Pump + Battery** — warning (orange)

### Data flow

```
Octopus Energy API
  └─ /api/agile-prices (ISR, 15 min cache)
       └─ useMarketData()  ← CSV + JSON fetch, maps to typed domain models
            ├─ usePriceStats()   → stat cards
            ├─ useUsageStats()   → stat cards
            └─ DashboardShell    → chart series, flex events, usage rows
```

### Styling system

Two-layer token architecture:

1. **Tokens** (`src/styles/theme/`) — colours, spacing scale (`--space-1`..`--space-12`), typography
2. **Mixins** (`src/styles/mixins/`) — `layout.stack()`, `layout.cluster()`, `container.fullBleed()`, container query breakpoints

All responsive layout within tiles uses **container queries** (`@container tile`), not media queries, so components respond to their own width.

## Project structure

```
src/
├── app/                    Next.js App Router
│   ├── api/agile-prices/   Octopus Energy proxy route
│   ├── layout.tsx          Root layout, fonts, providers
│   └── page.tsx            Dashboard page
├── components/
│   ├── Features/           Domain components (DashboardShell, MarketPrice, etc.)
│   ├── Charts/             TimeSeriesChart, hooks (drag, keyboard nav, RAF)
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

## Storybook documentation

The Storybook includes auto-generated component docs alongside hand-written guides split into two categories:

**Design System** — visual language and tokens

- [Colors](src/docs/Colors.mdx) — Radix 12-step palette, semantic tone tokens, usage guide
- [Typography](src/docs/Typography.mdx) — Font families, text size scale, weight tokens
- [Spacing](src/docs/Spacing.mdx) — Space scale, layout mixins
- [Surfaces](src/docs/Surfaces.mdx) — Glass morphism, backdrop blur, border and shadow tokens
- [Icons](src/docs/Icons.mdx) — Tabler icon set with usage examples

**Domain** — application logic and patterns

- [Energy Model](src/docs/EnergyModel.mdx) — Core types, settlement periods, data pipeline, format utilities
- [Chart System](src/docs/ChartSystem.mdx) — Drag state machine, touch disambiguation, keyboard nav, accessibility
- [Flexibility & Shifting](src/docs/FlexibilityInsights.mdx) — Flex events, cost computation, shift simulator mechanics
- [Hooks Reference](src/docs/HooksReference.mdx) — API for useMarketData, usePriceStats, useUsageStats

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OCTOPUS_PRODUCT_CODE` | `AGILE-24-10-01` | Octopus Agile tariff product code |
| `OCTOPUS_REGION` | `L` | DNO region code |

No `.env` file is required — defaults are used when variables are not set.

## Testing

```bash
npx vitest run
```

Runs two test suites:

- **Unit tests** — hooks, utilities, formatters, energy mappers
- **Storybook smoke tests** — renders every story in headless Chromium via Playwright, with a11y error-level checks enabled

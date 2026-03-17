# ⚡ Agile Energy

A real-time energy dashboard built with Next.js, visualising Octopus Energy's Agile tariff prices alongside household consumption data. Features load-shifting simulation, flexibility insights, and responsive data visualisations — all with a polished design system.

This is a portfolio project demonstrating frontend engineering with a focus on data visualisation, responsive design, and developer experience.

---

## Features

- **Market Price chart** — live Agile tariff rates over time with shaded flex-event windows. Duration presets (6h, 12h, 24h) jump to the cheapest contiguous window. Drag to select a custom time range; stat cards update to reflect the selection.
- **Household Usage chart** — overlays consumption for selectable household profiles (Standard, Heat Pump, Heat Pump + Battery). Drag to select a time range for detailed stats.
- **Flex Insights** — daily cost breakdown and potential earnings from participating in flexibility events. Switch household profiles to compare.
- **Shift Simulator** — pick "from" and "to" time periods to see the cost impact of moving usage. Green = savings, red = costs more. Adjustable energy slider.

## Tech stack

| Category | Tech |
|----------|------|
| **Framework** | [Next.js 16](https://nextjs.org/docs) — App Router, API routes, ISR |
| **Language** | [TypeScript](https://www.typescriptlang.org/docs/) — strict mode |
| **Styling** | [Sass](https://sass-lang.com/documentation/) — SCSS modules, container queries |
| **Components** | [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction) — primitives + [Colors](https://www.radix-ui.com/colors/docs/overview/installation) |
| **Charts** | [visx](https://airbnb.io/visx/docs) |
| **Icons** | [Tabler Icons](https://tabler.io/icons) via [react-icons](https://react-icons.github.io/react-icons/icons/tb/) |
| **Docs** | [Storybook 10](https://storybook.js.org/docs) — component library + design system |
| **Testing** | [Vitest](https://vitest.dev/guide/) + [Playwright](https://playwright.dev/docs/intro) |

## Getting started

```bash
pnpm install
```

| Command | |
|---------|---|
| `pnpm dev` | [localhost:3000](http://localhost:3000) |
| `pnpm storybook` | [localhost:6006](http://localhost:6006) |
| `pnpm build` | Production build |
| `pnpm lint` | Lint |
| `npx vitest run` | Unit + browser tests |

## Project structure

```
src/
├── app/              Pages and API routes
├── components/
│   ├── Features/     Dashboard panels
│   ├── Charts/       Chart primitives
│   ├── Layout/       Grid, navigation, containers
│   └── UI/           Buttons, cards, sliders, skeletons
├── config/           Site branding and household theme config
├── docs/             Storybook documentation pages
├── hooks/            Data fetching and derived stats
├── styles/           Design tokens and SCSS mixins
├── types/            TypeScript interfaces
└── utils/            Formatters, data mappers, helpers
```

## Architecture

```
DashboardShell
  └─ useMarketData()       ← parallel fetch
       ├─ /api/agile-prices       (ISR, 15 min)
       ├─ flexibility_opportunity.json
       └─ household_usage.csv
  └─ BentoGrid
       ├─ Market Price        usePriceStats() · findCheapestWindow()
       ├─ Household Usage     useUsageStats() · profile switcher
       ├─ Flex Insights       computeFlexEarnings() · daily cost
       └─ Shift Simulator     simulateShift()
```

## Data sources

- **Prices** come from the [Octopus Energy Agile tariff API](https://octopus.energy/), in pence/kWh including VAT. The product code and region are configured in `/api/agile-prices`.
- **Household usage** is loaded from a static CSV (`/data/household_usage.csv`) with half-hourly kWh values for three profiles: Standard, Heat Pump, and Heat Pump + Battery. Time-only values are anchored to today (UTC) so the dashboard reflects current prices.
- **Flex events** are loaded from `/data/flexibility_opportunity.json`. Events with time-only start/end values are treated as daily recurring and expanded across the price range.
- **All timestamps** represent the start of a half-hour settlement period. A price at `ts` covers `[ts, ts + 30 min)`.

## Storybook

`pnpm storybook` serves component docs and design system guides covering colours, typography, spacing, surfaces, and domain models. Storybook is also available online — see the repo description for the link.

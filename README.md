# Agile Energy Dashboard

A real-time energy dashboard visualising Octopus Energy's Agile tariff prices alongside household consumption data. Includes load-shifting simulation, flexibility insights, and responsive data visualisations with a polished design system.

**[Live demo](https://agile-energy-dashboard.vercel.app/)** · **[Storybook](https://agile-energy-dashboard.vercel.app/storybook)**

## Tech stack

| | |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/docs) · App Router, API routes, ISR |
| **Language** | [TypeScript](https://www.typescriptlang.org/docs/) · strict mode |
| **Styling** | [Sass](https://sass-lang.com/documentation/) · SCSS modules, container queries |
| **Components** | [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction) · primitives + [Colors](https://www.radix-ui.com/colors/docs/overview/installation) |
| **Charts** | [visx](https://airbnb.io/visx/docs) |
| **Icons** | [Tabler Icons](https://tabler.io/icons) via [react-icons](https://react-icons.github.io/react-icons/icons/tb/) |
| **Docs** | [Storybook 10](https://storybook.js.org/docs) · component library + design system |
| **Testing** | [Vitest](https://vitest.dev/guide/) + [Playwright](https://playwright.dev/docs/intro) |

## Getting started

```bash
pnpm install
pnpm dev          # localhost:3000
```

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Lint |
| `pnpm storybook` | Component docs at localhost:6006 |
| `npx vitest run` | Unit + browser tests |

## Features

- **Market Price chart** — live Agile tariff rates with shaded flex-event windows. Duration presets (6h, 12h, 24h) jump to the cheapest contiguous window. Drag-select a custom time range to update stat cards.
- **Household Usage chart** — consumption overlay for selectable profiles (Standard, Heat Pump, Heat Pump + Battery). Drag-select for detailed stats.
- **Flex Insights** — daily cost breakdown and potential earnings from flexibility events. Switch profiles to compare.
- **Shift Simulator** — pick "from" and "to" periods to see the cost impact of moving usage. Adjustable energy slider.

## Architecture

```
DashboardShell
  └─ useMarketData()              ← parallel fetch
       ├─ /api/agile-prices              (ISR, 15 min)
       ├─ flexibility_opportunity.json
       └─ household_usage.csv
  └─ BentoGrid
       ├─ Market Price             usePriceStats() · findCheapestWindow()
       ├─ Household Usage          useUsageStats() · profile switcher
       ├─ Flex Insights            computeFlexEarnings() · daily cost
       └─ Shift Simulator          simulateShift()
```

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

## Data sources

| Source | Detail |
|---|---|
| **Prices** | [Octopus Energy Agile tariff API](https://octopus.energy/) — pence/kWh inc. VAT. Product code and region configured in `/api/agile-prices`. |
| **Household usage** | Static CSV (`/data/household_usage.csv`) — half-hourly kWh for three profiles. Time values anchored to today (UTC) to align with current prices. |
| **Flex events** | `/data/flexibility_opportunity.json` — time-only start/end values treated as daily recurring and expanded across the price range. |

All timestamps represent the start of a half-hour settlement period — a price at `ts` covers `[ts, ts + 30 min)`.

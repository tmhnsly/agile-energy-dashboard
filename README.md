# ⚡ Shuffle Energy

Real-time Agile tariff dashboard with household consumption tracking, flexibility insights, and load-shifting simulation.

---

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
Octopus Energy API
  └─ /api/agile-prices (ISR, 15 min)
       └─ useMarketData()
            ├─ usePriceStats()    → stat cards
            ├─ useUsageStats()    → stat cards
            └─ DashboardShell     → bento grid
                 ├─ Market Price        (chart + cheapest window)
                 ├─ Household Usage     (chart + profile switcher)
                 ├─ Flex Insights       (earnings breakdown)
                 └─ Shift Simulator     (move load between periods)
```

## Assumptions

- **Prices** come from the Octopus Energy Agile tariff API, in pence/kWh including VAT. The product code and region are hardcoded in `/api/agile-prices` — change them there if needed.
- **Household usage** is loaded from a static CSV (`/data/household_usage.csv`) with half-hourly kWh values for three profiles: Standard, Heat Pump, and Heat Pump + Battery. Time-only values in the CSV are anchored to today (UTC) so the dashboard reflects today's prices.
- **Flex events** are loaded from `/data/flexibility_opportunity.json`. Events with time-only start/end values are treated as daily recurring and expanded across the price range. Only events overlapping the usage day are shown in Flex Insights.
- **All timestamps** represent the start of a half-hour settlement period. A price at `ts` covers `[ts, ts + 30 min)`.

## Interpreting the visualisations

- **Market Price chart** — shows the Agile tariff over time. A shaded band highlights the cheapest contiguous window; the duration preset buttons (1h, 2h, etc.) find the cheapest window for that duration. Drag to select a time range; stat cards update to reflect the selection.
- **Household Usage chart** — overlays consumption for the selected household profiles. Switch profiles with the selector buttons. Drag to select a time range to see stats for that period.
- **Flex Insights** — shows the selected household's daily cost and what you could earn by participating in flex events (turning usage up or down when asked). Switch household with the selector to compare.
- **Shift Simulator** — pick a "from" and "to" time period to see what happens to your daily cost if you move usage between them. Green hints = saves money, red hints = costs more. The slider adjusts how much energy to shift.

## Storybook

`pnpm storybook` serves component docs and design system guides covering colours, typography, spacing, surfaces, and domain models.

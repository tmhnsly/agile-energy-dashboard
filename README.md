# ⚡ Shuffle Energy

Real-time Agile tariff dashboard with household consumption tracking, flexibility insights, and load-shifting simulation.

> | Environment | URL |
> |-------------|-----|
> | Production  | _coming soon_ |

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
| **Styling** | [Sass](https://sass-lang.com/documentation/) — SCSS modules, [container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) |
| **Components** | [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction) — primitives + [Colors](https://www.radix-ui.com/colors/docs/overview/installation) |
| **Charts** | [visx](https://airbnb.io/visx/docs) |
| **Icons** | [Tabler Icons](https://tabler.io/icons) via [react-icons](https://react-icons.github.io/react-icons/icons/tb/) |
| **Docs** | [Storybook 10](https://storybook.js.org/docs) — component library + design system |
| **Testing** | [Vitest](https://vitest.dev/guide/) + [Playwright](https://playwright.dev/docs/intro) |

## Project structure

```
src/
├── app/                    App Router + API route
├── components/
│   ├── Features/           Dashboard panels (MarketPrice, HouseholdUsage, FlexInsights)
│   ├── Charts/             TimeSeriesChart + interaction hooks
│   ├── Layout/             Bento grid, Navbar, Container
│   └── UI/                 Button, StatCard, Skeleton, Slider, Spinner
├── docs/                   Design system + domain docs (MDX)
├── hooks/                  Data fetching + derived stats
├── styles/                 Tokens + mixins
├── types/                  Domain + chart types
└── utils/                  Formatters, binary search, energy mappers
```

## Architecture

```
Octopus Energy API
  └─ /api/agile-prices (ISR, 15 min)
       └─ useMarketData()
            ├─ usePriceStats()    → stat cards
            ├─ useUsageStats()    → stat cards
            └─ DashboardShell     → bento grid
                 ├─ Market Price        (wide tile, chart + flex events)
                 ├─ Household Usage     (chart, profile switcher)
                 ├─ Shift Simulator     (drag to reschedule load)
                 └─ Flex Insights       (earnings breakdown)
```

## Storybook

`pnpm storybook` serves component docs and design system guides covering colours, typography, spacing, surfaces, icons, chart interactions, and domain models.

## Environment

| Variable | Default | |
|----------|---------|---|
| `OCTOPUS_PRODUCT_CODE` | `AGILE-24-10-01` | Tariff product code |
| `OCTOPUS_REGION` | `L` | DNO region |

No `.env` file required — defaults apply.

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
├── app/              Pages and API routes (Next.js App Router)
├── components/
│   ├── Features/     Full dashboard panels — each owns its own data display,
│   │                 skeleton, and stories (e.g. MarketPrice, FlexInsights)
│   ├── Charts/       Shared chart primitives and interaction layers
│   │                 (e.g. TimeSeriesChart, TooltipLayer)
│   ├── Layout/       Structural components — grid, navigation, containers
│   └── UI/           Generic, reusable building blocks — buttons, cards,
│                     skeletons, sliders (no domain logic)
├── docs/             Storybook MDX pages — design system guides, domain docs
├── hooks/            React hooks — data fetching, derived stats, interaction
│                     state (e.g. useMarketData, usePriceStats)
├── styles/           Global tokens (colours, spacing, type scale) and SCSS
│                     mixins (e.g. container query breakpoints)
├── types/            Shared TypeScript interfaces — domain models and
│                     chart types (e.g. AgilePrice, HouseholdProfile)
└── utils/            Pure helper functions — formatters, data transforms,
                      energy mapping (e.g. formatCurrency, findCheapestWindow)
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

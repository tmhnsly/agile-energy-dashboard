'use client';

import { useEffect, useState } from 'react';
import type { PricePoint, FlexEvent, HouseholdUsageRow } from '@/types/energy';
import {
  mapAgilePrices,
  mapFlexEvents,
  parseHouseholdUsageCsv,
  resolveUsageAnchor,
} from '@/utils/energy-mappers';

interface MarketDataLoading {
  status: 'loading';
}

interface MarketDataError {
  status: 'error';
  error: string;
}

interface MarketDataReady {
  status: 'ready';
  prices: PricePoint[];
  flexEvents: FlexEvent[];
  householdUsage: HouseholdUsageRow[];
  /** Whether prices came from the live API or the bundled fallback snapshot. */
  priceSource: 'live' | 'snapshot';
}

/** Discriminated union of the three possible fetch states. */
export type MarketDataState = MarketDataLoading | MarketDataError | MarketDataReady;

/**
 * Fetch and parse all market data on mount.
 *
 * Loads data from three sources in parallel:
 * - `/api/agile-prices` — live half-hourly Agile tariff prices via Octopus Energy API
 * - `flexibility_opportunity.json` — demand-side flex event windows (static)
 * - `household_usage.csv` — consumption profiles for three household types (static)
 *
 * Returns a discriminated-union state (`loading` → `ready` | `error`)
 * so the consuming component can render a skeleton, error, or data view.
 */
export function useMarketData(retryKey = 0): MarketDataState {
  const [state, setState] = useState<MarketDataState>({ status: 'loading' });
  const [prevRetryKey, setPrevRetryKey] = useState(retryKey);

  if (prevRetryKey !== retryKey) {
    setPrevRetryKey(retryKey);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [priceRes, flexRes, csvRes] = await Promise.all([
          fetch('/api/agile-prices'),
          fetch('/data/flexibility_opportunity.json'),
          fetch('/data/household_usage.csv'),
        ]);

        if (!priceRes.ok || !flexRes.ok || !csvRes.ok) {
          throw new Error('Failed to fetch market data');
        }

        const [priceJson, flexJson, csvText] = await Promise.all([
          priceRes.json(),
          flexRes.json(),
          csvRes.text(),
        ]);

        if (cancelled) return;

        const prices = mapAgilePrices(priceJson);

        if (prices.length === 0) {
          throw new Error('No price data available — the upstream API may be temporarily unavailable');
        }

        const priceSource =
          priceJson && typeof priceJson === 'object' &&
          (priceJson as { source?: unknown }).source === 'snapshot'
            ? 'snapshot'
            : 'live';

        // Flex events use the full price range so time-only events repeat per day
        const rangeFrom = prices[0].ts;
        const rangeTo = prices[prices.length - 1].ts;
        const flexEvents = mapFlexEvents(flexJson, rangeFrom, rangeTo);

        // Anchor the static usage CSV to a day the price feed actually
        // covers (today when fully published, else the most recent complete
        // day). This keeps every usage slot mapped to a real price so the
        // Shift Simulator reflects genuine cost differences rather than
        // collapsing to a flat "No difference" when prices lag or are stale.
        const refDay = resolveUsageAnchor(prices, new Date());
        const householdUsage = parseHouseholdUsageCsv(csvText, refDay);

        setState({ status: 'ready', prices, flexEvents, householdUsage, priceSource });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [retryKey]);

  return state;
}

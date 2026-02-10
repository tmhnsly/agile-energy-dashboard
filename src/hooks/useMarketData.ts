'use client';

import { useEffect, useState } from 'react';
import { startOfDay } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import type { PricePoint, FlexEvent, HouseholdUsageRow } from '@/types/energy';
import {
  mapAgilePrices,
  mapFlexEvents,
  parseHouseholdUsageCsv,
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
export function useMarketData(): MarketDataState {
  const [state, setState] = useState<MarketDataState>({ status: 'loading' });

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

        // Flex events use the full price range so time-only events repeat per day
        const rangeFrom = prices.length > 0 ? prices[0].ts : Date.now();
        const rangeTo = prices.length > 0 ? prices[prices.length - 1].ts : Date.now();
        const flexEvents = mapFlexEvents(flexJson, rangeFrom, rangeTo);

        // Household CSV still uses a single reference day
        const refDay = startOfDay(new UTCDate(rangeFrom));
        const householdUsage = parseHouseholdUsageCsv(csvText, refDay);

        setState({ status: 'ready', prices, flexEvents, householdUsage });
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
  }, []);

  return state;
}

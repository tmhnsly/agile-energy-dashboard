import { NextResponse } from 'next/server';
import {
  AGILE_REGION,
  DEFAULT_AGILE_PRODUCT,
  PRODUCTS_URL,
  buildAgileRatesUrl,
  selectAgileProductCode,
} from '@/utils/octopus';
import priceSnapshot from '@/data/agile-prices-sample.json';

export const revalidate = 900; // ISR: cache for 15 minutes

const TIMEOUT_MS = 10_000;
const REVALIDATE_S = 900;

/** Fetch and parse JSON with a timeout. Returns null on any failure. */
async function fetchJson(url: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_S }, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Discover the current import Agile product code, falling back to a known one. */
async function resolveProductCode(): Promise<string> {
  const list = await fetchJson(`${PRODUCTS_URL}?page_size=300`);
  const discovered = list != null ? selectAgileProductCode(list) : null;
  return discovered ?? DEFAULT_AGILE_PRODUCT;
}

/** True when the payload carries at least one rate row. */
function hasRates(json: unknown): json is { results: unknown[] } {
  return (
    !!json &&
    typeof json === 'object' &&
    Array.isArray((json as Record<string, unknown>).results) &&
    (json as { results: unknown[] }).results.length > 0
  );
}

/**
 * Serve half-hourly Agile import prices for the configured region.
 *
 * Discovers the current Agile product (so a retired product code doesn't break
 * the dashboard), fetches a 3-day window of live rates, and — if the upstream
 * is unreachable or empty — falls back to a bundled real-price snapshot so the
 * dashboard always renders. The `source` field flags which was returned.
 */
export async function GET() {
  const now = new Date();
  const periodFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  );
  const periodTo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2),
  );

  const product = await resolveProductCode();
  const ratesUrl = buildAgileRatesUrl(product, AGILE_REGION, periodFrom, periodTo);
  const live = await fetchJson(ratesUrl);

  if (hasRates(live)) {
    return NextResponse.json({ source: 'live', results: live.results });
  }

  // Upstream unreachable or empty — serve the bundled snapshot so the
  // dashboard still works (the client flags it as sample data).
  return NextResponse.json({ source: 'snapshot', results: priceSnapshot.results });
}

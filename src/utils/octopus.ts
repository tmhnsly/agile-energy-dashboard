/**
 * Octopus Energy Agile tariff helpers.
 *
 * The standard-unit-rates endpoint requires a specific product + tariff code.
 * Agile product codes are versioned and dated (e.g. `AGILE-24-10-01`) and are
 * eventually retired, so the current import Agile product is discovered from
 * the public product list at request time rather than hardcoded. A known code
 * is kept only as a last-resort fallback for when discovery fails.
 */

/** Region letter (GSP group). L = South West England. */
export const AGILE_REGION = 'L';

/** Last-resort product code used only when live discovery fails. */
export const DEFAULT_AGILE_PRODUCT = 'AGILE-24-10-01';

/** Public Octopus product-list endpoint. */
export const PRODUCTS_URL = 'https://api.octopus.energy/v1/products/';

interface ProductListItem {
  code?: unknown;
  direction?: unknown;
  available_from?: unknown;
  available_to?: unknown;
}

/** Unwrap the `{ results: [...] }` envelope, or accept a bare array. */
function extractResults(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const r = (raw as Record<string, unknown>).results;
    if (Array.isArray(r)) return r;
  }
  return [];
}

/**
 * Choose the current import Agile product code from a product-list response.
 *
 * Selects single-rate import Agile tariffs — code begins with `AGILE-` but not
 * `AGILE-OUTGOING-` (export), direction `IMPORT` when stated — that are still
 * available (`available_to` is null), preferring the most recently launched.
 * Returns null when none match, so the caller can fall back to a known code.
 *
 * The default product list only returns currently-available products, so this
 * automatically tracks Octopus retiring one Agile version for the next.
 */
export function selectAgileProductCode(raw: unknown): string | null {
  let best: { code: string; from: number } | null = null;

  for (const item of extractResults(raw)) {
    if (!item || typeof item !== 'object') continue;
    const p = item as ProductListItem;

    const code = typeof p.code === 'string' ? p.code : null;
    if (!code || !code.startsWith('AGILE-') || code.startsWith('AGILE-OUTGOING')) continue;
    if (p.direction != null && p.direction !== 'IMPORT') continue;
    if (p.available_to != null) continue;

    const parsed = typeof p.available_from === 'string' ? Date.parse(p.available_from) : NaN;
    const from = Number.isNaN(parsed) ? 0 : parsed;
    if (!best || from > best.from) best = { code, from };
  }

  return best?.code ?? null;
}

/**
 * Build the standard-unit-rates URL for an Agile product + region.
 *
 * Tariff codes follow the stable `E-1R-{product}-{region}` single-rate import
 * convention used across every Agile product version.
 */
export function buildAgileRatesUrl(
  productCode: string,
  region: string,
  periodFrom: Date,
  periodTo: Date,
  pageSize = 200,
): string {
  const tariff = `E-1R-${productCode}-${region}`;
  const url = new URL(
    `https://api.octopus.energy/v1/products/${productCode}/electricity-tariffs/${tariff}/standard-unit-rates/`,
  );
  url.searchParams.set('period_from', periodFrom.toISOString());
  url.searchParams.set('period_to', periodTo.toISOString());
  url.searchParams.set('page_size', String(pageSize));
  return url.toString();
}

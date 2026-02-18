import type { PricePoint } from '@/types/energy';
import { lowerBound } from '@/utils/binarySearch';

/**
 * Look up the price for a given timestamp.
 * Uses binary search — matches exact ts, falls back to the preceding slot,
 * or uses the first available price if the timestamp is before all price data.
 */
export function lookupPrice(prices: PricePoint[], ts: number): number {
  if (prices.length === 0) return 0;
  const priceIndex = lowerBound(prices, ts);
  if (priceIndex < prices.length && prices[priceIndex].ts === ts) return prices[priceIndex].price;
  if (priceIndex > 0) return prices[priceIndex - 1].price;
  return prices[0].price;
}

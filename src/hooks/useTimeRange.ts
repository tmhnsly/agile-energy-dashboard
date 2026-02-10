'use client';

import { useMemo, useState, useCallback } from 'react';
import type { TimeRange } from '@/types/energy';

/** Derive the full extent from the first and last timestamped item. */
export function computeFullRange(items: { ts: number }[]): TimeRange {
  if (items.length === 0) return { fromTs: 0, toTs: 0 };
  return {
    fromTs: items[0].ts,
    toTs: items[items.length - 1].ts,
  };
}

/** Check whether a candidate range is valid (finite, positive width). */
export function isValidRange(range: TimeRange): boolean {
  if (!isFinite(range.fromTs) || !isFinite(range.toTs)) return false;
  if (range.toTs <= range.fromTs) return false;
  return true;
}

/**
 * Manage a zoomable time range over any timestamped items.
 *
 * Derives a `fullRange` from the first/last data point, tracks an optional
 * user-selected `activeRange`, and exposes helpers to set or reset it.
 * Invalid ranges (non-finite, zero-width, or reversed) are silently ignored.
 *
 * @returns
 * - `fullRange` — the complete extent of the data.
 * - `activeRange` — the current view window (equals `fullRange` when no selection is active).
 * - `isCustomRange` — `true` when the user has zoomed in.
 * - `setRange(range)` — apply a new selection.
 * - `resetRange()` — clear the selection and return to the full extent.
 */
export function useTimeRange(items: { ts: number }[]) {
  const fullRange: TimeRange = useMemo(
    () => computeFullRange(items),
    [items],
  );

  const [activeRange, setActiveRange] = useState<TimeRange | null>(null);

  const currentRange = activeRange ?? fullRange;

  const isCustomRange =
    currentRange.fromTs !== fullRange.fromTs ||
    currentRange.toTs !== fullRange.toTs;

  const setRange = useCallback((range: TimeRange) => {
    if (!isValidRange(range)) return;
    setActiveRange(range);
  }, []);

  const resetRange = useCallback(() => {
    setActiveRange(null);
  }, []);

  return { fullRange, activeRange: currentRange, isCustomRange, setRange, resetRange };
}

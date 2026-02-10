import { useMemo } from 'react';
import { startOfDay, addDays } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import type { TimeRange } from '@/types/energy';

/**
 * Returns an array of midnight timestamps that fall within `fullRange`.
 * Used to render vertical day-boundary lines on the chart.
 */
export function useDayBoundaries(fullRange: TimeRange): number[] {
  return useMemo(() => {
    const boundaries: number[] = [];
    let day = addDays(startOfDay(new UTCDate(fullRange.fromTs)), 1);
    while (day.getTime() < fullRange.toTs) {
      if (day.getTime() > fullRange.fromTs) boundaries.push(day.getTime());
      day = addDays(day, 1);
    }
    return boundaries;
  }, [fullRange]);
}

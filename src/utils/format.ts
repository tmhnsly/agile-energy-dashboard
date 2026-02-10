import { format, startOfDay } from 'date-fns';
import { UTCDate } from '@date-fns/utc';

export function formatTime(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'HH:mm');
}

export function formatDateTime(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'd MMM, HH:mm');
}

export function formatPricePerKwh(price: number): string {
  return `${price.toFixed(1)}p/kWh`;
}

export function formatDayShort(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'd MMM');
}

/**
 * Format a timestamp for stat display — includes day name when the
 * range spans multiple calendar days, time-only otherwise.
 */
export function formatStatTime(
  ts: number,
  rangeFromTs: number,
  rangeToTs: number,
): string {
  if (!isFinite(ts)) return '—';
  const fromDay = startOfDay(new UTCDate(rangeFromTs));
  const toDay = startOfDay(new UTCDate(rangeToTs));
  if (fromDay.getTime() !== toDay.getTime()) {
    return format(new UTCDate(ts), 'EEE HH:mm');
  }
  return format(new UTCDate(ts), 'HH:mm');
}

export function formatDuration(fromTs: number, toTs: number): string {
  const ms = Math.abs(toTs - fromTs);
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

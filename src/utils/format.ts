import { format } from 'date-fns';
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
 * Format a timestamp for stat display — always includes the day name
 * so the context is visible regardless of range width.
 */
export function formatStatTime(
  ts: number,
  _rangeFromTs: number,
  _rangeToTs: number,
): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'EEE HH:mm');
}

export function formatDuration(fromTs: number, toTs: number): string {
  const ms = Math.abs(toTs - fromTs);
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

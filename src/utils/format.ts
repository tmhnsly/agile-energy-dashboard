import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';

/** Format a timestamp as `HH:mm` (e.g. "14:30"). */
export function formatTime(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'HH:mm');
}

/** Format a timestamp as `d MMM, HH:mm` (e.g. "12 Mar, 14:30"). */
export function formatDateTime(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'd MMM, HH:mm');
}

/** Format a price in pence per kilowatt-hour (e.g. "22.4p/kWh"). */
export function formatPricePerKwh(price: number): string {
  return `${price.toFixed(1)}p/kWh`;
}

/** Format a timestamp as a short date `d MMM` (e.g. "12 Mar"). */
export function formatDayShort(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'd MMM');
}

/**
 * Format a timestamp for stat-card display — always includes the day name
 * so the context is visible regardless of range width (e.g. "Wed 02:30").
 *
 * The range parameters are accepted for call-site compatibility but are
 * currently unused.
 */
export function formatStatTime(
  ts: number,
  _rangeFromTs: number,
  _rangeToTs: number,
): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'EEE HH:mm');
}

/** Format a kWh value with two decimal places (e.g. "1.23 kWh"). */
export function formatKwhValue(kwh: number): string {
  return `${kwh.toFixed(2)} kWh`;
}

/** Format a cost in pence — switches to pounds above 100p (e.g. "42.5p" or "£1.43"). */
export function formatCostPence(pence: number): string {
  if (pence >= 100) return `£${(pence / 100).toFixed(2)}`;
  return `${pence.toFixed(1)}p`;
}

/**
 * Format the difference between two timestamps as a compact duration
 * string (e.g. "6h 00m" or "45m").
 */
export function formatDuration(fromTs: number, toTs: number): string {
  const ms = Math.abs(toTs - fromTs);
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

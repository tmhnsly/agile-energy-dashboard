import { format } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { ONE_MINUTE_MS } from './constants';

/** Format a timestamp as `HH:mm` (e.g. "14:30"). */
export function formatTime(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'HH:mm');
}

/** Format a timestamp as `dd MMM, HH:mm` (e.g. "09 Mar, 14:30"). */
export function formatDateTime(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'dd MMM, HH:mm');
}

/** Format a price in pence per kilowatt-hour (e.g. "22.4p/kWh"). */
export function formatPricePerKwh(price: number): string {
  return `${price.toFixed(1)}p/kWh`;
}

/** Format a timestamp as a short date `dd MMM` (e.g. "09 Mar"). */
export function formatDayShort(ts: number): string {
  if (!isFinite(ts)) return '—';
  return format(new UTCDate(ts), 'dd MMM');
}

/** Format a kWh value with two decimal places (e.g. "1.23 kWh"). */
export function formatKwhValue(kwh: number): string {
  return `${kwh.toFixed(2)} kWh`;
}

/** Format a cost in pence — switches to pounds above 100p (e.g. "42.5p" or "£1.43"). Drops trailing ".0" for round values. */
export function formatCostPence(pence: number): string {
  if (pence >= 100) return `£${(pence / 100).toFixed(2)}`;
  const fixed = pence.toFixed(1);
  return fixed.endsWith('.0') ? `${Math.round(pence)}p` : `${fixed}p`;
}

/**
 * Format the difference between two timestamps as a compact duration
 * string (e.g. "6h 00m" or "45m").
 */
export function formatDuration(fromTs: number, toTs: number): string {
  const ms = Math.abs(toTs - fromTs);
  const totalMinutes = Math.round(ms / ONE_MINUTE_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

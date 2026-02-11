import {
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  startOfDay,
  addDays,
} from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import Papa from 'papaparse';
import type { PricePoint, FlexEvent, HouseholdUsageRow } from '@/types/energy';

// ---------------------------------------------------------------------------
// Agile prices
// ---------------------------------------------------------------------------

/**
 * Parse raw Octopus Agile JSON into sorted `PricePoint[]`.
 *
 * Accepts a bare array or the `{ results: [...] }` wrapper from the API.
 * Looks for common field names (`valid_from`/`timestamp`/`time`/`ts` for
 * the timestamp, `value_inc_vat`/`price`/`value`/`rate` for the price).
 * Invalid items are silently skipped.
 */
export function mapAgilePrices(rawJson: unknown): PricePoint[] {
  const items = extractItems(rawJson);
  const points: PricePoint[] = [];

  for (const item of items) {
    const ts = parseTimestamp(item);
    const price = parsePrice(item);
    if (ts !== null && price !== null) {
      points.push({ ts, price });
    }
  }

  return points.sort((a, b) => a.ts - b.ts);
}

/** Unwrap the Octopus `{ results: [...] }` envelope, or return a bare array. */
function extractItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'results' in raw) {
    const r = (raw as Record<string, unknown>).results;
    if (Array.isArray(r)) return r;
  }
  return [];
}

/** Try several common field names and parse to a timestamp. */
function parseTimestamp(item: unknown): number | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const raw = record.valid_from ?? record.timestamp ?? record.time ?? record.ts;
  if (typeof raw === 'string') {
    const d = parseISO(raw);
    return isNaN(d.getTime()) ? null : d.getTime();
  }
  if (typeof raw === 'number') return raw;
  return null;
}

/** Try several common field names and parse to a numeric price. */
function parsePrice(item: unknown): number | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const raw = record.value_inc_vat ?? record.price ?? record.value ?? record.rate;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Flexibility events
// ---------------------------------------------------------------------------

/**
 * Parse raw flex-event JSON into sorted `FlexEvent[]`.
 *
 * Time-only strings (e.g. `"18:00"`) are treated as daily recurring events
 * and expanded into one instance per day within the price-data range.
 * Full ISO timestamps are used as-is.
 */
export function mapFlexEvents(
  rawJson: unknown,
  rangeFromTs: number,
  rangeToTs: number,
): FlexEvent[] {
  const items = extractFlexItems(rawJson);
  const events: FlexEvent[] = [];

  const firstDay = startOfDay(new UTCDate(rangeFromTs));
  const lastDay = startOfDay(new UTCDate(rangeToTs));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;

    const startRaw = record.start_time ?? record.start ?? record.from;
    const endRaw = record.end_time ?? record.end ?? record.to;
    const label =
      typeof record.event_type === 'string'
        ? record.event_type.replace(/_/g, ' ')
        : undefined;

    const pricePerKwh = typeof record.price_per_kWh === 'number' ? record.price_per_kWh : undefined;
    const minFlexKwh = typeof record.min_flexibility_kWh === 'number' ? record.min_flexibility_kWh : undefined;
    const maxFlexKwh = typeof record.max_flexibility_kWh === 'number' ? record.max_flexibility_kWh : undefined;

    const isTimeOnly =
      typeof startRaw === 'string' && !startRaw.includes('-');

    if (isTimeOnly) {
      // Generate an instance for each day in the price data range
      let day = firstDay;
      while (day.getTime() <= lastDay.getTime()) {
        const startTs = anchorTimeToDate(startRaw, day);
        const endTs = anchorTimeToDate(endRaw, day);
        if (
          startTs !== null &&
          endTs !== null &&
          endTs > rangeFromTs &&
          startTs < rangeToTs
        ) {
          events.push({
            id: `flex-${i}-d${day.getTime()}`,
            startTs,
            endTs,
            label,
            pricePerKwh,
            minFlexKwh,
            maxFlexKwh,
          });
        }
        day = addDays(day, 1);
      }
    } else {
      const startTs = anchorTimeToDate(startRaw, firstDay);
      const endTs = anchorTimeToDate(endRaw, firstDay);
      if (startTs !== null && endTs !== null) {
        events.push({ id: `flex-${i}`, startTs, endTs, label, pricePerKwh, minFlexKwh, maxFlexKwh });
      }
    }
  }

  return events.sort((a, b) => a.startTs - b.startTs);
}

/** Unwrap common envelope shapes for flex-event arrays. */
function extractFlexItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const arr =
      record.flexibility_opportunities ?? record.events ?? record.flexibility_events;
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

/**
 * Resolve a time value to a Unix-ms timestamp.
 *
 * Full ISO strings are parsed directly. Time-only strings like `"18:00"`
 * are pinned to `referenceDate`. Numbers are returned as-is.
 */
function anchorTimeToDate(
  raw: unknown,
  referenceDate: Date,
): number | null {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return null;

  // Full ISO string
  if (raw.includes('-')) {
    const d = parseISO(raw);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  // Time-only string e.g. "18:00" or "18:30"
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let d: Date = new UTCDate(referenceDate.getTime());
    d = setHours(d, parseInt(match[1], 10));
    d = setMinutes(d, parseInt(match[2], 10));
    d = setSeconds(d, 0);
    d = setMilliseconds(d, 0);
    return d.getTime();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Household usage CSV
// ---------------------------------------------------------------------------

interface CsvRow {
  Time?: string;
  Standard_Household?: string;
  HeatPump_Household?: string;
  HeatPump_Battery_Household?: string;
  [key: string]: string | undefined;
}

/**
 * Parse a household-usage CSV into sorted `HouseholdUsageRow[]`.
 *
 * Expects columns `Time`, `Standard_Household`, `HeatPump_Household`,
 * and `HeatPump_Battery_Household`. Time values are anchored to
 * `referenceDate` so they align with the price data timeline.
 */
export function parseHouseholdUsageCsv(
  csvText: string,
  referenceDate: Date,
): HouseholdUsageRow[] {
  const { data } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: HouseholdUsageRow[] = [];

  for (const row of data) {
    const timeStr = row.Time?.trim();
    if (!timeStr) continue;

    const ts = anchorTimeToDate(timeStr, referenceDate);
    if (ts === null) continue;

    const standard = parseFloat(row.Standard_Household ?? '');
    const heatPump = parseFloat(row.HeatPump_Household ?? '');
    const heatPumpBattery = parseFloat(row.HeatPump_Battery_Household ?? '');

    if (isNaN(standard) || isNaN(heatPump) || isNaN(heatPumpBattery)) continue;

    rows.push({ ts, standard, heatPump, heatPumpBattery });
  }

  return rows.sort((a, b) => a.ts - b.ts);
}

import { minutesToMilliseconds, hoursToMilliseconds } from 'date-fns';

/** One minute in milliseconds. */
export const ONE_MINUTE_MS = minutesToMilliseconds(1);

/** Five minutes in milliseconds — chart selection snap interval. */
export const FIVE_MINUTE_MS = minutesToMilliseconds(5);

/** Half-hour in milliseconds — the standard interval for UK energy data. */
export const HALF_HOUR_MS = minutesToMilliseconds(30);

/** One hour in milliseconds. */
export const HOUR_MS = hoursToMilliseconds(1);

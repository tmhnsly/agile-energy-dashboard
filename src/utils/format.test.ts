import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatDateTime,
  formatPricePerKwh,
  formatDayShort,
  formatStatTime,
  formatDuration,
  formatKwhValue,
  formatCostPence,
} from './format';

// Fixed timestamp: 2025-03-13T14:30:00Z
const TS = Date.UTC(2025, 2, 13, 14, 30, 0);

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe('formatTime', () => {
  it('formats a UTC timestamp as HH:mm', () => {
    expect(formatTime(TS)).toBe('14:30');
  });

  it('formats midnight as 00:00', () => {
    expect(formatTime(Date.UTC(2025, 0, 1, 0, 0))).toBe('00:00');
  });

  it('returns dash for non-finite input', () => {
    expect(formatTime(Infinity)).toBe('—');
    expect(formatTime(NaN)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe('formatDateTime', () => {
  it('formats as d MMM, HH:mm', () => {
    expect(formatDateTime(TS)).toBe('13 Mar, 14:30');
  });

  it('returns dash for non-finite input', () => {
    expect(formatDateTime(Infinity)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// formatPricePerKwh
// ---------------------------------------------------------------------------

describe('formatPricePerKwh', () => {
  it('formats a positive price', () => {
    expect(formatPricePerKwh(22.5)).toBe('22.5p/kWh');
  });

  it('handles negative prices', () => {
    expect(formatPricePerKwh(-3.21)).toBe('-3.2p/kWh');
  });

  it('handles zero', () => {
    expect(formatPricePerKwh(0)).toBe('0.0p/kWh');
  });
});

// ---------------------------------------------------------------------------
// formatDayShort
// ---------------------------------------------------------------------------

describe('formatDayShort', () => {
  it('formats as d MMM', () => {
    expect(formatDayShort(TS)).toBe('13 Mar');
  });

  it('returns dash for non-finite input', () => {
    expect(formatDayShort(NaN)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// formatStatTime
// ---------------------------------------------------------------------------

describe('formatStatTime', () => {
  it('formats as EEE HH:mm', () => {
    expect(formatStatTime(TS, 0, 0)).toBe('Thu 14:30');
  });

  it('returns dash for non-finite input', () => {
    expect(formatStatTime(NaN, 0, 0)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// formatKwhValue
// ---------------------------------------------------------------------------

describe('formatKwhValue', () => {
  it('formats to two decimal places', () => {
    expect(formatKwhValue(1.234)).toBe('1.23 kWh');
  });

  it('pads short decimals', () => {
    expect(formatKwhValue(5)).toBe('5.00 kWh');
  });

  it('handles zero', () => {
    expect(formatKwhValue(0)).toBe('0.00 kWh');
  });
});

// ---------------------------------------------------------------------------
// formatCostPence
// ---------------------------------------------------------------------------

describe('formatCostPence', () => {
  it('formats below 100p as pence', () => {
    expect(formatCostPence(42.5)).toBe('42.5p');
  });

  it('formats 100p+ as pounds', () => {
    expect(formatCostPence(142.5)).toBe('£1.43');
  });

  it('formats exactly 100p as pounds', () => {
    expect(formatCostPence(100)).toBe('£1.00');
  });

  it('handles zero', () => {
    expect(formatCostPence(0)).toBe('0.0p');
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    const sixHours = 6 * 60 * 60_000;
    expect(formatDuration(0, sixHours)).toBe('6h 00m');
  });

  it('formats sub-hour durations without hours', () => {
    const fortyFiveMin = 45 * 60_000;
    expect(formatDuration(0, fortyFiveMin)).toBe('45m');
  });

  it('formats mixed hours and minutes', () => {
    const twoHoursThirty = (2 * 60 + 30) * 60_000;
    expect(formatDuration(0, twoHoursThirty)).toBe('2h 30m');
  });

  it('handles reversed arguments (absolute difference)', () => {
    expect(formatDuration(60_000, 0)).toBe('1m');
  });

  it('formats zero duration', () => {
    expect(formatDuration(0, 0)).toBe('0m');
  });
});

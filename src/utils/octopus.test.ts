import { describe, it, expect } from 'vitest';
import { selectAgileProductCode, buildAgileRatesUrl } from './octopus';

// ---------------------------------------------------------------------------
// selectAgileProductCode
// ---------------------------------------------------------------------------

describe('selectAgileProductCode', () => {
  const importAgile = (code: string, available_from: string, available_to: string | null = null) =>
    ({ code, direction: 'IMPORT', available_from, available_to });

  it('picks the available import Agile product from the { results } envelope', () => {
    const raw = {
      results: [
        importAgile('AGILE-24-10-01', '2024-10-01T00:00:00Z'),
        { code: 'GO-22-03-29', direction: 'IMPORT', available_from: '2022-03-29T00:00:00Z', available_to: null },
      ],
    };
    expect(selectAgileProductCode(raw)).toBe('AGILE-24-10-01');
  });

  it('accepts a bare array too', () => {
    expect(selectAgileProductCode([importAgile('AGILE-24-10-01', '2024-10-01T00:00:00Z')]))
      .toBe('AGILE-24-10-01');
  });

  it('excludes the export (AGILE-OUTGOING) product', () => {
    const raw = {
      results: [
        { code: 'AGILE-OUTGOING-19-05-13', direction: 'EXPORT', available_from: '2018-01-01T00:00:00Z', available_to: null },
      ],
    };
    expect(selectAgileProductCode(raw)).toBeNull();
  });

  it('excludes export products by direction even if named AGILE-', () => {
    const raw = { results: [{ code: 'AGILE-EXPORT-99', direction: 'EXPORT', available_from: '2025-01-01T00:00:00Z', available_to: null }] };
    expect(selectAgileProductCode(raw)).toBeNull();
  });

  it('ignores retired products (available_to set)', () => {
    const raw = {
      results: [
        importAgile('AGILE-22-07-22', '2022-07-22T00:00:00Z', '2024-10-01T00:00:00Z'), // retired
        importAgile('AGILE-24-10-01', '2024-10-01T00:00:00Z'),                          // current
      ],
    };
    expect(selectAgileProductCode(raw)).toBe('AGILE-24-10-01');
  });

  it('prefers the most recently launched product when several are available', () => {
    const raw = {
      results: [
        importAgile('AGILE-24-10-01', '2024-10-01T00:00:00Z'),
        importAgile('AGILE-26-01-01', '2026-01-01T00:00:00Z'), // newer — should win
        importAgile('AGILE-24-04-03', '2024-04-03T00:00:00Z'),
      ],
    };
    expect(selectAgileProductCode(raw)).toBe('AGILE-26-01-01');
  });

  it('returns null for empty, malformed, or non-Agile input', () => {
    expect(selectAgileProductCode({ results: [] })).toBeNull();
    expect(selectAgileProductCode(null)).toBeNull();
    expect(selectAgileProductCode('nope')).toBeNull();
    expect(selectAgileProductCode({ results: [{ code: 'GO-22-03-29' }, 42, null] })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildAgileRatesUrl
// ---------------------------------------------------------------------------

describe('buildAgileRatesUrl', () => {
  it('builds the standard-unit-rates URL with the region tariff code and window', () => {
    const from = new Date('2026-05-30T00:00:00Z');
    const to = new Date('2026-06-02T00:00:00Z');
    const url = new URL(buildAgileRatesUrl('AGILE-24-10-01', 'L', from, to));

    expect(url.pathname).toBe(
      '/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-L/standard-unit-rates/',
    );
    expect(url.searchParams.get('period_from')).toBe('2026-05-30T00:00:00.000Z');
    expect(url.searchParams.get('period_to')).toBe('2026-06-02T00:00:00.000Z');
    expect(url.searchParams.get('page_size')).toBe('200');
  });

  it('uses the discovered product code in both the path and tariff code', () => {
    const url = buildAgileRatesUrl('AGILE-26-01-01', 'C', new Date(0), new Date(0));
    expect(url).toContain('/products/AGILE-26-01-01/');
    expect(url).toContain('E-1R-AGILE-26-01-01-C');
  });
});

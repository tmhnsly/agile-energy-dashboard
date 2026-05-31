import { describe, it, expect } from 'vitest';
import { HALF_HOUR_MS } from '@/utils/constants';
import type { HouseholdUsageRow, PricePoint } from '@/types/energy';
import { settlementDay, TIME_GROUPS } from './settlementDay';
import { shiftSimulatorView } from './shiftSimulatorView';

const DAY = Date.UTC(2026, 0, 1);
const slot = (i: number) => DAY + i * HALF_HOUR_MS;
const idx = (key: string) => TIME_GROUPS.findIndex((g) => g.key === key);

// 1 kWh every slot. Peak (36–47) dear, Night (0–11) cheap, rest flat at 20p.
const usage: HouseholdUsageRow[] = Array.from({ length: 48 }, (_, i) => ({
  ts: slot(i),
  standard: 1,
  heatPump: 1,
  heatPumpBattery: 1,
}));
const prices: PricePoint[] = Array.from({ length: 48 }, (_, i) => ({
  ts: slot(i),
  price: i >= 36 ? 40 : i < 12 ? 10 : 20,
}));
const day = settlementDay(usage, prices);

const PEAK = idx('peak');
const NIGHT = idx('night');
const MORNING = idx('morning');
const AFTERNOON = idx('afternoon');

describe('shiftSimulatorView', () => {
  it('idle: every group shows the household tone as an outline, slider disabled, no outcome', () => {
    const v = shiftSimulatorView(day, 'standard', { fromIndex: null, toIndex: null, kwhToShift: Infinity });
    expect(v.hasBoth).toBe(false);
    expect(v.outcome).toBeNull();
    expect(v.slider.disabled).toBe(true);
    for (const b of [...v.fromButtons, ...v.toButtons]) {
      expect(b).toMatchObject({ color: 'accent', variant: 'outline', disabled: false, pressed: false });
    }
  });

  it('one selected: the to-row shows save/cost hints and disables the selected period', () => {
    const v = shiftSimulatorView(day, 'standard', { fromIndex: PEAK, toIndex: null, kwhToShift: Infinity });
    expect(v.outcome).toBeNull();
    expect(v.fromButtons[PEAK]).toMatchObject({ color: 'accent', variant: 'soft', pressed: true });
    expect(v.toButtons[PEAK]).toMatchObject({ color: 'mono', disabled: true });
    expect(v.toButtons[NIGHT].color).toBe('success'); // Peak → Night saves
  });

  it('complete: a Peak → Night shift is a success outcome with a positive saving', () => {
    const v = shiftSimulatorView(day, 'standard', { fromIndex: PEAK, toIndex: NIGHT, kwhToShift: Infinity });
    expect(v.hasBoth).toBe(true);
    expect(v.outcome).toMatchObject({ tone: 'success', savingTone: 'positive', label: 'save' });
    expect(v.outcome!.savingPence).toBeGreaterThan(0);
    expect(v.fromButtons[PEAK]).toMatchObject({ color: 'success', pressed: true, disabled: false });
    expect(v.fromButtons[NIGHT].disabled).toBe(true); // the to-period is disabled on the from row
    expect(v.toButtons[PEAK].disabled).toBe(true); // the from-period is disabled on the to row
    expect(v.slider.disabled).toBe(false);
  });

  it('complete: the slider maxes at the from-period available energy', () => {
    const v = shiftSimulatorView(day, 'standard', { fromIndex: PEAK, toIndex: NIGHT, kwhToShift: Infinity });
    expect(v.maxKwh).toBeCloseTo(12); // 12 Peak slots × 1 kWh
    expect(v.amountKwh).toBeCloseTo(12); // Infinity clamps to available
    expect(v.slider.value).toBeCloseTo(12);
  });

  it('complete: a Night → Peak shift is an error outcome (costs more)', () => {
    const v = shiftSimulatorView(day, 'standard', { fromIndex: NIGHT, toIndex: PEAK, kwhToShift: Infinity });
    expect(v.outcome).toMatchObject({ tone: 'error', savingTone: 'negative', label: 'extra' });
    expect(v.outcome!.savingPence).toBeLessThan(0);
  });

  it('complete: shifting between equally-priced periods reports no difference', () => {
    const v = shiftSimulatorView(day, 'standard', { fromIndex: MORNING, toIndex: AFTERNOON, kwhToShift: Infinity });
    expect(v.outcome).toMatchObject({ tone: 'mono', savingTone: 'neutral', label: 'none' });
  });
});

'use client';

import { useState, useMemo } from 'react';
import { TbMoonStars, TbSunrise, TbSun, TbSunset2 } from 'react-icons/tb';
import type { HouseholdUsageRow, PricePoint, HouseholdKey } from '@/types/energy';
import { HALF_HOUR_MS } from '@/utils/constants';
import { formatCostPence, formatPricePerKwh } from '@/utils/format';
import { simulateShift } from '../computeFlexInsights';
import { Button } from '@/components/UI/Button/Button';
import { InfoTooltip } from '@/components/UI/InfoTooltip/InfoTooltip';
import { Slider } from '@/components/UI/Slider/Slider';
import styles from './ShiftSimulator.module.scss';

/**
 * Time-of-day groups ordered by progression through the day.
 * Each maps to a representative half-hour slot index (0 = 00:00, each step = 30 min).
 */
const TIME_GROUPS = [
  { label: 'Morning',   slotIdx: 16, range: '06:00–12:00', icon: <TbSunrise /> },
  { label: 'Afternoon', slotIdx: 28, range: '12:00–18:00', icon: <TbSun /> },
  { label: 'Peak',      slotIdx: 38, range: '18:00–00:00', icon: <TbSunset2 /> },
  { label: 'Night',     slotIdx: 4,  range: '00:00–06:00', icon: <TbMoonStars /> },
] as const;

/** Look up the price for a given slot from the prices array. */
function slotPrice(
  prices: PricePoint[],
  baseTs: number,
  slotIdx: number,
): number | null {
  if (prices.length === 0) return null;
  const ts = baseTs + slotIdx * HALF_HOUR_MS;
  const match = prices.find((p) => p.ts === ts);
  if (match) return match.price;
  let closest: PricePoint | null = null;
  for (const p of prices) {
    if (p.ts <= ts) closest = p;
    else break;
  }
  return closest?.price ?? null;
}

const TimeGroupTooltip = () => (
  <InfoTooltip label="Time period info">
    <table className={styles.timeTable}>
      <tbody>
        {TIME_GROUPS.map((g) => (
          <tr key={g.label}>
            <td className={styles.timeTableLabel}>{g.label}</td>
            <td className={styles.timeTableRange}>{g.range}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </InfoTooltip>
);

export interface ShiftSimulatorProps {
  usage: HouseholdUsageRow[];
  prices: PricePoint[];
  household: HouseholdKey;
}

export const ShiftSimulator = ({
  usage,
  prices,
  household,
}: ShiftSimulatorProps) => {
  const [fromIdx, setFromIdx] = useState(2); // Peak
  const [toIdx, setToIdx] = useState(3);     // Night
  const [kwhToShift, setKwhToShift] = useState(0.5);

  const baseTs = usage.length > 0 ? usage[0].ts : 0;

  const fromSlotTs = baseTs + TIME_GROUPS[fromIdx].slotIdx * HALF_HOUR_MS;
  const toSlotTs = baseTs + TIME_GROUPS[toIdx].slotIdx * HALF_HOUR_MS;

  // Cap slider to the from-slot's actual usage
  const fromRow = usage.find((r) => r.ts === fromSlotTs);
  const maxKwh = fromRow ? fromRow[household] : 5.0;
  const clampedKwh = Math.min(kwhToShift, maxKwh);

  const fromPrice = slotPrice(prices, baseTs, TIME_GROUPS[fromIdx].slotIdx);
  const toPrice = slotPrice(prices, baseTs, TIME_GROUPS[toIdx].slotIdx);

  const result = useMemo(
    () => simulateShift(usage, prices, household, fromSlotTs, toSlotTs, clampedKwh),
    [usage, prices, household, fromSlotTs, toSlotTs, clampedKwh],
  );

  const savingTone =
    result.savingPence > 0.05
      ? 'positive'
      : result.savingPence < -0.05
        ? 'negative'
        : 'neutral';

  return (
    <div className={styles.content}>
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Shift Simulator</h2>
        <p className={styles.subtitle}>
          Move usage between time periods to see how it affects your daily cost.
        </p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span className={styles.controlLabel}>Move usage from</span>
          <TimeGroupTooltip />
        </div>
        <div className={styles.pillGrid} role="group" aria-label="Shift from time">
          {TIME_GROUPS.map((group, i) => (
            <Button
              key={group.label}
              label={group.label}
              icon={group.icon}
              size="small"
              color="mono"
              variant={i === fromIdx ? 'soft' : 'ghost'}
              pressed={i === fromIdx}
              onClick={() => setFromIdx(i)}
            />
          ))}
        </div>
        {fromPrice != null && (
          <span className={styles.controlHint}>
            {formatPricePerKwh(fromPrice)} at this time
          </span>
        )}
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span className={styles.controlLabel}>Move usage to</span>
          <TimeGroupTooltip />
        </div>
        <div className={styles.pillGrid} role="group" aria-label="Shift to time">
          {TIME_GROUPS.map((group, i) => (
            <Button
              key={group.label}
              label={group.label}
              icon={group.icon}
              size="small"
              color="mono"
              variant={i === toIdx ? 'soft' : 'ghost'}
              pressed={i === toIdx}
              onClick={() => setToIdx(i)}
            />
          ))}
        </div>
        {toPrice != null && (
          <span className={styles.controlHint}>
            {formatPricePerKwh(toPrice)} at this time
          </span>
        )}
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span className={styles.controlLabel}>
            Amount: {clampedKwh.toFixed(1)} kWh
          </span>
          <span className={styles.controlHint}>
            of {maxKwh.toFixed(1)} kWh available
          </span>
        </div>
        <Slider
          min={0.1}
          max={Math.max(0.1, Number(maxKwh.toFixed(1)))}
          step={0.1}
          value={clampedKwh}
          onChange={setKwhToShift}
          disabled={maxKwh <= 0.1}
          aria-label="Amount of energy to shift"
        />
      </div>

      <div className={styles.savingRow}>
        <span className={styles.savingValue} data-tone={savingTone}>
          {result.savingPence > 0.05 ? 'Save ' : result.savingPence < -0.05 ? 'Extra ' : ''}
          {formatCostPence(Math.abs(result.savingPence))}
        </span>
        <span className={styles.savingBreakdown}>
          {formatCostPence(result.originalCostPence)} → {formatCostPence(result.newCostPence)}
        </span>
      </div>
    </div>
  );
};

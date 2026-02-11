'use client';

import { useState, useMemo, useCallback } from 'react';
import { TbMoonStars, TbSunrise, TbSun, TbSunset2 } from 'react-icons/tb';
import type { HouseholdUsageRow, PricePoint, HouseholdKey } from '@/types/energy';
import { HALF_HOUR_MS } from '@/utils/constants';
import { formatCostPence } from '@/utils/format';
import { simulateShift } from '../computeFlexInsights';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Button, type ButtonColor, type ButtonVariant } from '@/components/UI/Button/Button';
import { ClearSelectionButton } from '@/components/UI/ClearSelectionButton/ClearSelectionButton';
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

/**
 * Pre-computed saving hint for a single time-group button.
 * Used to show guided colors on the opposite side when one slot is selected.
 */
interface SlotHint {
  /** Saving in pence — positive = cheaper, negative = more expensive. */
  saving: number;
  /** True if this slot is the currently selected slot on the same side. */
  isSelf: boolean;
  /** True once hints have been computed (false in the idle/empty state). */
  active: boolean;
}

/** Default hints when no slot is selected — all inactive. */
const EMPTY_HINTS: SlotHint[] = TIME_GROUPS.map(() => ({ saving: 0, isSelf: false, active: false }));

/**
 * Map saving hints to button colors for the guided selection state.
 *
 * When the user picks one side (e.g. "from"), the opposite side's buttons
 * light up to guide the next choice:
 *   - success (green, soft)  → this slot would save money
 *   - error   (red, ghost)   → this slot would cost more
 *   - mono    (grey, disabled)→ negligible difference (≤ 0.05p)
 *   - mono    (grey, disabled)→ same slot as the selected side
 */
function guidedColors(hints: SlotHint[]): { color: ButtonColor; disabled: boolean }[] {
  return hints.map((h) => {
    if (!h.active || h.isSelf) return { color: 'mono' as ButtonColor, disabled: h.isSelf && h.active };
    if (Math.abs(h.saving) <= 0.05) return { color: 'mono' as ButtonColor, disabled: true };
    if (h.saving < -0.05) return { color: 'error' as ButtonColor, disabled: false };
    return { color: 'success' as ButtonColor, disabled: false };
  });
}

/** Maps household key to the idle button color when nothing is selected. */
const HOUSEHOLD_BUTTON_COLOR: Record<HouseholdKey, ButtonColor> = {
  standard: 'accent',
  heatPump: 'secondary',
  heatPumpBattery: 'warning',
};

const HOUSEHOLD_LABEL: Record<HouseholdKey, string> = {
  standard: 'Standard',
  heatPump: 'Heat Pump',
  heatPumpBattery: 'Heat Pump + Battery',
};


export interface ShiftSimulatorProps {
  usage: HouseholdUsageRow[];
  prices: PricePoint[];
  household: HouseholdKey;
}

/**
 * Interactive shift-simulation card.
 *
 * Interaction states (driven by `fromIdx`, `toIdx`, and `lastClicked`):
 *
 *   IDLE          → No selection. All buttons show household color (outline).
 *   ONE_SELECTED  → One side picked. That button is `soft`. The OPPOSITE
 *                   side shows guided colors (success/error/disabled) based
 *                   on `toHints` or `fromHints`. The SAME side stays idle.
 *   BOTH_SELECTED → A complete pair. Both selected buttons show the outcome
 *                   tone (success/error/mono) as `soft`. All other buttons
 *                   revert to mono. The slider and result become active.
 *
 * Clicking a selected button deselects it and transitions back.
 */
export const ShiftSimulator = ({
  usage,
  prices,
  household,
}: ShiftSimulatorProps) => {
  const [fromIdx, setFromIdx] = useState<number | null>(null);
  const [toIdx, setToIdx] = useState<number | null>(null);
  const [kwhToShift, setKwhToShift] = useState(0.5);
  /** Which side was last clicked — colors show on the OPPOSITE side only. */
  const [lastClicked, setLastClicked] = useState<'from' | 'to' | null>(null);

  const baseTs = usage.length > 0 ? usage[0].ts : 0;
  const hasBoth = fromIdx != null && toIdx != null;

  const fromSlotTs = fromIdx != null ? baseTs + TIME_GROUPS[fromIdx].slotIdx * HALF_HOUR_MS : 0;
  const toSlotTs = toIdx != null ? baseTs + TIME_GROUPS[toIdx].slotIdx * HALF_HOUR_MS : 0;

  // Cap slider to the from-slot's actual usage
  const fromRow = fromIdx != null ? usage.find((r) => r.ts === fromSlotTs) : undefined;
  const maxKwh = fromRow ? fromRow[household] : 5.0;
  const sliderMax = Math.max(0.1, Number(maxKwh.toFixed(1)));
  const sliderRange = sliderMax - 0.1;
  const SLIDER_SECTIONS = 4;
  const sliderStep = sliderRange > 0 ? sliderRange / SLIDER_SECTIONS : 0.1;
  const clampedKwh = Math.min(kwhToShift, maxKwh);

  const result = useMemo(
    () =>
      hasBoth
        ? simulateShift(usage, prices, household, fromSlotTs, toSlotTs, clampedKwh)
        : null,
    [usage, prices, household, fromSlotTs, toSlotTs, clampedKwh, hasBoth],
  );

  // Savings for each "to" option — only computed when a "from" is selected
  const toHints = useMemo(() => {
    if (fromIdx == null) return EMPTY_HINTS;
    return TIME_GROUPS.map((g, i) => {
      if (i === fromIdx) return { saving: 0, isSelf: true, active: true };
      const tTs = baseTs + g.slotIdx * HALF_HOUR_MS;
      const r = simulateShift(usage, prices, household, fromSlotTs, tTs, clampedKwh);
      return { saving: r.savingPence, isSelf: false, active: true };
    });
  }, [usage, prices, household, fromSlotTs, baseTs, clampedKwh, fromIdx]);

  // Savings for each "from" option — only computed when a "to" is selected
  const fromHints = useMemo(() => {
    if (toIdx == null) return EMPTY_HINTS;
    return TIME_GROUPS.map((g, i) => {
      if (i === toIdx) return { saving: 0, isSelf: true, active: true };
      const fTs = baseTs + g.slotIdx * HALF_HOUR_MS;
      const fRow = usage.find((r) => r.ts === fTs);
      const kWh = Math.min(kwhToShift, fRow ? fRow[household] : 0);
      const r = simulateShift(usage, prices, household, fTs, toSlotTs, kWh);
      return { saving: r.savingPence, isSelf: false, active: true };
    });
  }, [usage, prices, household, toSlotTs, baseTs, kwhToShift, toIdx]);

  // Idle button colors: use the household tone when nothing is selected
  const idleColors = useMemo(
    () => TIME_GROUPS.map(() => ({ color: HOUSEHOLD_BUTTON_COLOR[household], disabled: false })),
    [household],
  );

  // Outcome tone for the selected pair
  const pairTone: ButtonColor = useMemo(() => {
    if (!result) return 'mono';
    if (result.savingPence > 0.05) return 'success';
    if (result.savingPence < -0.05) return 'error';
    return 'mono';
  }, [result]);

  const pairVariant: ButtonVariant = 'soft';

  // When both selected: only the two selected buttons are colored.
  // When one selected: guided colors on the OPPOSITE side only.
  const fromColors = useMemo(() => {
    if (hasBoth) {
      return TIME_GROUPS.map((_, i) => ({
        color: (i === fromIdx ? pairTone : 'mono') as ButtonColor,
        disabled: false,
      }));
    }
    if (lastClicked === 'to' && toIdx != null) return guidedColors(fromHints);
    return idleColors;
  }, [hasBoth, fromIdx, pairTone, lastClicked, toIdx, fromHints, idleColors]);

  const toColors = useMemo(() => {
    if (hasBoth) {
      return TIME_GROUPS.map((_, i) => ({
        color: (i === toIdx ? pairTone : 'mono') as ButtonColor,
        disabled: false,
      }));
    }
    if (lastClicked === 'from' && fromIdx != null) return guidedColors(toHints);
    return idleColors;
  }, [hasBoth, toIdx, pairTone, lastClicked, fromIdx, toHints, idleColors]);

  const handleFromChange = useCallback(
    (idx: number) => {
      if (idx === fromIdx) {
        setFromIdx(null);
        setLastClicked(toIdx != null ? 'to' : null);
        return;
      }
      setFromIdx(idx);
      setLastClicked('from');
    },
    [fromIdx, toIdx],
  );

  const handleToChange = useCallback(
    (idx: number) => {
      if (idx === toIdx) {
        setToIdx(null);
        setLastClicked(fromIdx != null ? 'from' : null);
        return;
      }
      setToIdx(idx);
      setLastClicked('to');
    },
    [fromIdx, toIdx],
  );

  // Slider gradient: light→strong shade of outcome color
  const sliderGradient = useMemo(() => {
    if (!hasBoth || !result) return undefined;
    if (result.savingPence > 0.05)
      return 'linear-gradient(to right, var(--success-bg-hover), var(--success-solid))';
    if (result.savingPence < -0.05)
      return 'linear-gradient(to right, var(--error-bg-hover), var(--error-solid))';
    return undefined;
  }, [hasBoth, result]);

  // Slider thumb/track overrides via CSS custom properties
  const sliderStyle = useMemo((): React.CSSProperties | undefined => {
    if (!hasBoth || !result) return undefined;
    if (result.savingPence > 0.05)
      return {
        '--slider-thumb-border': 'var(--success-solid)',
        '--slider-thumb-bg': 'var(--success-bg)',
        '--slider-track': 'var(--success-bg-active)',
      } as React.CSSProperties;
    if (result.savingPence < -0.05)
      return {
        '--slider-thumb-border': 'var(--error-solid)',
        '--slider-thumb-bg': 'var(--error-bg)',
        '--slider-track': 'var(--error-bg-active)',
      } as React.CSSProperties;
    return undefined;
  }, [hasBoth, result]);

  const savingTone =
    result && result.savingPence > 0.05
      ? 'positive'
      : result && result.savingPence < -0.05
        ? 'negative'
        : 'neutral';

  const handleClear = useCallback(() => {
    setFromIdx(null);
    setToIdx(null);
    setKwhToShift(0.5);
    setLastClicked(null);
  }, []);

  return (
    <Tooltip.Provider delayDuration={300} skipDelayDuration={150}>
    <div className={styles.content}>
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Shift Simulator</h2>
        <p className={styles.subtitle}>
          {HOUSEHOLD_LABEL[household]} — move usage between time periods to see how it affects your daily cost.
        </p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span className={styles.controlLabel}>Move usage from</span>
        </div>
        <div className={styles.pillGrid} role="group" aria-label="Shift from time">
          {TIME_GROUPS.map((group, i) => {
            const { color, disabled } = fromColors[i];
            const isSelected = i === fromIdx;
            return (
              <Tooltip.Root key={group.label}>
                <Tooltip.Trigger asChild>
                  <Button
                    label={group.label}
                    icon={group.icon}
                    size="small"
                    color={color}
                    variant={isSelected && hasBoth ? pairVariant : isSelected ? 'soft' : color === 'success' ? 'soft' : color === 'error' ? 'ghost' : 'outline'}
                    pressed={isSelected}
                    disabled={disabled}
                    onClick={() => handleFromChange(i)}
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className={styles.tooltip} sideOffset={8}>
                    {group.range}
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span className={styles.controlLabel}>Move usage to</span>
        </div>
        <div className={styles.pillGrid} role="group" aria-label="Shift to time">
          {TIME_GROUPS.map((group, i) => {
            const { color, disabled } = toColors[i];
            const isSelected = i === toIdx;
            return (
              <Tooltip.Root key={group.label}>
                <Tooltip.Trigger asChild>
                  <Button
                    label={group.label}
                    icon={group.icon}
                    size="small"
                    color={color}
                    variant={isSelected && hasBoth ? pairVariant : isSelected ? 'soft' : color === 'success' ? 'soft' : color === 'error' ? 'ghost' : 'outline'}
                    pressed={isSelected}
                    disabled={disabled}
                    onClick={() => handleToChange(i)}
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className={styles.tooltip} sideOffset={8}>
                    {group.range}
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span className={styles.controlLabel}>
            Amount: {clampedKwh.toFixed(1)} kWh
          </span>
          {hasBoth && (
            <span className={styles.controlHint}>
              of {maxKwh.toFixed(1)} kWh available
            </span>
          )}
        </div>
        <Slider
          min={0.1}
          max={sliderMax}
          step={sliderStep}
          value={hasBoth ? clampedKwh : sliderMax / 2}
          onChange={setKwhToShift}
          disabled={!hasBoth || maxKwh <= 0.1}
          tickInterval={hasBoth ? sliderStep : undefined}
          trackGradient={sliderGradient}
          style={sliderStyle}
          aria-label="Amount of energy to shift"
        />
      </div>

      <div className={styles.resultArea}>
        {result ? (
          <div className={styles.savingStack}>
            <span className={styles.savingBreakdown}>
              {formatCostPence(result.originalCostPence)} → {formatCostPence(result.newCostPence)}
            </span>
            <span className={styles.savingValue} data-tone={savingTone}>
              {result.savingPence > 0.05
                ? `Save ${formatCostPence(result.savingPence)}`
                : result.savingPence < -0.05
                  ? `Extra ${formatCostPence(Math.abs(result.savingPence))}`
                  : 'No difference'}
            </span>
          </div>
        ) : (
          <p className={styles.savingPlaceholder}>
            Select a time period to see potential savings.
          </p>
        )}
      </div>

      <ClearSelectionButton
        disabled={fromIdx == null && toIdx == null}
        onClick={handleClear}
      />
    </div>
    </Tooltip.Provider>
  );
};

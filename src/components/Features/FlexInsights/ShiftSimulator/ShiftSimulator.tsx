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

/** Time-of-day slots. `slotIdx` is the half-hour offset from midnight. */
const TIME_GROUPS = [
  { label: 'Morning',   slotIdx: 16, range: '06:00–12:00', icon: <TbSunrise /> },
  { label: 'Afternoon', slotIdx: 28, range: '12:00–18:00', icon: <TbSun /> },
  { label: 'Peak',      slotIdx: 38, range: '18:00–00:00', icon: <TbSunset2 /> },
  { label: 'Night',     slotIdx: 4,  range: '00:00–06:00', icon: <TbMoonStars /> },
] as const;

const SLIDER_SECTIONS = 4;

/** Threshold in pence — below this, treat as "no meaningful difference". */
const SAVING_THRESHOLD = 0.05;

const HOUSEHOLD_LABEL: Record<HouseholdKey, string> = {
  standard: 'Standard',
  heatPump: 'Heat Pump',
  heatPumpBattery: 'Heat Pump + Battery',
};

const HOUSEHOLD_BUTTON_COLOR: Record<HouseholdKey, ButtonColor> = {
  standard: 'accent',
  heatPump: 'secondary',
  heatPumpBattery: 'warning',
};

/**
 * Classify a saving value into an outcome tone.
 *   positive saving → 'success' (green)
 *   negative saving → 'error'   (red)
 *   negligible      → 'mono'    (grey)
 */
function outcomeTone(savingPence: number): ButtonColor {
  if (savingPence > SAVING_THRESHOLD) return 'success';
  if (savingPence < -SAVING_THRESHOLD) return 'error';
  return 'mono';
}

/**
 * Pick the button variant for a given state:
 *   selected → soft  (filled background)
 *   guided success → soft  (green fill to invite click)
 *   guided error   → ghost (subtle red, discourage)
 *   everything else → outline
 */
function buttonVariant(isSelected: boolean, color: ButtonColor): ButtonVariant {
  if (isSelected) return 'soft';
  if (color === 'success') return 'soft';
  if (color === 'error') return 'ghost';
  return 'outline';
}

/**
 * Compute hint-based button appearances for the opposite side of a selection.
 *
 * For each slot, runs `simulateShift` to preview the saving if that slot
 * were paired with the already-selected slot. Returns a color + disabled
 * flag per button:
 *   saving > 0  → success (clickable)
 *   saving < 0  → error   (clickable)
 *   negligible  → mono    (disabled)
 *   same slot   → mono    (disabled — can't shift to yourself)
 */
function computeHints(
  usage: HouseholdUsageRow[],
  prices: PricePoint[],
  household: HouseholdKey,
  baseTs: number,
  selectedIdx: number,
  selectedSide: 'from' | 'to',
  kwhToShift: number,
): { color: ButtonColor; disabled: boolean }[] {
  const selectedTs = baseTs + TIME_GROUPS[selectedIdx].slotIdx * HALF_HOUR_MS;

  return TIME_GROUPS.map((g, i) => {
    if (i === selectedIdx) return { color: 'mono' as ButtonColor, disabled: true };

    const otherTs = baseTs + g.slotIdx * HALF_HOUR_MS;

    const fromTs = selectedSide === 'from' ? selectedTs : otherTs;
    const toTs = selectedSide === 'from' ? otherTs : selectedTs;
    const fromRow = usage.find((r) => r.ts === fromTs);
    const kWh = Math.min(kwhToShift, fromRow ? fromRow[household] : 0);

    const { savingPence } = simulateShift(usage, prices, household, fromTs, toTs, kWh);
    const tone = outcomeTone(savingPence);

    return {
      color: tone,
      disabled: tone === 'mono',
    };
  });
}

export interface ShiftSimulatorProps {
  usage: HouseholdUsageRow[];
  prices: PricePoint[];
  household: HouseholdKey;
}

/**
 * Interactive shift-simulation card.
 *
 * ## State machine
 *
 *   IDLE   (fromIdx=null, toIdx=null)
 *     All buttons show household color, outline variant.
 *     Slider disabled, no result shown.
 *
 *   ONE_SELECTED   (one of fromIdx/toIdx is set)
 *     Selected button → soft, household color.
 *     Opposite side → guided hints (green/red/disabled).
 *     Same side unselected → idle household outline.
 *     Slider disabled, no result shown.
 *
 *   COMPLETE   (both fromIdx and toIdx set)
 *     Both selected buttons → soft, outcome color (success/error/mono).
 *     All unselected → mono outline.
 *     Slider enabled, result displayed.
 *
 * Clicking an already-selected button deselects it (→ ONE_SELECTED or IDLE).
 */
export const ShiftSimulator = ({
  usage,
  prices,
  household,
}: ShiftSimulatorProps) => {
  const [fromIdx, setFromIdx] = useState<number | null>(null);
  const [toIdx, setToIdx] = useState<number | null>(null);
  const [kwhToShift, setKwhToShift] = useState(0.5);

  const baseTs = usage.length > 0 ? usage[0].ts : 0;
  const hasBoth = fromIdx != null && toIdx != null;

  const fromSlotTs = fromIdx != null ? baseTs + TIME_GROUPS[fromIdx].slotIdx * HALF_HOUR_MS : 0;
  const toSlotTs = toIdx != null ? baseTs + TIME_GROUPS[toIdx].slotIdx * HALF_HOUR_MS : 0;

  const fromRow = fromIdx != null ? usage.find((r) => r.ts === fromSlotTs) : undefined;
  const maxKwh = fromRow ? fromRow[household] : 5.0;
  const sliderMax = Math.max(0.1, Number(maxKwh.toFixed(1)));
  const sliderStep = (sliderMax - 0.1) > 0 ? (sliderMax - 0.1) / SLIDER_SECTIONS : 0.1;
  const clampedKwh = Math.min(kwhToShift, maxKwh);

  const result = useMemo(
    () =>
      hasBoth
        ? simulateShift(usage, prices, household, fromSlotTs, toSlotTs, clampedKwh)
        : null,
    [usage, prices, household, fromSlotTs, toSlotTs, clampedKwh, hasBoth],
  );

  const tone = result ? outcomeTone(result.savingPence) : 'mono';

  const toHints = useMemo(() => {
    if (fromIdx == null) return null;
    return computeHints(usage, prices, household, baseTs, fromIdx, 'from', clampedKwh);
  }, [usage, prices, household, baseTs, fromIdx, clampedKwh]);

  const fromHints = useMemo(() => {
    if (toIdx == null) return null;
    return computeHints(usage, prices, household, baseTs, toIdx, 'to', kwhToShift);
  }, [usage, prices, household, baseTs, toIdx, kwhToShift]);

  const householdColor = HOUSEHOLD_BUTTON_COLOR[household];

  const getFromButton = useCallback(
    (i: number) => {
      const isSelected = i === fromIdx;

      if (hasBoth) {
        const color = isSelected ? tone : 'mono' as ButtonColor;
        return { color, variant: buttonVariant(isSelected, color), disabled: false };
      }

      if (fromHints) {
        const { color, disabled } = fromHints[i];
        return { color, variant: buttonVariant(false, color), disabled };
      }

      return { color: householdColor, variant: buttonVariant(isSelected, householdColor), disabled: false };
    },
    [fromIdx, hasBoth, tone, fromHints, householdColor],
  );

  const getToButton = useCallback(
    (i: number) => {
      const isSelected = i === toIdx;

      if (hasBoth) {
        const color = isSelected ? tone : 'mono' as ButtonColor;
        return { color, variant: buttonVariant(isSelected, color), disabled: false };
      }

      if (toHints) {
        const { color, disabled } = toHints[i];
        return { color, variant: buttonVariant(false, color), disabled };
      }

      return { color: householdColor, variant: buttonVariant(isSelected, householdColor), disabled: false };
    },
    [toIdx, hasBoth, tone, toHints, householdColor],
  );

  const handleFromChange = useCallback(
    (idx: number) => setFromIdx((prev) => (prev === idx ? null : idx)),
    [],
  );

  const handleToChange = useCallback(
    (idx: number) => setToIdx((prev) => (prev === idx ? null : idx)),
    [],
  );

  const handleClear = useCallback(() => {
    setFromIdx(null);
    setToIdx(null);
    setKwhToShift(0.5);
  }, []);

  const sliderGradient = useMemo(() => {
    if (!hasBoth) return undefined;
    if (tone === 'success')
      return 'linear-gradient(to right, var(--mono-bg-active), var(--success-solid))';
    if (tone === 'error')
      return 'linear-gradient(to right, var(--mono-bg-active), var(--error-solid))';
    return undefined;
  }, [hasBoth, tone]);

  const sliderStyle = useMemo((): React.CSSProperties | undefined => {
    if (!hasBoth) return undefined;
    if (tone === 'success')
      return {
        '--slider-thumb-border': 'var(--success-border-hover)',
        '--slider-thumb-bg': 'var(--success-bg)',
      } as React.CSSProperties;
    if (tone === 'error')
      return {
        '--slider-thumb-border': 'var(--error-border-hover)',
        '--slider-thumb-bg': 'var(--error-bg)',
      } as React.CSSProperties;
    return undefined;
  }, [hasBoth, tone]);

  const savingTone =
    tone === 'success' ? 'positive' : tone === 'error' ? 'negative' : 'neutral';

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
            const { color, variant, disabled } = getFromButton(i);
            return (
              <Tooltip.Root key={group.label}>
                <Tooltip.Trigger asChild>
                  <Button
                    label={group.label}
                    icon={group.icon}
                    size="small"
                    color={color}
                    variant={variant}
                    pressed={i === fromIdx}
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
            const { color, variant, disabled } = getToButton(i);
            return (
              <Tooltip.Root key={group.label}>
                <Tooltip.Trigger asChild>
                  <Button
                    label={group.label}
                    icon={group.icon}
                    size="small"
                    color={color}
                    variant={variant}
                    pressed={i === toIdx}
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
              {result.savingPence > SAVING_THRESHOLD
                ? `Save ${formatCostPence(result.savingPence)}`
                : result.savingPence < -SAVING_THRESHOLD
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

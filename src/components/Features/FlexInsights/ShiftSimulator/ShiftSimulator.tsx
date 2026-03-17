'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { swap } from '@/config/motion';
import { TbMoonStars, TbSunrise, TbSun, TbSunset2 } from 'react-icons/tb';
import type { HouseholdUsageRow, PricePoint, HouseholdKey } from '@/types/energy';
import { HALF_HOUR_MS } from '@/utils/constants';
import { formatCostPence } from '@/utils/format';
import { simulateShift, sumPeriodUsage } from '../computeFlexInsights';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HOUSEHOLD_THEMES } from '@/config/households';
import { Button, type ButtonColor, type ButtonVariant } from '@/components/UI/Button/Button';
import { ClearSelectionButton } from '@/components/UI/ClearSelectionButton/ClearSelectionButton';
import { Slider } from '@/components/UI/Slider/Slider';
import styles from './ShiftSimulator.module.scss';

/** Time-of-day periods. Each spans 12 half-hour slots (6 hours). */
const TIME_GROUPS = [
  { label: 'Morning',   fromSlot: 12, toSlot: 24, range: '06:00–12:00', icon: <TbSunrise /> },
  { label: 'Afternoon', fromSlot: 24, toSlot: 36, range: '12:00–18:00', icon: <TbSun /> },
  { label: 'Peak',      fromSlot: 36, toSlot: 48, range: '18:00–00:00', icon: <TbSunset2 /> },
  { label: 'Night',     fromSlot: 0,  toSlot: 12, range: '00:00–06:00', icon: <TbMoonStars /> },
] as const;

/** Build an array of timestamps for every half-hour slot in a period. */
function periodSlots(baseTs: number, group: typeof TIME_GROUPS[number]): number[] {
  const slots: number[] = [];
  for (let i = group.fromSlot; i < group.toSlot; i++) {
    slots.push(baseTs + i * HALF_HOUR_MS);
  }
  return slots;
}

const SLIDER_SECTIONS = 4;
const SAVING_THRESHOLD = 0.05;

function outcomeTone(savingPence: number): ButtonColor {
  if (savingPence > SAVING_THRESHOLD) return 'success';
  if (savingPence < -SAVING_THRESHOLD) return 'error';
  return 'mono';
}

function buttonVariant(isSelected: boolean): ButtonVariant {
  return isSelected ? 'soft' : 'outline';
}

function computeHints(
  usage: HouseholdUsageRow[],
  prices: PricePoint[],
  household: HouseholdKey,
  baseTs: number,
  selectedIdx: number,
  selectedSide: 'from' | 'to',
  kwhToShift: number,
): { color: ButtonColor; disabled: boolean }[] {
  const selectedSlots = periodSlots(baseTs, TIME_GROUPS[selectedIdx]);

  return TIME_GROUPS.map((g, i) => {
    if (i === selectedIdx) return { color: 'mono' as ButtonColor, disabled: true };

    const otherSlots = periodSlots(baseTs, g);

    const fromSlots = selectedSide === 'from' ? selectedSlots : otherSlots;
    const toSlots = selectedSide === 'from' ? otherSlots : selectedSlots;
    const available = sumPeriodUsage(usage, household, fromSlots);
    const kWh = Math.min(kwhToShift, available);

    const { savingPence } = simulateShift(usage, prices, household, fromSlots, toSlots, kWh);
    const tone = outcomeTone(savingPence);

    return {
      color: tone,
      disabled: false,
    };
  });
}

export interface ShiftSimulatorProps {
  usage: HouseholdUsageRow[];
  prices: PricePoint[];
  household: HouseholdKey;
}

/**
 * Interactive load-shifting calculator. Pick a "from" and "to" time period,
 * adjust the kWh slider, and see the cost impact on the selected household.
 */
export const ShiftSimulator = ({
  usage,
  prices,
  household,
}: ShiftSimulatorProps) => {
  const [fromIdx, setFromIdx] = useState<number | null>(null);
  const [toIdx, setToIdx] = useState<number | null>(null);
  const [kwhToShift, setKwhToShift] = useState(Infinity);
  const [prevHousehold, setPrevHousehold] = useState(household);

  if (prevHousehold !== household) {
    setPrevHousehold(household);
    setFromIdx(null);
    setToIdx(null);
    setKwhToShift(Infinity);
  }

  const baseTs = usage.length > 0 ? usage[0].ts : 0;
  const hasBoth = fromIdx != null && toIdx != null;

  const fromSlots = useMemo(
    () => fromIdx != null ? periodSlots(baseTs, TIME_GROUPS[fromIdx]) : [],
    [baseTs, fromIdx],
  );
  const toSlots = useMemo(
    () => toIdx != null ? periodSlots(baseTs, TIME_GROUPS[toIdx]) : [],
    [baseTs, toIdx],
  );

  const maxKwh = useMemo(
    () => fromIdx != null ? sumPeriodUsage(usage, household, fromSlots) : 0,
    [usage, household, fromSlots, fromIdx],
  );
  const sliderMax = Math.max(0.1, Number(maxKwh.toFixed(1)));
  const sliderStep = (sliderMax - 0.1) > 0 ? (sliderMax - 0.1) / SLIDER_SECTIONS : 0.1;
  const clampedKwh = Math.min(kwhToShift, maxKwh);

  const result = useMemo(
    () =>
      hasBoth
        ? simulateShift(usage, prices, household, fromSlots, toSlots, clampedKwh)
        : null,
    [usage, prices, household, fromSlots, toSlots, clampedKwh, hasBoth],
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

  const householdColor = HOUSEHOLD_THEMES[household].tone;

  const getFromButton = useCallback(
    (i: number) => {
      const isSelected = i === fromIdx;

      if (hasBoth) {
        const color = isSelected ? tone : 'mono' as ButtonColor;
        return { color, variant: buttonVariant(isSelected), disabled: i === toIdx };
      }

      if (fromHints) {
        const { color, disabled } = fromHints[i];
        return { color, variant: buttonVariant(false), disabled };
      }

      return { color: householdColor, variant: buttonVariant(isSelected), disabled: false };
    },
    [fromIdx, toIdx, hasBoth, tone, fromHints, householdColor],
  );

  const getToButton = useCallback(
    (i: number) => {
      const isSelected = i === toIdx;

      if (hasBoth) {
        const color = isSelected ? tone : 'mono' as ButtonColor;
        return { color, variant: buttonVariant(isSelected), disabled: i === fromIdx };
      }

      if (toHints) {
        const { color, disabled } = toHints[i];
        return { color, variant: buttonVariant(false), disabled };
      }

      return { color: householdColor, variant: buttonVariant(isSelected), disabled: false };
    },
    [toIdx, fromIdx, hasBoth, tone, toHints, householdColor],
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
    setKwhToShift(Infinity);
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
          {HOUSEHOLD_THEMES[household].label} — move usage between time periods to see how it affects your daily cost.
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
          value={hasBoth ? clampedKwh : sliderMax}
          onChange={setKwhToShift}
          disabled={!hasBoth || maxKwh <= 0.1}
          tickInterval={hasBoth ? sliderStep : undefined}
          trackGradient={sliderGradient}
          style={sliderStyle}
          aria-label="Amount of energy to shift"
        />
      </div>

      <div className={styles.resultArea}>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key={`${fromIdx}-${toIdx}`}
              className={styles.savingStack}
              initial={swap.enter}
              animate={swap.visible}
              exit={swap.exit}
              transition={swap.transition}
            >
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
            </motion.div>
          ) : (
            <motion.p
              key="placeholder"
              className={styles.savingPlaceholder}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: swap.transition.duration }}
            >
              Select a time period to see potential savings.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <ClearSelectionButton
        disabled={fromIdx == null && toIdx == null}
        onClick={handleClear}
      />
    </div>
    </Tooltip.Provider>
  );
};

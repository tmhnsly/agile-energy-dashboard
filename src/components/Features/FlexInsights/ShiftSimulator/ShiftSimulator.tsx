'use client';

import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { swap } from '@/config/motion';
import { TbMoonStars, TbSunrise, TbSun, TbSunset2 } from 'react-icons/tb';
import type { HouseholdUsageRow, PricePoint, HouseholdKey } from '@/types/energy';
import { formatCostPence } from '@/utils/format';
import { settlementDay, TIME_GROUPS } from '../settlementDay';
import { shiftSimulatorView } from '../shiftSimulatorView';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HOUSEHOLD_THEMES } from '@/config/households';
import { Button } from '@/components/UI/Button/Button';
import { ClearSelectionButton } from '@/components/UI/ClearSelectionButton/ClearSelectionButton';
import { Slider } from '@/components/UI/Slider/Slider';
import styles from './ShiftSimulator.module.scss';

/** Time-group icons, keyed to the domain time groups. */
const GROUP_ICONS: Record<string, ReactNode> = {
  morning: <TbSunrise />,
  afternoon: <TbSun />,
  peak: <TbSunset2 />,
  night: <TbMoonStars />,
};

export interface ShiftSimulatorProps {
  usage: HouseholdUsageRow[];
  prices: PricePoint[];
  household: HouseholdKey;
}

/**
 * Interactive load-shifting calculator. Pick a "from" and "to" time period,
 * adjust the kWh slider, and see the cost impact on the selected household.
 *
 * All decision logic lives in `shiftSimulatorView` over an aligned
 * `settlementDay`; this component owns only the selection state and rendering.
 */
export const ShiftSimulator = ({ usage, prices, household }: ShiftSimulatorProps) => {
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

  const day = useMemo(() => settlementDay(usage, prices), [usage, prices]);

  const view = useMemo(
    () => shiftSimulatorView(day, household, { fromIndex: fromIdx, toIndex: toIdx, kwhToShift }),
    [day, household, fromIdx, toIdx, kwhToShift],
  );

  const tone = view.outcome?.tone ?? 'mono';

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
    if (!view.hasBoth) return undefined;
    if (tone === 'success')
      return 'linear-gradient(to right, var(--mono-bg-active), var(--success-solid))';
    if (tone === 'error')
      return 'linear-gradient(to right, var(--mono-bg-active), var(--error-solid))';
    return undefined;
  }, [view.hasBoth, tone]);

  const sliderStyle = useMemo((): React.CSSProperties | undefined => {
    if (!view.hasBoth) return undefined;
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
  }, [view.hasBoth, tone]);

  return (
    <Tooltip.Provider delayDuration={300} skipDelayDuration={150}>
    <div className={styles.content}>
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Shift Simulator</h2>
        <p className={styles.subtitle}>
          {HOUSEHOLD_THEMES[household].label} — move usage between time periods to see the impact on your daily cost. Switch energy profile in the Flexibility Insights panel.
        </p>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span className={styles.controlLabel}>Move usage from</span>
        </div>
        <div className={styles.pillGrid} role="group" aria-label="Shift from time">
          {TIME_GROUPS.map((group, i) => {
            const { color, variant, disabled, pressed } = view.fromButtons[i];
            return (
              <Tooltip.Root key={group.key}>
                <Tooltip.Trigger asChild>
                  <Button
                    label={group.label}
                    icon={GROUP_ICONS[group.key]}
                    size="small"
                    color={color}
                    variant={variant}
                    pressed={pressed}
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
            const { color, variant, disabled, pressed } = view.toButtons[i];
            return (
              <Tooltip.Root key={group.key}>
                <Tooltip.Trigger asChild>
                  <Button
                    label={group.label}
                    icon={GROUP_ICONS[group.key]}
                    size="small"
                    color={color}
                    variant={variant}
                    pressed={pressed}
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
            Amount: {view.amountKwh.toFixed(1)} kWh
          </span>
          {view.hasBoth && (
            <span className={styles.controlHint}>
              of {view.maxKwh.toFixed(1)} kWh available
            </span>
          )}
        </div>
        <Slider
          min={view.slider.min}
          max={view.slider.max}
          step={view.slider.step}
          value={view.slider.value}
          onChange={setKwhToShift}
          disabled={view.slider.disabled}
          tickInterval={view.slider.tickInterval ?? undefined}
          trackGradient={sliderGradient}
          style={sliderStyle}
          aria-label="Amount of energy to shift"
        />
      </div>

      <div className={styles.resultArea}>
        <AnimatePresence mode="wait">
          {view.outcome ? (
            <motion.div
              key={`${fromIdx}-${toIdx}`}
              className={styles.savingStack}
              initial={swap.enter}
              animate={swap.visible}
              exit={swap.exit}
              transition={swap.transition}
            >
              <span className={styles.savingBreakdown}>
                {formatCostPence(view.outcome.originalCostPence)} → {formatCostPence(view.outcome.newCostPence)}
              </span>
              <span className={styles.savingValue} data-tone={view.outcome.savingTone}>
                {view.outcome.label === 'save'
                  ? `Save ${formatCostPence(view.outcome.savingPence)}`
                  : view.outcome.label === 'extra'
                    ? `Extra ${formatCostPence(Math.abs(view.outcome.savingPence))}`
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

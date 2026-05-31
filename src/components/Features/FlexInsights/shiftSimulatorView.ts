import type { HouseholdKey } from '@/types/energy';
import type { ButtonColor, ButtonVariant } from '@/components/UI/Button/Button';
import { HOUSEHOLD_THEMES } from '@/config/households';
import { TIME_GROUPS, type SettlementDay } from './settlementDay';

/** Cost-direction tone for a shift result. */
export type OutcomeTone = 'success' | 'error' | 'mono';
/** Tone token for the saving value text. */
export type SavingTone = 'positive' | 'negative' | 'neutral';

/** Below this (pence) a shift is treated as making no real difference. */
export const SAVING_THRESHOLD = 0.05;
/** Number of slider sections between min and max. */
const SLIDER_SECTIONS = 4;

/** The simulator's current selection — owned by the component as state. */
export interface SimulatorSelection {
  fromIndex: number | null;
  toIndex: number | null;
  /** kWh chosen on the slider; `Infinity` means "max available" (initial). */
  kwhToShift: number;
}

export interface GroupButton {
  color: ButtonColor;
  variant: ButtonVariant;
  disabled: boolean;
  pressed: boolean;
}

export interface SliderState {
  min: number;
  max: number;
  step: number;
  value: number;
  disabled: boolean;
  /** Tick spacing, or null when there is no complete selection. */
  tickInterval: number | null;
}

export interface SimulatorOutcome {
  originalCostPence: number;
  newCostPence: number;
  savingPence: number;
  tone: OutcomeTone;
  savingTone: SavingTone;
  /** Whether to render a saving, an extra cost, or no meaningful difference. */
  label: 'save' | 'extra' | 'none';
}

export interface SimulatorView {
  hasBoth: boolean;
  fromButtons: GroupButton[];
  toButtons: GroupButton[];
  slider: SliderState;
  /** Clamped amount actually shiftable ("Amount: X kWh"). */
  amountKwh: number;
  /** Total available in the from-period ("of X kWh available"). */
  maxKwh: number;
  outcome: SimulatorOutcome | null;
}

function outcomeTone(savingPence: number): OutcomeTone {
  if (savingPence > SAVING_THRESHOLD) return 'success';
  if (savingPence < -SAVING_THRESHOLD) return 'error';
  return 'mono';
}

const savingToneOf = (tone: OutcomeTone): SavingTone =>
  tone === 'success' ? 'positive' : tone === 'error' ? 'negative' : 'neutral';

const labelOf = (savingPence: number): SimulatorOutcome['label'] =>
  savingPence > SAVING_THRESHOLD ? 'save' : savingPence < -SAVING_THRESHOLD ? 'extra' : 'none';

/**
 * Colour + disabled hint for every group on the row opposite `selectedIndex`.
 * `side` says which side is fixed: when 'from' the selected group is the
 * source and each candidate is a destination; when 'to' it's the reverse.
 */
function hints(
  day: SettlementDay,
  household: HouseholdKey,
  selectedIndex: number,
  side: 'from' | 'to',
  kwh: number,
): { color: ButtonColor; disabled: boolean }[] {
  return TIME_GROUPS.map((_, i) => {
    if (i === selectedIndex) return { color: 'mono' as ButtonColor, disabled: true };
    const fromGroup = side === 'from' ? selectedIndex : i;
    const toGroup = side === 'from' ? i : selectedIndex;
    const kWh = Math.min(kwh, day.groupUsage(household, fromGroup));
    const { savingPence } = day.simulateGroupShift(household, fromGroup, toGroup, kWh);
    const tone = outcomeTone(savingPence);
    // No-difference moves are disabled so the user isn't sent clicking dead ends.
    return { color: tone, disabled: tone === 'mono' };
  });
}

/**
 * Pure view-model for the Shift Simulator. Given an aligned `SettlementDay`,
 * the active household, and the current selection, returns everything the
 * component renders — button tones, slider bounds, and the outcome — with no
 * React state. This is the test surface for the simulator's behaviour.
 */
export function shiftSimulatorView(
  day: SettlementDay,
  household: HouseholdKey,
  selection: SimulatorSelection,
): SimulatorView {
  const { fromIndex, toIndex, kwhToShift } = selection;
  const hasBoth = fromIndex !== null && toIndex !== null;
  const householdColor = HOUSEHOLD_THEMES[household].tone as ButtonColor;

  const maxKwh = fromIndex !== null ? day.groupUsage(household, fromIndex) : 0;
  const sliderMax = Math.max(0.1, Number(maxKwh.toFixed(1)));
  const sliderStep = sliderMax - 0.1 > 0 ? (sliderMax - 0.1) / SLIDER_SECTIONS : 0.1;
  const clampedKwh = Math.min(kwhToShift, maxKwh);

  const result =
    fromIndex !== null && toIndex !== null
      ? day.simulateGroupShift(household, fromIndex, toIndex, clampedKwh)
      : null;
  const tone: OutcomeTone = result ? outcomeTone(result.savingPence) : 'mono';

  // Hints for each row, valid once the opposite side is chosen. Shown whether
  // one or both periods are selected, so a complete selection still previews
  // what the alternative moves would do. Note the (intentional) asymmetry
  // preserved from the original: the to-row uses the clamped amount, the
  // from-row the raw.
  const toHints = fromIndex !== null ? hints(day, household, fromIndex, 'from', clampedKwh) : null;
  const fromHints = toIndex !== null ? hints(day, household, toIndex, 'to', kwhToShift) : null;

  // Selected = filled (soft); alternatives = outline hints; opposite period
  // disabled. Filled-vs-outline keeps the chosen pair distinct from the hints.
  const fromButtons = TIME_GROUPS.map((_, i): GroupButton => {
    if (i === fromIndex) {
      return { color: hasBoth ? tone : householdColor, variant: 'soft', disabled: false, pressed: true };
    }
    if (i === toIndex) {
      return { color: 'mono', variant: 'outline', disabled: true, pressed: false };
    }
    if (fromHints) {
      return { color: fromHints[i].color, variant: 'outline', disabled: fromHints[i].disabled, pressed: false };
    }
    return { color: householdColor, variant: 'outline', disabled: false, pressed: false };
  });

  const toButtons = TIME_GROUPS.map((_, i): GroupButton => {
    if (i === toIndex) {
      return { color: hasBoth ? tone : householdColor, variant: 'soft', disabled: false, pressed: true };
    }
    if (i === fromIndex) {
      return { color: 'mono', variant: 'outline', disabled: true, pressed: false };
    }
    if (toHints) {
      return { color: toHints[i].color, variant: 'outline', disabled: toHints[i].disabled, pressed: false };
    }
    return { color: householdColor, variant: 'outline', disabled: false, pressed: false };
  });

  const slider: SliderState = {
    min: 0.1,
    max: sliderMax,
    step: sliderStep,
    value: hasBoth ? clampedKwh : sliderMax,
    disabled: !hasBoth || maxKwh <= 0.1,
    tickInterval: hasBoth ? sliderStep : null,
  };

  const outcome: SimulatorOutcome | null = result
    ? {
        ...result,
        tone,
        savingTone: savingToneOf(tone),
        label: labelOf(result.savingPence),
      }
    : null;

  return { hasBoth, fromButtons, toButtons, slider, amountKwh: clampedKwh, maxKwh, outcome };
}

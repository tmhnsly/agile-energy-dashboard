import type { HouseholdKey } from '@/types/energy';
import type { ChartTone } from '@/types/chart';

/** Tone values shared across Button, StatCard, BentoTile, and Chart components. */
export type HouseholdTone = 'accent' | 'secondary' | 'warning';

export interface HouseholdTheme {
  label: string;
  tone: HouseholdTone;
  strokeVar: string;
  fillVar: string;
}

export const HOUSEHOLD_THEMES: Record<HouseholdKey, HouseholdTheme> = {
  standard:        { label: 'Standard',            tone: 'accent',    strokeVar: 'var(--accent-solid)',    fillVar: 'var(--accent-solid)' },
  heatPump:        { label: 'Heat Pump',           tone: 'secondary', strokeVar: 'var(--secondary-solid)', fillVar: 'var(--secondary-solid)' },
  heatPumpBattery: { label: 'Heat Pump + Battery', tone: 'warning',   strokeVar: 'var(--warning-solid)',   fillVar: 'var(--warning-solid)' },
};

/** Maps chart tone tokens to CSS custom-property colours. */
export const TONE_VARS: Record<ChartTone, string> = {
  accent: 'var(--accent-solid)',
  secondary: 'var(--secondary-solid)',
  positive: 'var(--success-solid)',
  negative: 'var(--error-solid)',
  warning: 'var(--warning-solid)',
};

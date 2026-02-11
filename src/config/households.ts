import type { HouseholdKey } from '@/types/energy';

/** Tone values shared across Button, StatCard, BentoTile, and Chart components. */
export type HouseholdTone = 'accent' | 'secondary' | 'warning';

export interface HouseholdTheme {
  label: string;
  tone: HouseholdTone;
}

export const HOUSEHOLD_THEMES: Record<HouseholdKey, HouseholdTheme> = {
  standard:        { label: 'Standard',            tone: 'accent' },
  heatPump:        { label: 'Heat Pump',           tone: 'secondary' },
  heatPumpBattery: { label: 'Heat Pump + Battery', tone: 'warning' },
};

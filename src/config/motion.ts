/**
 * Centralised motion configuration.
 *
 * All animation presets live here so timing, easing, and distances
 * stay consistent across the project and can be tuned in one place.
 */
import type { Transition, Variants } from 'motion/react';

/* ── Easing ─────────────────────────────────────────────────────── */

export const ease = {
  /** Smooth deceleration — good for entrances. */
  out: [0.25, 0.1, 0.25, 1] as const,
  /** Gentle overshoot — good for playful reveals. */
  outBack: [0.34, 1.3, 0.64, 1] as const,
};

/* ── Duration (seconds) ─────────────────────────────────────────── */

export const duration = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
};

/* ── Stagger (seconds between siblings) ─────────────────────────── */

export const stagger = {
  tight: 0.06,
  normal: 0.1,
};

/* ── Reveal presets (viewport-triggered entrance) ───────────────── */

export const reveal = {
  /** Default viewport trigger settings. */
  viewport: { once: true, amount: 0.15, margin: '0px 0px -60px 0px' } as const,

  /** Fade up — the workhorse entrance animation. */
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  } satisfies Variants,

  /** Fade in — no movement, just opacity. */
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  } satisfies Variants,

  /** Scale up — subtle grow from slightly smaller. */
  scaleUp: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  } satisfies Variants,

  /** Transition for reveal animations. */
  transition: (delay = 0): Transition => ({
    duration: duration.normal,
    ease: ease.out,
    delay,
  }),
};

/* ── Swap presets (content entering/exiting in place) ───────────── */

export const swap = {
  enter: { opacity: 0, scale: 0.95, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -6 },
  transition: { duration: duration.fast, ease: ease.out } satisfies Transition,
};

/* ── Crossfade (skeleton → content overlay) ─────────────────────── */

export const crossfade = {
  exit: { opacity: 0 },
  transition: { duration: 0.35 } satisfies Transition,
};

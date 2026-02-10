import { memo } from 'react';
import type { ChartBand } from '@/types/chart';
import styles from './TimeSeriesChart.module.scss';

const BAND_TONE_FILL: Record<string, { bg: string; border: string; bgHover: string; borderHover: string }> = {
  warning: {
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    bgHover: 'var(--warning-bg-hover)',
    borderHover: 'var(--warning-border-hover)',
  },
  accent: {
    bg: 'var(--accent-bg)',
    border: 'var(--accent-border)',
    bgHover: 'var(--accent-bg-hover)',
    borderHover: 'var(--accent-border-hover)',
  },
};

interface BandsLayerProps {
  /** Bands (time windows) to render as translucent overlays. */
  bands: ChartBand[];
  /** Width of the chart plotting area in pixels. */
  innerWidth: number;
  /** Height of the chart plotting area in pixels. */
  innerHeight: number;
  /** visx time scale mapping `Date` → pixel x. */
  xScale: (d: Date) => number;
  /** ID of the currently selected band, if any. */
  selectedBandId: string | null;
  /** ID of the band currently under the pointer, if any. */
  hoveredBandId: string | null;
}

/**
 * Renders highlighted time-window bands (e.g. flex events) behind the
 * series lines.  Each band is a filled rect with left/right edge lines,
 * styled differently when selected or hovered.
 */
export const BandsLayer = memo(function BandsLayer({
  bands,
  innerWidth,
  innerHeight,
  xScale,
  selectedBandId,
  hoveredBandId,
}: BandsLayerProps) {
  return (
    <>
      {bands.map((b) => {
        const x0 = Math.max(0, xScale(new Date(b.startTs)));
        const x1 = Math.min(innerWidth, xScale(new Date(b.endTs)));
        const isSelected = b.id === selectedBandId;
        const isHovered = b.id === hoveredBandId;
        const tone = BAND_TONE_FILL[b.tone ?? 'warning'] ?? BAND_TONE_FILL.warning;
        const bandClass = isSelected
          ? styles.bandSelected
          : isHovered
            ? styles.bandHover
            : styles.band;
        const edgeClass = isSelected
          ? styles.bandEdgeSelected
          : isHovered
            ? styles.bandEdgeHover
            : styles.bandEdge;
        return (
          <g key={b.id}>
            <rect
              x={x0}
              y={0}
              width={Math.max(0, x1 - x0)}
              height={innerHeight}
              className={bandClass}
              style={{ fill: isSelected ? tone.bgHover : tone.bg }}
            />
            <line
              x1={x0}
              y1={0}
              x2={x0}
              y2={innerHeight}
              className={edgeClass}
              style={{ stroke: isSelected ? tone.borderHover : tone.border }}
            />
            <line
              x1={x1}
              y1={0}
              x2={x1}
              y2={innerHeight}
              className={edgeClass}
              style={{ stroke: isSelected ? tone.borderHover : tone.border }}
            />
          </g>
        );
      })}
    </>
  );
});

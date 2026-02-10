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
  bands: ChartBand[];
  innerWidth: number;
  innerHeight: number;
  xScale: (d: Date) => number;
  selectedBandId: string | null;
  hoveredBandId: string | null;
}

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

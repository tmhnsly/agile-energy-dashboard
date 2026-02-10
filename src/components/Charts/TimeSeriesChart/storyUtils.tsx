import type { ReactNode } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { mockSeriesA, mockRange } from './mockData';

export const INNER_WIDTH = 700;
export const INNER_HEIGHT = 300;
export const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

/** Pre-built scales matching mockSeriesA / mockRange for sub-component stories. */
export function createMockScales() {
  const values = mockSeriesA.data.map((d) => d.value);
  const xScale = scaleTime<number>({
    domain: [new Date(mockRange.fromTs), new Date(mockRange.toTs)],
    range: [0, INNER_WIDTH],
  });
  const yScale = scaleLinear<number>({
    domain: [Math.min(...values) - 2, Math.max(...values) + 2],
    range: [INNER_HEIGHT, 0],
  });
  return { xScale, yScale };
}

/** SVG wrapper with margin translation for sub-component stories. */
export function ChartCanvas({ children }: { children: ReactNode }) {
  return (
    <svg
      width={INNER_WIDTH + MARGIN.left + MARGIN.right}
      height={INNER_HEIGHT + MARGIN.top + MARGIN.bottom}
      style={{ background: 'var(--mono-app-bg)', borderRadius: 'var(--radius-md)' }}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {children}
      </g>
    </svg>
  );
}

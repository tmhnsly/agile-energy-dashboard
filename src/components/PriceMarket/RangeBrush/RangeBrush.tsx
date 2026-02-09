'use client';

import { useMemo, useRef } from 'react';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { Brush } from '@visx/brush';
import { PatternLines } from '@visx/pattern';
import type BaseBrush from '@visx/brush/lib/BaseBrush';
import type { Bounds } from '@visx/brush/lib/types';
import type { PricePoint, TimeRange } from '@/types/energy';
import styles from './RangeBrush.module.scss';

function getMargin(width: number) {
  const left = width < 480 ? 40 : 56;
  return { top: 4, right: 12, bottom: 20, left };
}
const BRUSH_HEIGHT = 60;

export interface RangeBrushProps {
  points: PricePoint[];
  fullRange: TimeRange;
  activeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  width: number;
}

export const RangeBrush = ({
  points,
  fullRange,
  activeRange,
  onRangeChange,
  width,
}: RangeBrushProps) => {
  const brushRef = useRef<BaseBrush | null>(null);
  const margin = getMargin(width);
  const height = BRUSH_HEIGHT + margin.top + margin.bottom;
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = BRUSH_HEIGHT;

  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [new Date(fullRange.fromTs), new Date(fullRange.toTs)],
        range: [0, innerWidth],
      }),
    [fullRange, innerWidth],
  );

  const yScale = useMemo(() => {
    if (points.length === 0) {
      return scaleLinear({ domain: [0, 100], range: [innerHeight, 0] });
    }
    const prices = points.map((p) => p.price);
    return scaleLinear({
      domain: [Math.min(...prices), Math.max(...prices)],
      range: [innerHeight, 0],
    });
  }, [points, innerHeight]);

  const initialBrushPosition = useMemo(
    () => ({
      start: { x: xScale(new Date(activeRange.fromTs)) },
      end: { x: xScale(new Date(activeRange.toTs)) },
    }),
    // Only compute initial position once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleBrushChange = (domain: Bounds | null) => {
    if (!domain) return;
    const { x0, x1 } = domain;
    const fromTs = xScale.invert(x0).getTime();
    const toTs = xScale.invert(x1).getTime();
    onRangeChange({ fromTs, toTs });
  };

  if (width < 10) return null;

  return (
    <div className={styles.container}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Brush control for selecting time range"
      >
        <PatternLines
          id="brush-pattern"
          height={8}
          width={8}
          stroke="var(--accent-border)"
          strokeWidth={1}
          orientation={['diagonal']}
        />
        <Group left={margin.left} top={margin.top}>
          <LinePath
            data={points}
            x={(d) => xScale(new Date(d.ts))}
            y={(d) => yScale(d.price)}
            curve={curveMonotoneX}
            className={styles.miniLine}
          />
          <Brush
            xScale={xScale}
            yScale={yScale}
            width={innerWidth}
            height={innerHeight}
            innerRef={brushRef}
            initialBrushPosition={initialBrushPosition}
            onChange={handleBrushChange}
            selectedBoxStyle={{
              fill: 'url(#brush-pattern)',
              stroke: 'var(--accent-border)',
              strokeWidth: 1,
            }}
            useWindowMoveEvents
            renderBrushHandle={(props) => <BrushHandle {...props} />}
          />
        </Group>
      </svg>
    </div>
  );
};

interface BrushHandleProps {
  x: number;
  height: number;
  isBrushActive: boolean;
}

function BrushHandle({ x, height, isBrushActive }: BrushHandleProps) {
  if (!isBrushActive) return null;
  const handleHeight = Math.min(24, height * 0.5);
  const y = (height - handleHeight) / 2;
  return (
    <g transform={`translate(${x}, 0)`}>
      <rect
        x={-4}
        y={y}
        width={8}
        height={handleHeight}
        rx={3}
        className={styles.brushHandle}
        aria-label="Brush handle"
        role="slider"
        tabIndex={0}
      />
    </g>
  );
}

import { memo } from 'react';
import styles from './TimeSeriesChart.module.scss';

// Selection handle geometry
const HANDLE_CAP_MAX_HEIGHT = 36;
const HANDLE_CAP_HEIGHT_RATIO = 0.3;
const HANDLE_CAP_WIDTH = 6;
const GRIP_NUB_GAP = 5;
const GRIP_NUB_RADIUS = 1.2;
const HANDLE_CAP_RADIUS = 3;
const HANDLE_HIT_RECT_HALF = 16;

interface SelectionOverlayProps {
  leftX: number;
  rightX: number;
  innerWidth: number;
  innerHeight: number;
}

export const SelectionOverlay = memo(function SelectionOverlay({
  leftX,
  rightX,
  innerWidth,
  innerHeight,
}: SelectionOverlayProps) {
  return (
    <>
      {/* Dim regions */}
      <rect
        x={0}
        y={0}
        width={Math.max(0, leftX)}
        height={innerHeight}
        className={styles.dimOverlay}
      />
      <rect
        x={rightX}
        y={0}
        width={Math.max(0, innerWidth - rightX)}
        height={innerHeight}
        className={styles.dimOverlay}
      />
      {/* Selection fill */}
      <rect
        x={leftX}
        y={0}
        width={Math.max(0, rightX - leftX)}
        height={innerHeight}
        className={styles.selectionFill}
      />
      {/* Boundary lines */}
      <line
        x1={leftX}
        y1={0}
        x2={leftX}
        y2={innerHeight}
        className={styles.selectionBoundary}
      />
      <line
        x1={rightX}
        y1={0}
        x2={rightX}
        y2={innerHeight}
        className={styles.selectionBoundary}
      />
      {/* Handles */}
      <SelectionHandle x={leftX} height={innerHeight} />
      <SelectionHandle x={rightX} height={innerHeight} />
    </>
  );
});

const SelectionHandle = memo(function SelectionHandle({ x, height }: { x: number; height: number }) {
  const capH = Math.min(HANDLE_CAP_MAX_HEIGHT, height * HANDLE_CAP_HEIGHT_RATIO);
  const capY = (height - capH) / 2;
  const gripMid = capY + capH / 2;

  return (
    <g>
      {/* Invisible hit area */}
      <rect x={x - HANDLE_HIT_RECT_HALF} y={0} width={HANDLE_HIT_RECT_HALF * 2} height={height} fill="transparent" />
      {/* End cap */}
      <rect
        x={x - HANDLE_CAP_WIDTH / 2}
        y={capY}
        width={HANDLE_CAP_WIDTH}
        height={capH}
        rx={HANDLE_CAP_RADIUS}
        className={styles.selectionCap}
      />
      {/* Grip nubs */}
      <circle cx={x} cy={gripMid - GRIP_NUB_GAP} r={GRIP_NUB_RADIUS} className={styles.gripNub} />
      <circle cx={x} cy={gripMid} r={GRIP_NUB_RADIUS} className={styles.gripNub} />
      <circle cx={x} cy={gripMid + GRIP_NUB_GAP} r={GRIP_NUB_RADIUS} className={styles.gripNub} />
    </g>
  );
});

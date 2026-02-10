import { memo } from 'react';
import styles from './TimeSeriesChart.module.scss';

// Selection handle geometry
/** Maximum height of the draggable end-cap on a selection handle. */
const HANDLE_CAP_MAX_HEIGHT = 36;
/** Cap height as a fraction of the chart height (capped by HANDLE_CAP_MAX_HEIGHT). */
const HANDLE_CAP_HEIGHT_RATIO = 0.3;
/** Width of the rounded end-cap rectangle in pixels. */
const HANDLE_CAP_WIDTH = 6;
/** Vertical spacing between grip nub dots. */
const GRIP_NUB_GAP = 5;
/** Radius of each grip nub dot. */
const GRIP_NUB_RADIUS = 1.2;
/** Corner radius of the end-cap rectangle. */
const HANDLE_CAP_RADIUS = 3;
/** Half-width of the invisible hit area around each handle. */
const HANDLE_HIT_RECT_HALF = 16;

interface SelectionOverlayProps {
  /** Left edge of the selection in chart-local x pixels. */
  leftX: number;
  /** Right edge of the selection in chart-local x pixels. */
  rightX: number;
  /** Width of the chart plotting area in pixels. */
  innerWidth: number;
  /** Height of the chart plotting area in pixels. */
  innerHeight: number;
}

/**
 * Draws the active time-range selection: dimmed regions outside the
 * selection, a subtle fill inside, boundary lines, and draggable
 * end-cap handles with grip nubs.  Hidden when the full range is selected.
 */
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

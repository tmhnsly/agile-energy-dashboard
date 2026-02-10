import { useCallback, useRef, useState, useEffect } from 'react';
import { localPoint } from '@visx/event';
import { useTooltip } from '@visx/tooltip';
import type { TimeRange } from '@/types/energy';
import type { ChartSeries, ChartBand, ChartDataPoint } from '@/types/chart';
import { bisectNearest } from '@/utils/binarySearch';

/* ── Constants ─────────────────────────────────────── */

const MIN_SEL_PX = 10;
const CLICK_THRESHOLD_PX = 3;
const MIN_DOMAIN_MS = 60_000;
const MOBILE_WIDTH_THRESHOLD = 480;
const HANDLE_HIT_WIDTH_MOBILE = 24;
const HANDLE_HIT_WIDTH_DESKTOP = 16;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/* ── Types ─────────────────────────────────────────── */

interface DragState {
  type: 'left' | 'right' | 'region' | 'new';
  originX: number;
  originTs: number;
  startFromTs: number;
  startToTs: number;
}

export interface TooltipData {
  ts: number;
  values: Array<{ seriesId: string; label: string; value: number; tone?: string }>;
  inBand: ChartBand | null;
}

export interface UseChartInteractionOptions {
  svgRef: React.RefObject<SVGSVGElement | null>;
  overlayRef: React.RefObject<SVGRectElement | null>;
  width: number;
  marginLeft: number;
  marginTop: number;
  fullRange: TimeRange;
  activeRange: TimeRange;
  xScale: { invert: (x: number) => Date; (d: Date): number };
  yScale: (v: number) => number;
  series: ChartSeries[];
  primaryData: ChartDataPoint[];
  visibleBands: ChartBand[];
  onRangeChange: (range: TimeRange) => void;
  onRangePreview?: (range: TimeRange | null) => void;
}

export function useChartInteraction({
  svgRef,
  overlayRef,
  width,
  marginLeft,
  marginTop,
  fullRange,
  activeRange,
  xScale,
  yScale,
  series,
  primaryData,
  visibleBands,
  onRangeChange,
  onRangePreview,
}: UseChartInteractionOptions) {
  const dragRef = useRef<DragState | null>(null);
  const rafId = useRef(0);
  const pendingDragRange = useRef<TimeRange | null>(null);
  const dragRangeRef = useRef<TimeRange | null>(null);
  const hoverRafId = useRef(0);
  const pendingHoverX = useRef<number | null>(null);

  const onRangePreviewRef = useRef(onRangePreview);
  useEffect(() => { onRangePreviewRef.current = onRangePreview; }, [onRangePreview]);

  const [localDragRange, setLocalDragRange] = useState<TimeRange | null>(null);
  const [hoveredBandId, setHoveredBandId] = useState<string | null>(null);

  /* ---- derived display values ---- */
  const displayRange = localDragRange ?? activeRange;
  const displaySelLeftX = xScale(new Date(displayRange.fromTs));
  const displaySelRightX = xScale(new Date(displayRange.toTs));
  const isFullSelection =
    displayRange.fromTs <= fullRange.fromTs &&
    displayRange.toTs >= fullRange.toTs;

  const handleHitWidth = width < MOBILE_WIDTH_THRESHOLD ? HANDLE_HIT_WIDTH_MOBILE : HANDLE_HIT_WIDTH_DESKTOP;

  /* Cursor lives in a ref — updated via DOM to skip per-move rerenders. */
  const cursorRef = useRef('crosshair');
  const updateCursor = useCallback((value: string) => {
    if (cursorRef.current !== value) {
      cursorRef.current = value;
      overlayRef.current?.setAttribute('data-cursor', value);
    }
  }, [overlayRef]);

  const tooltip = useTooltip<TooltipData>();

  /* ---- Cleanup RAF on unmount ---- */
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (hoverRafId.current) cancelAnimationFrame(hoverRafId.current);
    };
  }, []);

  /* ---- pointer helpers ---- */

  const getChartX = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      const pt = localPoint(svgRef.current!, e);
      if (!pt) return 0;
      return pt.x - marginLeft;
    },
    [svgRef, marginLeft],
  );

  const getDragType = useCallback(
    (x: number): DragState['type'] => {
      if (!isFullSelection) {
        if (Math.abs(x - displaySelLeftX) <= handleHitWidth) return 'left';
        if (Math.abs(x - displaySelRightX) <= handleHitWidth) return 'right';
        if (
          x > displaySelLeftX + handleHitWidth &&
          x < displaySelRightX - handleHitWidth
        )
          return 'region';
      }
      return 'new';
    },
    [displaySelLeftX, displaySelRightX, isFullSelection, handleHitWidth],
  );

  const showTooltipForX = useCallback(
    (x: number) => {
      if (primaryData.length === 0) return;
      const ts = xScale.invert(x).getTime();
      const idx = bisectNearest(primaryData, ts);
      if (idx < 0) return;
      const closest = primaryData[idx];

      const values = series.map((s) => {
        const sIdx = bisectNearest(s.data, closest.ts);
        const point = sIdx >= 0 ? s.data[sIdx] : null;
        return {
          seriesId: s.id,
          label: s.label,
          value: point?.value ?? 0,
          tone: s.tone,
        };
      });

      const inBand =
        visibleBands.find(
          (b) => closest.ts >= b.startTs && closest.ts <= b.endTs,
        ) ?? null;

      tooltip.showTooltip({
        tooltipData: { ts: closest.ts, values, inBand },
        tooltipLeft: xScale(new Date(closest.ts)) + marginLeft,
        tooltipTop: yScale(closest.value) + marginTop,
      });
    },
    [primaryData, series, xScale, yScale, visibleBands, tooltip, marginLeft, marginTop],
  );

  const showTooltipForXRef = useRef(showTooltipForX);
  useEffect(() => { showTooltipForXRef.current = showTooltipForX; }, [showTooltipForX]);

  /* ---- pointer event handlers ---- */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const x = getChartX(e);
      const type = getDragType(x);
      const ts = xScale.invert(x).getTime();

      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();

      dragRef.current = {
        type,
        originX: x,
        originTs: ts,
        startFromTs: activeRange.fromTs,
        startToTs: activeRange.toTs,
      };

      if (type !== 'new') {
        dragRangeRef.current = {
          fromTs: activeRange.fromTs,
          toTs: activeRange.toTs,
        };
        setLocalDragRange({
          fromTs: activeRange.fromTs,
          toTs: activeRange.toTs,
        });
      }

      updateCursor(
        type === 'region'
          ? 'grabbing'
          : type === 'new'
            ? 'crosshair'
            : 'ew-resize',
      );
      tooltip.hideTooltip();
      setHoveredBandId(null);
    },
    [getChartX, getDragType, xScale, activeRange, tooltip, updateCursor],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const x = getChartX(e);
      const drag = dragRef.current;

      /* ---- hover (no drag) ---- */
      if (!drag) {
        pendingHoverX.current = x;
        if (!hoverRafId.current) {
          hoverRafId.current = requestAnimationFrame(() => {
            hoverRafId.current = 0;
            if (pendingHoverX.current !== null) {
              showTooltipForXRef.current(pendingHoverX.current);
              pendingHoverX.current = null;
            }
          });
        }

        const hoverType = getDragType(x);

        let bandId: string | null = null;
        if (hoverType === 'new') {
          const ts = xScale.invert(x).getTime();
          const band = visibleBands.find(
            (b) => ts >= b.startTs && ts <= b.endTs,
          );
          bandId = band?.id ?? null;
        }
        setHoveredBandId(bandId);

        updateCursor(
          hoverType === 'left' || hoverType === 'right'
            ? 'ew-resize'
            : hoverType === 'region'
              ? 'grab'
              : bandId !== null
                ? 'pointer'
                : 'crosshair',
        );
        return;
      }

      /* ---- drag in domain space ---- */
      const currentTs = xScale.invert(x).getTime();
      const dTs = currentTs - drag.originTs;

      let fromTs = drag.startFromTs;
      let toTs = drag.startToTs;

      switch (drag.type) {
        case 'left':
          fromTs = clamp(
            drag.startFromTs + dTs,
            fullRange.fromTs,
            drag.startToTs - MIN_DOMAIN_MS,
          );
          break;
        case 'right':
          toTs = clamp(
            drag.startToTs + dTs,
            drag.startFromTs + MIN_DOMAIN_MS,
            fullRange.toTs,
          );
          break;
        case 'region': {
          const dur = drag.startToTs - drag.startFromTs;
          fromTs = drag.startFromTs + dTs;
          toTs = drag.startToTs + dTs;
          if (fromTs < fullRange.fromTs) {
            fromTs = fullRange.fromTs;
            toTs = fullRange.fromTs + dur;
          }
          if (toTs > fullRange.toTs) {
            toTs = fullRange.toTs;
            fromTs = fullRange.toTs - dur;
          }
          break;
        }
        case 'new': {
          fromTs = clamp(
            Math.min(currentTs, drag.originTs),
            fullRange.fromTs,
            fullRange.toTs,
          );
          toTs = clamp(
            Math.max(currentTs, drag.originTs),
            fullRange.fromTs,
            fullRange.toTs,
          );
          break;
        }
      }

      const leftPx = xScale(new Date(fromTs));
      const rightPx = xScale(new Date(toTs));
      if (rightPx - leftPx >= MIN_SEL_PX) {
        const newRange = { fromTs, toTs };
        dragRangeRef.current = newRange;
        pendingDragRange.current = newRange;
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            if (pendingDragRange.current) {
              setLocalDragRange(pendingDragRange.current);
              onRangePreviewRef.current?.(pendingDragRange.current);
            }
            rafId.current = 0;
          });
        }
      }
    },
    [getChartX, getDragType, updateCursor, xScale, visibleBands, fullRange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const drag = dragRef.current;
      if (!drag) return;

      const x = getChartX(e);
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      updateCursor('crosshair');

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }

      if (Math.abs(x - drag.originX) < CLICK_THRESHOLD_PX) {
        if (drag.type === 'new') {
          const clickTs = xScale.invert(x).getTime();
          const hitBands = visibleBands.filter(
            (b) => clickTs >= b.startTs && clickTs <= b.endTs,
          );
          if (hitBands.length > 0) {
            const band = hitBands.reduce((a, b) =>
              a.endTs - a.startTs < b.endTs - b.startTs ? a : b,
            );
            onRangeChange({ fromTs: band.startTs, toTs: band.endTs });
          }
        }
      } else {
        const finalRange = dragRangeRef.current;
        if (finalRange) {
          const clampedFrom = clamp(finalRange.fromTs, fullRange.fromTs, fullRange.toTs);
          const clampedTo = clamp(finalRange.toTs, fullRange.fromTs, fullRange.toTs);
          if (clampedTo > clampedFrom) {
            onRangeChange({ fromTs: clampedFrom, toTs: clampedTo });
          }
        }
      }

      setLocalDragRange(null);
      dragRangeRef.current = null;
      pendingDragRange.current = null;
      onRangePreviewRef.current?.(null);
    },
    [getChartX, xScale, visibleBands, onRangeChange, fullRange, updateCursor],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      if (!dragRef.current) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      updateCursor('crosshair');
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
      setLocalDragRange(null);
      dragRangeRef.current = null;
      pendingDragRange.current = null;
      onRangePreviewRef.current?.(null);
    },
    [updateCursor],
  );

  const handlePointerLeave = useCallback(() => {
    if (!dragRef.current) {
      if (hoverRafId.current) {
        cancelAnimationFrame(hoverRafId.current);
        hoverRafId.current = 0;
      }
      pendingHoverX.current = null;
      tooltip.hideTooltip();
      updateCursor('crosshair');
      setHoveredBandId(null);
    }
  }, [tooltip, updateCursor]);

  return {
    localDragRange,
    displayRange,
    displaySelLeftX,
    displaySelRightX,
    isFullSelection,
    hoveredBandId,
    isDragging: localDragRange !== null,
    tooltip,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handlePointerLeave,
    },
  };
}

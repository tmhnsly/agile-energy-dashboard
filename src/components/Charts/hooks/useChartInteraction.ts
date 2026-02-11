import { useCallback, useRef, useState, useEffect } from 'react';
import { localPoint } from '@visx/event';
import { useTooltip } from '@visx/tooltip';
import { clamp } from '@/utils/math';

/*
 * Drag state machine
 * ─────────────────────────────────────────────────────────────────
 * pointerDown → determine drag type from click position:
 *   'new'    — drawing a fresh selection from scratch
 *   'left'   — resizing the left edge of the existing selection
 *   'right'  — resizing the right edge of the existing selection
 *   'region' — panning the entire selection (preserves duration)
 *
 * pointerMove → compute new range based on drag type, batch via RAF
 * pointerUp   → commit range (or handle click-on-band if < 3 px movement)
 */

/* ── Constants ─────────────────────────────────────── */

/** Minimum selection width in pixels — below this threshold drag changes are ignored. */
const MIN_SEL_PX = 10;
/** Movement threshold (px) to distinguish a click from a drag. */
const CLICK_THRESHOLD_PX = 3;
/** Minimum px movement before promoting a pending touch to a drag. */
const TOUCH_DRAG_THRESHOLD_PX = 10;
/** Viewport width below which we use wider touch targets for selection handles. */
const MOBILE_WIDTH_THRESHOLD = 480;
/** Hit-test width (px) for selection edge handles on mobile. */
const HANDLE_HIT_WIDTH_MOBILE = 24;
/** Hit-test width (px) for selection edge handles on desktop. */
const HANDLE_HIT_WIDTH_DESKTOP = 16;

/* ── Types ─────────────────────────────────────────── */

/** A numeric range with `from` and `to` endpoints. */
export interface ChartRange {
  from: number;
  to: number;
}

/** A clickable/hoverable band region on the chart. */
export interface ChartBandHitArea {
  id: string;
  from: number;
  to: number;
}

interface DragState {
  type: 'left' | 'right' | 'region' | 'new';
  originX: number;
  originValue: number;
  startFrom: number;
  startTo: number;
}

interface PendingTouch {
  pointerId: number;
  originX: number;
  originY: number;
  chartX: number;
  type: DragState['type'];
  value: number;
}

export interface UseChartInteractionOptions<TTooltip> {
  svgRef: React.RefObject<SVGSVGElement | null>;
  overlayRef: React.RefObject<SVGRectElement | null>;
  width: number;
  marginLeft: number;
  marginTop: number;
  fullRange: ChartRange;
  activeRange: ChartRange;
  /** Convert a chart-local pixel x to a domain value. */
  pixelToValue: (px: number) => number;
  /** Convert a domain value to a chart-local pixel x. */
  valueToPixel: (value: number) => number;
  /**
   * Build tooltip data for the given domain value.
   * Return `{ data, left, top }` or `null` to suppress the tooltip.
   */
  buildTooltipData?: (domainValue: number) => { data: TTooltip; left: number; top: number } | null;
  /** Clickable band regions (optional). */
  bands?: ChartBandHitArea[];
  /** Minimum selection span in domain units. Default: 0 (pixel check only). */
  minSelectionSpan?: number;
  /** Optional function to snap domain values (e.g. to 5-minute boundaries). */
  snapValue?: (v: number) => number;
  onRangeChange: (range: ChartRange) => void;
  onRangePreview?: (range: ChartRange | null) => void;
  /** Called on any pointer movement — lets the parent dismiss keyboard mode. */
  onPointerActivity?: () => void;
}

/* ── Pure helpers ──────────────────────────────────── */

/**
 * Given the current drag state and the pointer's current domain value,
 * returns the new `{ from, to }` for the selection. Pure function
 * — no side-effects.
 */
export function computeDragRange(
  drag: DragState,
  currentValue: number,
  fullRange: ChartRange,
  minSpan: number,
): ChartRange {
  const delta = currentValue - drag.originValue;

  let from = drag.startFrom;
  let to = drag.startTo;

  switch (drag.type) {
    case 'left':
      from = clamp(
        drag.startFrom + delta,
        fullRange.from,
        drag.startTo - minSpan,
      );
      break;
    case 'right':
      to = clamp(
        drag.startTo + delta,
        drag.startFrom + minSpan,
        fullRange.to,
      );
      break;
    case 'region': {
      const dur = drag.startTo - drag.startFrom;
      from = drag.startFrom + delta;
      to = drag.startTo + delta;
      if (from < fullRange.from) {
        from = fullRange.from;
        to = fullRange.from + dur;
      }
      if (to > fullRange.to) {
        to = fullRange.to;
        from = fullRange.to - dur;
      }
      break;
    }
    case 'new': {
      from = clamp(
        Math.min(currentValue, drag.originValue),
        fullRange.from,
        fullRange.to,
      );
      to = clamp(
        Math.max(currentValue, drag.originValue),
        fullRange.from,
        fullRange.to,
      );
      break;
    }
  }

  return { from, to };
}

/**
 * Handles a click on a band: finds the narrowest band containing the
 * click value and selects it. Returns the band's range, or `null`
 * if no band was hit.
 */
export function handleBandClick(
  clickValue: number,
  bands: ChartBandHitArea[],
): ChartRange | null {
  const hitBands = bands.filter(
    (b) => clickValue >= b.from && clickValue <= b.to,
  );
  if (hitBands.length === 0) return null;
  const band = hitBands.reduce((a, b) =>
    a.to - a.from < b.to - b.from ? a : b,
  );
  return { from: band.from, to: band.to };
}

/* ── Hook ──────────────────────────────────────────── */

export function useChartInteraction<TTooltip>({
  svgRef,
  overlayRef,
  width,
  marginLeft,
  fullRange,
  activeRange,
  pixelToValue,
  valueToPixel,
  buildTooltipData,
  bands = [],
  minSelectionSpan = 0,
  snapValue,
  onRangeChange,
  onRangePreview,
  onPointerActivity,
}: UseChartInteractionOptions<TTooltip>) {
  const dragRef = useRef<DragState | null>(null);
  const pendingTouchRef = useRef<PendingTouch | null>(null);
  const rafId = useRef(0);
  const pendingDragRange = useRef<ChartRange | null>(null);
  const dragRangeRef = useRef<ChartRange | null>(null);
  const hoverRafId = useRef(0);
  const pendingHoverX = useRef<number | null>(null);

  const snapValueRef = useRef(snapValue);
  useEffect(() => { snapValueRef.current = snapValue; }, [snapValue]);

  const onRangePreviewRef = useRef(onRangePreview);
  useEffect(() => { onRangePreviewRef.current = onRangePreview; }, [onRangePreview]);

  const onPointerActivityRef = useRef(onPointerActivity);
  useEffect(() => { onPointerActivityRef.current = onPointerActivity; }, [onPointerActivity]);

  const pixelToValueRef = useRef(pixelToValue);
  useEffect(() => { pixelToValueRef.current = pixelToValue; }, [pixelToValue]);

  const valueToPixelRef = useRef(valueToPixel);
  useEffect(() => { valueToPixelRef.current = valueToPixel; }, [valueToPixel]);

  const buildTooltipDataRef = useRef(buildTooltipData);
  useEffect(() => { buildTooltipDataRef.current = buildTooltipData; }, [buildTooltipData]);

  const [localDragRange, setLocalDragRange] = useState<ChartRange | null>(null);
  const [hoveredBandId, setHoveredBandId] = useState<string | null>(null);

  /* ---- derived display values ---- */
  const displayRange = localDragRange ?? activeRange;
  const displaySelLeftX = valueToPixel(displayRange.from);
  const displaySelRightX = valueToPixel(displayRange.to);
  const isFullSelection =
    displayRange.from <= fullRange.from &&
    displayRange.to >= fullRange.to;

  const handleHitWidth = width < MOBILE_WIDTH_THRESHOLD ? HANDLE_HIT_WIDTH_MOBILE : HANDLE_HIT_WIDTH_DESKTOP;

  /* Cursor lives in a ref — updated via DOM to skip per-move rerenders. */
  const cursorRef = useRef('crosshair');
  const updateCursor = useCallback((value: string) => {
    if (cursorRef.current !== value) {
      cursorRef.current = value;
      overlayRef.current?.setAttribute('data-cursor', value);
    }
  }, [overlayRef]);

  const tooltip = useTooltip<TTooltip>();

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

  const showTooltipAtPixel = useCallback(
    (x: number) => {
      const builder = buildTooltipDataRef.current;
      if (!builder) return;
      const value = pixelToValueRef.current(x);
      const result = builder(value);
      if (result) {
        tooltip.showTooltip({
          tooltipData: result.data,
          tooltipLeft: result.left,
          tooltipTop: result.top,
        });
      }
    },
    [tooltip],
  );

  const showTooltipAtPixelRef = useRef(showTooltipAtPixel);
  useEffect(() => { showTooltipAtPixelRef.current = showTooltipAtPixel; }, [showTooltipAtPixel]);

  /* ---- hover handler (no drag active) ---- */

  /**
   * Updates tooltip, cursor, and hovered-band state when the pointer
   * moves without an active drag. Tooltip updates are batched via RAF.
   */
  const handleHover = useCallback(
    (x: number) => {
      pendingHoverX.current = x;
      if (!hoverRafId.current) {
        hoverRafId.current = requestAnimationFrame(() => {
          hoverRafId.current = 0;
          if (pendingHoverX.current !== null) {
            showTooltipAtPixelRef.current(pendingHoverX.current);
            pendingHoverX.current = null;
          }
        });
      }

      const hoverType = getDragType(x);

      let bandId: string | null = null;
      if (hoverType === 'new') {
        const value = pixelToValueRef.current(x);
        const band = bands.find(
          (b) => value >= b.from && value <= b.to,
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
    },
    [getDragType, updateCursor, bands],
  );

  /* ---- pointer event handlers ---- */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const x = getChartX(e);
      const type = getDragType(x);
      const value = pixelToValueRef.current(x);

      /* Touch: defer drag until we know the gesture direction. */
      if (e.pointerType === 'touch') {
        pendingTouchRef.current = {
          pointerId: e.pointerId,
          originX: e.clientX,
          originY: e.clientY,
          chartX: x,
          type,
          value,
        };
        tooltip.hideTooltip();
        setHoveredBandId(null);
        return;
      }

      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();

      dragRef.current = {
        type,
        originX: x,
        originValue: value,
        startFrom: activeRange.from,
        startTo: activeRange.to,
      };

      if (type !== 'new') {
        dragRangeRef.current = {
          from: activeRange.from,
          to: activeRange.to,
        };
        setLocalDragRange({
          from: activeRange.from,
          to: activeRange.to,
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
    [getChartX, getDragType, activeRange, tooltip, updateCursor],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      onPointerActivityRef.current?.();

      /* ---- pending touch: decide between drag and scroll ---- */
      const pending = pendingTouchRef.current;
      if (pending) {
        const dx = e.clientX - pending.originX;
        const dy = e.clientY - pending.originY;

        if (Math.abs(dy) > Math.abs(dx)) {
          /* Vertical scroll — cancel pending touch, let browser handle it. */
          pendingTouchRef.current = null;
          return;
        }

        if (Math.abs(dx) < TOUCH_DRAG_THRESHOLD_PX) {
          /* Below threshold — wait for more movement. */
          return;
        }

        /* Horizontal drag confirmed — promote to real drag. */
        pendingTouchRef.current = null;
        e.currentTarget.setPointerCapture(pending.pointerId);
        (e.currentTarget as SVGRectElement).style.touchAction = 'none';

        dragRef.current = {
          type: pending.type,
          originX: pending.chartX,
          originValue: pending.value,
          startFrom: activeRange.from,
          startTo: activeRange.to,
        };

        if (pending.type !== 'new') {
          dragRangeRef.current = { from: activeRange.from, to: activeRange.to };
          setLocalDragRange({ from: activeRange.from, to: activeRange.to });
        }

        updateCursor(
          pending.type === 'region'
            ? 'grabbing'
            : pending.type === 'new'
              ? 'crosshair'
              : 'ew-resize',
        );
        /* Fall through to the normal drag logic below. */
      }

      const x = getChartX(e);
      const drag = dragRef.current;

      if (!drag) {
        handleHover(x);
        return;
      }

      /* ---- active drag ---- */
      const currentValue = pixelToValueRef.current(x);
      const { from, to } = computeDragRange(drag, currentValue, fullRange, minSelectionSpan);

      const leftPx = valueToPixelRef.current(from);
      const rightPx = valueToPixelRef.current(to);
      if (rightPx - leftPx >= MIN_SEL_PX) {
        const snap = snapValueRef.current;
        const snappedFrom = snap ? snap(from) : from;
        const snappedTo = snap ? snap(to) : to;
        const prev = dragRangeRef.current;
        if (prev && prev.from === snappedFrom && prev.to === snappedTo) return;
        const newRange: ChartRange = { from: snappedFrom, to: snappedTo };
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
    [getChartX, handleHover, fullRange, minSelectionSpan, activeRange, updateCursor],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      /* Pending touch that never became a drag — treat as tap. */
      const pending = pendingTouchRef.current;
      if (pending) {
        pendingTouchRef.current = null;
        if (pending.type === 'new') {
          const bandRange = handleBandClick(pending.value, bands);
          if (bandRange) onRangeChange(bandRange);
        }
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;

      const x = getChartX(e);
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      updateCursor('crosshair');
      /* Reset touch-action after a touch drag. */
      (e.currentTarget as SVGRectElement).style.touchAction = 'pan-y';

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }

      if (Math.abs(x - drag.originX) < CLICK_THRESHOLD_PX) {
        if (drag.type === 'new') {
          const clickValue = pixelToValueRef.current(x);
          const bandRange = handleBandClick(clickValue, bands);
          if (bandRange) onRangeChange(bandRange);
        }
      } else {
        const finalRange = dragRangeRef.current;
        if (finalRange) {
          const clampedFrom = clamp(finalRange.from, fullRange.from, fullRange.to);
          const clampedTo = clamp(finalRange.to, fullRange.from, fullRange.to);
          if (clampedTo > clampedFrom) {
            onRangeChange({ from: clampedFrom, to: clampedTo });
          }
        }
      }

      setLocalDragRange(null);
      dragRangeRef.current = null;
      pendingDragRange.current = null;
      onRangePreviewRef.current?.(null);
    },
    [getChartX, bands, onRangeChange, fullRange, updateCursor],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      if (pendingTouchRef.current) {
        pendingTouchRef.current = null;
      }
      if (!dragRef.current) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      updateCursor('crosshair');
      /* Reset touch-action after a touch drag. */
      (e.currentTarget as SVGRectElement).style.touchAction = 'pan-y';
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

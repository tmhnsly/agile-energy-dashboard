import { useState, useCallback, useRef, useEffect } from 'react';

/* ── Types ─────────────────────────────────────────── */

export interface UseChartKeyboardNavOptions {
  /** Number of navigable data points. */
  dataLength: number;
  /** Called when the user selects a range via keyboard (Shift+Arrow or Space×2). */
  onSelect: (fromIndex: number, toIndex: number) => void;
  /** Called when the user clears the selection (Escape). */
  onReset: () => void;
  /** Format a single data point for screen-reader announcement. */
  formatPoint: (index: number) => string;
  /** Format a selection range for screen-reader announcement. */
  formatSelection: (fromIndex: number, toIndex: number) => string;
}

export interface UseChartKeyboardNavResult {
  focusedIndex: number;
  isKeyboardActive: boolean;
  /** Index of the first boundary placed via Space, or null. */
  selectionStart: number | null;
  announcement: string;
  dismissKeyboard: () => void;
  activateKeyboard: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/* ── Pure key processing ──────────────────────────── */

export interface KeyNavState {
  focusedIndex: number;
  selectionStart: number | null;
  anchor: number | null;
}

export interface KeyNavAction {
  key: string;
  shiftKey: boolean;
  dataLength: number;
}

export interface KeyNavResult {
  next: KeyNavState;
  /** 'point' — announce a single point; 'selection' — announce a range; 'custom' — literal string. */
  announce:
    | { type: 'point'; index: number }
    | { type: 'selection'; from: number; to: number }
    | { type: 'custom'; text: string }
    | null;
  /** Indices to pass to onSelect, if any. */
  select: [number, number] | null;
  /** Whether onReset should be called. */
  reset: boolean;
  /** Whether the key was handled (should preventDefault). */
  handled: boolean;
}

/**
 * Pure function that computes the next keyboard navigation state from a key event.
 * All side-effects (state updates, announcements, callbacks) are described in the return value.
 */
export function processKeyDown(state: KeyNavState, action: KeyNavAction): KeyNavResult {
  const { key, shiftKey, dataLength } = action;
  if (dataLength === 0) {
    return { next: state, announce: null, select: null, reset: false, handled: false };
  }

  const lastIndex = dataLength - 1;
  const { focusedIndex, selectionStart, anchor } = state;

  switch (key) {
    case 'ArrowRight': {
      if (shiftKey) {
        const next = Math.min(focusedIndex + 1, lastIndex);
        const a = anchor ?? focusedIndex;
        const from = Math.min(a, next);
        const to = Math.max(a, next);
        return {
          next: { focusedIndex: next, selectionStart, anchor: a },
          announce: { type: 'selection', from, to },
          select: [from, to],
          reset: false,
          handled: true,
        };
      }
      const next = Math.min(focusedIndex + 1, lastIndex);
      return {
        next: { focusedIndex: next, selectionStart, anchor: null },
        announce: { type: 'point', index: next },
        select: null,
        reset: false,
        handled: true,
      };
    }

    case 'ArrowLeft': {
      if (shiftKey) {
        const next = Math.max(focusedIndex - 1, 0);
        const a = anchor ?? focusedIndex;
        const from = Math.min(a, next);
        const to = Math.max(a, next);
        return {
          next: { focusedIndex: next, selectionStart, anchor: a },
          announce: { type: 'selection', from, to },
          select: [from, to],
          reset: false,
          handled: true,
        };
      }
      const next = Math.max(focusedIndex - 1, 0);
      return {
        next: { focusedIndex: next, selectionStart, anchor: null },
        announce: { type: 'point', index: next },
        select: null,
        reset: false,
        handled: true,
      };
    }

    case 'Home':
      return {
        next: { focusedIndex: 0, selectionStart, anchor: null },
        announce: { type: 'point', index: 0 },
        select: null,
        reset: false,
        handled: true,
      };

    case 'End':
      return {
        next: { focusedIndex: lastIndex, selectionStart, anchor: null },
        announce: { type: 'point', index: lastIndex },
        select: null,
        reset: false,
        handled: true,
      };

    case ' ': {
      if (selectionStart == null) {
        return {
          next: { focusedIndex, selectionStart: focusedIndex, anchor },
          announce: { type: 'custom', text: `range-start:${focusedIndex}` },
          select: null,
          reset: false,
          handled: true,
        };
      }
      const from = Math.min(selectionStart, focusedIndex);
      const to = Math.max(selectionStart, focusedIndex);
      return {
        next: { focusedIndex, selectionStart: null, anchor: null },
        announce: { type: 'selection', from, to },
        select: [from, to],
        reset: false,
        handled: true,
      };
    }

    case 'Escape':
      return {
        next: { focusedIndex, selectionStart: null, anchor: null },
        announce: { type: 'custom', text: 'Selection cleared' },
        select: null,
        reset: true,
        handled: true,
      };

    case 'Enter': {
      if (anchor != null) {
        return {
          next: { focusedIndex, selectionStart, anchor: null },
          announce: { type: 'custom', text: 'Selection confirmed' },
          select: null,
          reset: false,
          handled: true,
        };
      }
      return { next: state, announce: null, select: null, reset: false, handled: false };
    }

    default:
      return { next: state, announce: null, select: null, reset: false, handled: false };
  }
}

/* ── Hook ──────────────────────────────────────────── */

export function useChartKeyboardNav({
  dataLength,
  onSelect,
  onReset,
  formatPoint,
  formatSelection,
}: UseChartKeyboardNavOptions): UseChartKeyboardNavResult {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const anchorRef = useRef<number | null>(null);

  /* Stable refs for callbacks used inside handleKeyDown */
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  const onResetRef = useRef(onReset);
  useEffect(() => { onResetRef.current = onReset; }, [onReset]);
  const formatPointRef = useRef(formatPoint);
  useEffect(() => { formatPointRef.current = formatPoint; }, [formatPoint]);
  const formatSelectionRef = useRef(formatSelection);
  useEffect(() => { formatSelectionRef.current = formatSelection; }, [formatSelection]);

  const focusedIndexRef = useRef(focusedIndex);
  useEffect(() => { focusedIndexRef.current = focusedIndex; }, [focusedIndex]);
  const selectionStartRef = useRef(selectionStart);
  useEffect(() => { selectionStartRef.current = selectionStart; }, [selectionStart]);

  const dismissKeyboard = useCallback(() => {
    setIsKeyboardActive(false);
  }, []);

  const activateKeyboard = useCallback(() => {
    setIsKeyboardActive(true);
    if (dataLength > 0) {
      setAnnouncement(formatPointRef.current(focusedIndexRef.current));
    }
  }, [dataLength]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const state: KeyNavState = {
        focusedIndex: focusedIndexRef.current,
        selectionStart: selectionStartRef.current,
        anchor: anchorRef.current,
      };

      const result = processKeyDown(state, {
        key: e.key,
        shiftKey: e.shiftKey,
        dataLength,
      });

      if (!result.handled) return;

      e.preventDefault();
      setIsKeyboardActive(true);

      // Apply state updates (sync refs for rapid keystrokes)
      setFocusedIndex(result.next.focusedIndex);
      focusedIndexRef.current = result.next.focusedIndex;
      setSelectionStart(result.next.selectionStart);
      selectionStartRef.current = result.next.selectionStart;
      anchorRef.current = result.next.anchor;

      // Announce
      if (result.announce) {
        switch (result.announce.type) {
          case 'point':
            setAnnouncement(formatPointRef.current(result.announce.index));
            break;
          case 'selection':
            setAnnouncement(formatSelectionRef.current(result.announce.from, result.announce.to));
            break;
          case 'custom':
            if (result.announce.text.startsWith('range-start:')) {
              const idx = result.next.focusedIndex;
              setAnnouncement(
                `Range start set at ${formatPointRef.current(idx)}. Navigate to end point and press Space again.`,
              );
            } else {
              setAnnouncement(result.announce.text);
            }
            break;
        }
      }

      // Fire callbacks
      if (result.select) {
        onSelectRef.current(result.select[0], result.select[1]);
      }
      if (result.reset) {
        onResetRef.current();
      }
    },
    [dataLength],
  );

  return {
    focusedIndex,
    isKeyboardActive,
    selectionStart,
    announcement,
    dismissKeyboard,
    activateKeyboard,
    handleKeyDown,
  };
}

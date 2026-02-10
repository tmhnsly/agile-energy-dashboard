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

  /* Defer parent onSelect calls so they don't fire inside a setState updater */
  const pendingSelectRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (pendingSelectRef.current) {
      const [from, to] = pendingSelectRef.current;
      pendingSelectRef.current = null;
      onSelectRef.current(from, to);
    }
  });

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
      if (dataLength === 0) return;
      const lastIndex = dataLength - 1;

      let handled = true;

      switch (e.key) {
        case 'ArrowRight': {
          setIsKeyboardActive(true);
          if (e.shiftKey) {
            setFocusedIndex((prev) => {
              const next = Math.min(prev + 1, lastIndex);
              const anchor = anchorRef.current ?? prev;
              anchorRef.current = anchor;
              const fromIdx = Math.min(anchor, next);
              const toIdx = Math.max(anchor, next);
              pendingSelectRef.current = [fromIdx, toIdx];
              setAnnouncement(formatSelectionRef.current(fromIdx, toIdx));
              return next;
            });
          } else {
            anchorRef.current = null;
            setFocusedIndex((prev) => {
              const next = Math.min(prev + 1, lastIndex);
              setAnnouncement(formatPointRef.current(next));
              return next;
            });
          }
          break;
        }

        case 'ArrowLeft': {
          setIsKeyboardActive(true);
          if (e.shiftKey) {
            setFocusedIndex((prev) => {
              const next = Math.max(prev - 1, 0);
              const anchor = anchorRef.current ?? prev;
              anchorRef.current = anchor;
              const fromIdx = Math.min(anchor, next);
              const toIdx = Math.max(anchor, next);
              pendingSelectRef.current = [fromIdx, toIdx];
              setAnnouncement(formatSelectionRef.current(fromIdx, toIdx));
              return next;
            });
          } else {
            anchorRef.current = null;
            setFocusedIndex((prev) => {
              const next = Math.max(prev - 1, 0);
              setAnnouncement(formatPointRef.current(next));
              return next;
            });
          }
          break;
        }

        case 'Home': {
          setIsKeyboardActive(true);
          anchorRef.current = null;
          setFocusedIndex(0);
          setAnnouncement(formatPointRef.current(0));
          break;
        }

        case 'End': {
          setIsKeyboardActive(true);
          anchorRef.current = null;
          setFocusedIndex(lastIndex);
          setAnnouncement(formatPointRef.current(lastIndex));
          break;
        }

        case ' ': {
          setIsKeyboardActive(true);
          if (selectionStart == null) {
            // First press — place the start boundary
            setFocusedIndex((prev) => {
              setSelectionStart(prev);
              setAnnouncement(
                `Range start set at ${formatPointRef.current(prev)}. Navigate to end point and press Space again.`,
              );
              return prev;
            });
          } else {
            // Second press — commit the selection
            setFocusedIndex((prev) => {
              const fromIdx = Math.min(selectionStart, prev);
              const toIdx = Math.max(selectionStart, prev);
              pendingSelectRef.current = [fromIdx, toIdx];
              setAnnouncement(formatSelectionRef.current(fromIdx, toIdx));
              setSelectionStart(null);
              anchorRef.current = null;
              return prev;
            });
          }
          break;
        }

        case 'Escape': {
          setIsKeyboardActive(true);
          anchorRef.current = null;
          setSelectionStart(null);
          onResetRef.current();
          setAnnouncement('Selection cleared');
          break;
        }

        case 'Enter': {
          if (anchorRef.current != null) {
            setIsKeyboardActive(true);
            setAnnouncement('Selection confirmed');
            anchorRef.current = null;
          }
          break;
        }

        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
      }
    },
    [dataLength, selectionStart],
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

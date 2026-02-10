import { describe, it, expect } from 'vitest';
import { processKeyDown } from './useChartKeyboardNav';
import type { KeyNavState, KeyNavAction } from './useChartKeyboardNav';

const initial: KeyNavState = { focusedIndex: 0, selectionStart: null, anchor: null };

function action(key: string, opts: Partial<KeyNavAction> = {}): KeyNavAction {
  return { key, shiftKey: false, dataLength: 10, ...opts };
}

describe('processKeyDown', () => {
  describe('ArrowRight', () => {
    it('increments focusedIndex', () => {
      const r = processKeyDown(initial, action('ArrowRight'));
      expect(r.next.focusedIndex).toBe(1);
      expect(r.handled).toBe(true);
      expect(r.announce).toEqual({ type: 'point', index: 1 });
    });

    it('clamps at last index', () => {
      const state: KeyNavState = { focusedIndex: 9, selectionStart: null, anchor: null };
      const r = processKeyDown(state, action('ArrowRight'));
      expect(r.next.focusedIndex).toBe(9);
    });

    it('clears anchor on plain navigation', () => {
      const state: KeyNavState = { focusedIndex: 2, selectionStart: null, anchor: 1 };
      const r = processKeyDown(state, action('ArrowRight'));
      expect(r.next.anchor).toBe(null);
    });

    it('with Shift starts a selection and sets anchor', () => {
      const r = processKeyDown(initial, action('ArrowRight', { shiftKey: true }));
      expect(r.next.focusedIndex).toBe(1);
      expect(r.next.anchor).toBe(0);
      expect(r.select).toEqual([0, 1]);
      expect(r.announce).toEqual({ type: 'selection', from: 0, to: 1 });
    });

    it('with Shift extends selection from existing anchor', () => {
      const state: KeyNavState = { focusedIndex: 3, selectionStart: null, anchor: 1 };
      const r = processKeyDown(state, action('ArrowRight', { shiftKey: true }));
      expect(r.next.focusedIndex).toBe(4);
      expect(r.next.anchor).toBe(1);
      expect(r.select).toEqual([1, 4]);
    });
  });

  describe('ArrowLeft', () => {
    it('decrements focusedIndex', () => {
      const state: KeyNavState = { focusedIndex: 5, selectionStart: null, anchor: null };
      const r = processKeyDown(state, action('ArrowLeft'));
      expect(r.next.focusedIndex).toBe(4);
      expect(r.announce).toEqual({ type: 'point', index: 4 });
    });

    it('clamps at zero', () => {
      const r = processKeyDown(initial, action('ArrowLeft'));
      expect(r.next.focusedIndex).toBe(0);
    });

    it('with Shift selects backwards', () => {
      const state: KeyNavState = { focusedIndex: 5, selectionStart: null, anchor: null };
      const r = processKeyDown(state, action('ArrowLeft', { shiftKey: true }));
      expect(r.next.focusedIndex).toBe(4);
      expect(r.next.anchor).toBe(5);
      expect(r.select).toEqual([4, 5]);
    });
  });

  describe('Home / End', () => {
    it('Home jumps to index 0', () => {
      const state: KeyNavState = { focusedIndex: 7, selectionStart: null, anchor: 3 };
      const r = processKeyDown(state, action('Home'));
      expect(r.next.focusedIndex).toBe(0);
      expect(r.next.anchor).toBe(null);
      expect(r.announce).toEqual({ type: 'point', index: 0 });
    });

    it('End jumps to last index', () => {
      const r = processKeyDown(initial, action('End'));
      expect(r.next.focusedIndex).toBe(9);
      expect(r.announce).toEqual({ type: 'point', index: 9 });
    });
  });

  describe('Space (two-press selection)', () => {
    it('first press sets selectionStart', () => {
      const state: KeyNavState = { focusedIndex: 3, selectionStart: null, anchor: null };
      const r = processKeyDown(state, action(' '));
      expect(r.next.selectionStart).toBe(3);
      expect(r.select).toBe(null);
      expect(r.handled).toBe(true);
    });

    it('second press commits selection and clears selectionStart', () => {
      const state: KeyNavState = { focusedIndex: 7, selectionStart: 3, anchor: null };
      const r = processKeyDown(state, action(' '));
      expect(r.next.selectionStart).toBe(null);
      expect(r.next.anchor).toBe(null);
      expect(r.select).toEqual([3, 7]);
      expect(r.announce).toEqual({ type: 'selection', from: 3, to: 7 });
    });

    it('handles reversed selection (focus before start)', () => {
      const state: KeyNavState = { focusedIndex: 2, selectionStart: 8, anchor: null };
      const r = processKeyDown(state, action(' '));
      expect(r.select).toEqual([2, 8]);
    });
  });

  describe('Escape', () => {
    it('clears selectionStart and anchor, triggers reset', () => {
      const state: KeyNavState = { focusedIndex: 5, selectionStart: 2, anchor: 3 };
      const r = processKeyDown(state, action('Escape'));
      expect(r.next.selectionStart).toBe(null);
      expect(r.next.anchor).toBe(null);
      expect(r.reset).toBe(true);
      expect(r.announce).toEqual({ type: 'custom', text: 'Selection cleared' });
    });
  });

  describe('Enter', () => {
    it('confirms selection when anchor is set', () => {
      const state: KeyNavState = { focusedIndex: 5, selectionStart: null, anchor: 2 };
      const r = processKeyDown(state, action('Enter'));
      expect(r.next.anchor).toBe(null);
      expect(r.announce).toEqual({ type: 'custom', text: 'Selection confirmed' });
      expect(r.handled).toBe(true);
    });

    it('does nothing when no anchor', () => {
      const r = processKeyDown(initial, action('Enter'));
      expect(r.handled).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns handled=false for unknown keys', () => {
      const r = processKeyDown(initial, action('Tab'));
      expect(r.handled).toBe(false);
      expect(r.announce).toBe(null);
    });

    it('returns handled=false when dataLength is 0', () => {
      const r = processKeyDown(initial, action('ArrowRight', { dataLength: 0 }));
      expect(r.handled).toBe(false);
    });

    it('handles dataLength of 1', () => {
      const r = processKeyDown(initial, action('ArrowRight', { dataLength: 1 }));
      expect(r.next.focusedIndex).toBe(0);
      expect(r.handled).toBe(true);
    });
  });
});

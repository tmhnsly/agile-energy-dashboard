import { describe, it, expect } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('joins class names', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out undefined, null, and false', () => {
    expect(cx('a', undefined, 'b', null, false)).toBe('a b');
  });

  it('handles mixed truthy and falsy values', () => {
    const isActive = true;
    const isHidden = false;
    expect(cx('base', isActive && 'active', isHidden && 'hidden')).toBe('base active');
  });

  it('returns empty string when all values are falsy', () => {
    expect(cx(undefined, null, false)).toBe('');
  });

  it('handles a single class name', () => {
    expect(cx('only')).toBe('only');
  });
});

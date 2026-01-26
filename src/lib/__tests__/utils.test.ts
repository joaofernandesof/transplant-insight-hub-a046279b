import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (classNames utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle arrays and objects', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });

  it('should handle complex tailwind merging', () => {
    expect(cn('text-sm text-red-500', 'text-lg')).toBe('text-red-500 text-lg');
    expect(cn('p-4', 'p-2 m-2')).toBe('p-2 m-2');
  });
});

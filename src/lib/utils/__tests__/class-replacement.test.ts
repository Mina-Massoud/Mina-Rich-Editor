import { describe, it, expect } from 'vitest';
import {
  getClassCategory,
  getClassesInCategory,
  areSameCategory,
  replaceClassInCategory,
  getReplacementInfo,
  getCurrentClasses,
  mergeClasses,
} from '../class-replacement';

describe('getClassCategory', () => {
  it('returns correct category for known class (text-red-500 -> Text Color)', () => {
    expect(getClassCategory('text-red-500')).toBe('Text Color');
  });

  it('returns null for unknown class', () => {
    expect(getClassCategory('not-a-real-class')).toBeNull();
  });

  it('returns correct category for different categories', () => {
    expect(getClassCategory('font-bold')).toBe('Font Weight');
    expect(getClassCategory('bg-blue-100')).toBe('Background Color');
    expect(getClassCategory('text-center')).toBe('Text Alignment');
    expect(getClassCategory('p-4')).toBe('Padding');
  });
});

describe('getClassesInCategory', () => {
  it('returns array of classes for known category', () => {
    const classes = getClassesInCategory('Font Weight');
    expect(classes).toContain('font-bold');
    expect(classes).toContain('font-thin');
    expect(classes.length).toBeGreaterThan(0);
  });

  it('returns empty array for unknown category', () => {
    expect(getClassesInCategory('Nonexistent Category')).toEqual([]);
  });
});

describe('areSameCategory', () => {
  it('returns true for two classes in same category', () => {
    expect(areSameCategory('text-red-500', 'text-blue-500')).toBe(true);
  });

  it('returns false for classes in different categories', () => {
    expect(areSameCategory('text-red-500', 'font-bold')).toBe(false);
  });

  it('returns false when one class is unknown', () => {
    expect(areSameCategory('text-red-500', 'unknown-class')).toBe(false);
  });

  it('returns false when both classes are unknown', () => {
    expect(areSameCategory('unknown-a', 'unknown-b')).toBe(false);
  });
});

describe('replaceClassInCategory', () => {
  it('replaces existing class in same category', () => {
    const result = replaceClassInCategory('text-red-500 font-bold', 'text-blue-500');
    expect(result).toContain('text-blue-500');
    expect(result).not.toContain('text-red-500');
    expect(result).toContain('font-bold');
  });

  it('adds class when no same-category class exists', () => {
    const result = replaceClassInCategory('font-bold', 'text-red-500');
    expect(result).toContain('font-bold');
    expect(result).toContain('text-red-500');
  });

  it('handles empty currentClasses string', () => {
    expect(replaceClassInCategory('', 'text-red-500')).toBe('text-red-500');
  });

  it('adds unknown class without removing anything', () => {
    const result = replaceClassInCategory('font-bold text-red-500', 'my-custom-class');
    expect(result).toContain('font-bold');
    expect(result).toContain('text-red-500');
    expect(result).toContain('my-custom-class');
  });
});

describe('getReplacementInfo', () => {
  it('willReplace true when replacing same-category', () => {
    const info = getReplacementInfo('text-red-500 font-bold', 'text-blue-500');
    expect(info.willReplace).toBe(true);
  });

  it('willReplace false when no same-category class', () => {
    const info = getReplacementInfo('font-bold', 'text-red-500');
    expect(info.willReplace).toBe(false);
  });

  it('returns replaced classes list', () => {
    const info = getReplacementInfo('text-red-500 font-bold', 'text-blue-500');
    expect(info.replacedClasses).toEqual(['text-red-500']);
    expect(info.category).toBe('Text Color');
  });
});

describe('getCurrentClasses', () => {
  it('returns empty array for null/undefined', () => {
    expect(getCurrentClasses(null)).toEqual([]);
    expect(getCurrentClasses(undefined)).toEqual([]);
    expect(getCurrentClasses('')).toEqual([]);
  });
});

describe('mergeClasses', () => {
  it('replaces same-category class in existing className', () => {
    const result = mergeClasses('text-red-500 font-bold', 'text-blue-500');
    expect(result).toContain('text-blue-500');
    expect(result).not.toContain('text-red-500');
    expect(result).toContain('font-bold');
  });
});

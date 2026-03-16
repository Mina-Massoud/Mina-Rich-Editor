import { describe, it, expect } from 'vitest';
import { applyToSelectionRange, getInlineChildren } from '@/lib/reducer/selection-range';
import { InlineText } from '@/lib/types';

describe('applyToSelectionRange', () => {
  const identity = (child: InlineText) => child;
  const makeBold = (child: InlineText) => ({ ...child, bold: true });

  it('applies transform to entire single-segment text', () => {
    const children: InlineText[] = [{ content: 'Hello' }];
    const result = applyToSelectionRange(children, 0, 5, makeBold);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Hello');
    expect(result[0].bold).toBe(true);
  });

  it('splits a segment when selection is in the middle', () => {
    const children: InlineText[] = [{ content: 'Hello World' }];
    const result = applyToSelectionRange(children, 6, 11, makeBold);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ content: 'Hello ' });
    expect(result[1]).toEqual({ content: 'World', bold: true });
  });

  it('creates three segments when selection is in the middle of a word', () => {
    const children: InlineText[] = [{ content: 'Hello World' }];
    const result = applyToSelectionRange(children, 2, 8, makeBold);
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('He');
    expect(result[1].content).toBe('llo Wo');
    expect(result[1].bold).toBe(true);
    expect(result[2].content).toBe('rld');
  });

  it('handles selection across multiple segments', () => {
    const children: InlineText[] = [
      { content: 'Hello ' },
      { content: 'Beautiful ' },
      { content: 'World' },
    ];
    // Select "Beautiful " (positions 6-16)
    const result = applyToSelectionRange(children, 6, 16, makeBold);
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Hello ');
    expect(result[0].bold).toBeUndefined();
    expect(result[1].content).toBe('Beautiful ');
    expect(result[1].bold).toBe(true);
    expect(result[2].content).toBe('World');
    expect(result[2].bold).toBeUndefined();
  });

  it('handles selection spanning partial segments', () => {
    const children: InlineText[] = [
      { content: 'AAA' },
      { content: 'BBB' },
      { content: 'CCC' },
    ];
    // Select from middle of A to middle of C (positions 1-7)
    const result = applyToSelectionRange(children, 1, 7, makeBold);
    // A splits: "A" + "AA"(bold), B all bold, C splits: "C"(bold) + "CC"
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ content: 'A' });
    expect(result[1]).toEqual({ content: 'AA', bold: true });
    expect(result[2]).toEqual({ content: 'BBB', bold: true });
    expect(result[3]).toEqual({ content: 'C', bold: true });
    expect(result[4]).toEqual({ content: 'CC' });
  });

  it('preserves existing formatting on non-overlapping segments', () => {
    const children: InlineText[] = [
      { content: 'Bold', bold: true },
      { content: ' Normal' },
    ];
    const result = applyToSelectionRange(children, 0, 4, (child) => ({
      ...child,
      italic: true,
    }));
    expect(result[0].bold).toBe(true);
    expect(result[0].italic).toBe(true);
    expect(result[1].bold).toBeUndefined();
  });

  it('returns copies even when no overlap', () => {
    const children: InlineText[] = [{ content: 'Hello' }];
    const result = applyToSelectionRange(children, 10, 20, identity);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ content: 'Hello' });
    expect(result[0]).not.toBe(children[0]); // New object
  });

  it('handles empty selection (start === end)', () => {
    const children: InlineText[] = [{ content: 'Hello' }];
    const result = applyToSelectionRange(children, 3, 3, makeBold);
    // Zero-width selection still splits at the boundary but produces empty content for the overlap
    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Hel');
    expect(result[1].content).toBe(''); // Zero-width overlap
    expect(result[1].bold).toBe(true);
    expect(result[2].content).toBe('lo');
  });
});

describe('getInlineChildren', () => {
  it('returns existing inline children when available', () => {
    const existing: InlineText[] = [{ content: 'Test', bold: true }];
    const result = getInlineChildren(existing, true, 'fallback', 'selection');
    expect(result).toBe(existing);
  });

  it('wraps plain content as inline children', () => {
    const result = getInlineChildren(undefined, false, 'Hello', undefined);
    expect(result).toEqual([{ content: 'Hello' }]);
  });

  it('uses selection text when content is empty', () => {
    const result = getInlineChildren(undefined, false, undefined, 'Selected');
    expect(result).toEqual([{ content: 'Selected' }]);
  });

  it('returns empty content as fallback', () => {
    const result = getInlineChildren(undefined, false, undefined, undefined);
    expect(result).toEqual([{ content: '' }]);
  });
});

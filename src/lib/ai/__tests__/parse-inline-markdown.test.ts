import { describe, it, expect } from 'vitest';
import { parseInlineMarkdown, hasInlineFormatting } from '../stream-to-blocks';

describe('parseInlineMarkdown', () => {
  it('returns plain text segment for plain input', () => {
    expect(parseInlineMarkdown('hello world')).toEqual([{ content: 'hello world' }]);
  });

  it('parses **bold** markers', () => {
    expect(parseInlineMarkdown('**bold**')).toEqual([{ content: 'bold', bold: true }]);
  });

  it('parses *italic* markers', () => {
    expect(parseInlineMarkdown('*italic*')).toEqual([{ content: 'italic', italic: true }]);
  });

  it('parses `code` markers', () => {
    expect(parseInlineMarkdown('`code`')).toEqual([{ content: 'code', code: true }]);
  });

  it('parses ~~strikethrough~~ markers', () => {
    expect(parseInlineMarkdown('~~struck~~')).toEqual([{ content: 'struck', strikethrough: true }]);
  });

  it('handles mixed formatting in a single string', () => {
    const result = parseInlineMarkdown('hello **bold** and *italic* text');
    expect(result).toEqual([
      { content: 'hello ' },
      { content: 'bold', bold: true },
      { content: ' and ' },
      { content: 'italic', italic: true },
      { content: ' text' },
    ]);
  });

  it('handles empty string', () => {
    expect(parseInlineMarkdown('')).toEqual([{ content: '' }]);
  });

  it('returns plain segment when no markers match', () => {
    expect(parseInlineMarkdown('no formatting here')).toEqual([{ content: 'no formatting here' }]);
  });

  it('handles multiple bold segments', () => {
    const result = parseInlineMarkdown('**a** and **b**');
    expect(result).toEqual([
      { content: 'a', bold: true },
      { content: ' and ' },
      { content: 'b', bold: true },
    ]);
  });

  it('handles code and bold together', () => {
    const result = parseInlineMarkdown('use `parseInlineMarkdown` for **rich** text');
    expect(result).toEqual([
      { content: 'use ' },
      { content: 'parseInlineMarkdown', code: true },
      { content: ' for ' },
      { content: 'rich', bold: true },
      { content: ' text' },
    ]);
  });
});

describe('hasInlineFormatting', () => {
  it('returns true for bold', () => {
    expect(hasInlineFormatting('some **bold** text')).toBe(true);
  });

  it('returns true for italic', () => {
    expect(hasInlineFormatting('some *italic* text')).toBe(true);
  });

  it('returns true for code', () => {
    expect(hasInlineFormatting('some `code` text')).toBe(true);
  });

  it('returns true for strikethrough', () => {
    expect(hasInlineFormatting('some ~~struck~~ text')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(hasInlineFormatting('no formatting here')).toBe(false);
  });
});

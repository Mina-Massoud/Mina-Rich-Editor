import { describe, it, expect } from 'vitest';
import { parseMarkdownTable, isMarkdownTable } from '../markdown-table-parser';

const VALID_TABLE = `| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |`;

const THREE_COL_TABLE = `| A | B | C |
|---|---|---|
| 1 | 2 | 3 |`;

const HEADER_ONLY_TABLE = `| H1 | H2 |
|----|----|`;

describe('parseMarkdownTable', () => {
  it('parses valid 2-column table', () => {
    const result = parseMarkdownTable(VALID_TABLE);
    expect(result.success).toBe(true);
    expect(result.table).toBeDefined();
  });

  it('parses table with 3+ columns', () => {
    const result = parseMarkdownTable(THREE_COL_TABLE);
    expect(result.success).toBe(true);
    expect(result.table).toBeDefined();
  });

  it('trims cell content', () => {
    const table = `|  Name  |  Age  |
|--------|-------|
|  Alice |  30   |`;
    const result = parseMarkdownTable(table);
    expect(result.success).toBe(true);
    // Check header cells are trimmed
    const thead = result.table!.children[0]; // thead
    const headerRow = (thead as any).children[0]; // tr
    expect(headerRow.children[0].content).toBe('Name');
    expect(headerRow.children[1].content).toBe('Age');
  });

  it('creates correct structure (table > thead/tbody > tr > th/td)', () => {
    const result = parseMarkdownTable(VALID_TABLE);
    const table = result.table!;
    expect(table.type).toBe('table');
    expect(table.children).toHaveLength(2); // thead, tbody

    const thead = table.children[0] as any;
    expect(thead.type).toBe('thead');
    expect(thead.children).toHaveLength(1); // 1 header row

    const tbody = table.children[1] as any;
    expect(tbody.type).toBe('tbody');
    expect(tbody.children).toHaveLength(2); // 2 body rows
  });

  it('header cells have type "th"', () => {
    const result = parseMarkdownTable(VALID_TABLE);
    const thead = result.table!.children[0] as any;
    const headerRow = thead.children[0];
    for (const cell of headerRow.children) {
      expect(cell.type).toBe('th');
    }
  });

  it('body cells have type "td"', () => {
    const result = parseMarkdownTable(VALID_TABLE);
    const tbody = result.table!.children[1] as any;
    for (const row of tbody.children) {
      for (const cell of (row as any).children) {
        expect(cell.type).toBe('td');
      }
    }
  });

  it('handles table with no body rows (just header + separator)', () => {
    const result = parseMarkdownTable(HEADER_ONLY_TABLE);
    expect(result.success).toBe(true);
    const tbody = result.table!.children[1] as any;
    expect(tbody.children).toHaveLength(0);
  });

  it('error: less than 2 lines', () => {
    const result = parseMarkdownTable('| only one line |');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('error: header does not start with pipe', () => {
    const result = parseMarkdownTable(`No pipe here
|---|---|`);
    expect(result.success).toBe(false);
  });

  it('error: no separator row', () => {
    const result = parseMarkdownTable(`| A | B |
| C | D |`);
    // The second line has no dashes pattern - but the current implementation
    // checks for '-' which is present in '|'. Let's check what actually happens.
    // Actually "| C | D |" doesn't contain "---" but does contain "-" ? No it doesn't.
    // It doesn't contain '-' at all, so it should fail.
    expect(result.success).toBe(false);
  });

  it('error: column count mismatch', () => {
    const result = parseMarkdownTable(`| A | B |
|---|---|
| C | D | E |`);
    expect(result.success).toBe(false);
    expect(result.error).toContain('columns');
  });

  it('error: empty header (no columns)', () => {
    // "||" splits to ["", "", ""], slice(1,-1) gives [""] which has length 1
    // so it actually parses as a single empty-string column. Use a truly empty line.
    const result = parseMarkdownTable(`|
|-|`);
    expect(result.success).toBe(false);
  });
});

describe('isMarkdownTable', () => {
  it('returns true for valid table', () => {
    expect(isMarkdownTable(VALID_TABLE)).toBe(true);
  });

  it('returns false for less than 2 lines', () => {
    expect(isMarkdownTable('| only one line |')).toBe(false);
  });

  it('returns false for no pipes', () => {
    expect(isMarkdownTable('no pipes here\nalso no pipes')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isMarkdownTable('')).toBe(false);
  });
});

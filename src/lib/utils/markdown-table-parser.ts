/**
 * Markdown Table Parser
 * 
 * Converts markdown table syntax to editor table structure
 */

import { StructuralNode, TextNode } from "../types";

/**
 * Parse markdown table string into table structure
 * 
 * @example
 * ```
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 * ```
 */
export function parseMarkdownTable(markdown: string): {
  success: boolean;
  table?: StructuralNode;
  error?: string;
} {
  try {
    // Split into lines and remove empty lines
    const lines = markdown
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        error: "Table must have at least a header row and separator row",
      };
    }

    // Parse header row
    const headerLine = lines[0];
    if (!headerLine.startsWith('|') || !headerLine.endsWith('|')) {
      return {
        success: false,
        error: "Table rows must start and end with |",
      };
    }

    const headerCells = headerLine
      .split('|')
      .slice(1, -1) // Remove first and last empty strings
      .map(cell => cell.trim());

    if (headerCells.length === 0) {
      return {
        success: false,
        error: "Header row must have at least one column",
      };
    }

    // Check separator row
    const separatorLine = lines[1];
    if (!separatorLine.includes('---') && !separatorLine.includes('-')) {
      return {
        success: false,
        error: "Second row must be a separator (e.g., |---|---|)",
      };
    }

    // Parse body rows
    const bodyLines = lines.slice(2);
    const numCols = headerCells.length;

    // Validate all rows have same number of columns
    for (let i = 0; i < bodyLines.length; i++) {
      const cells = bodyLines[i]
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim());
      
      if (cells.length !== numCols) {
        return {
          success: false,
          error: `Row ${i + 3} has ${cells.length} columns, expected ${numCols}`,
        };
      }
    }

    const timestamp = Date.now();

    // Create header cells
    const headerCellNodes: TextNode[] = headerCells.map((content, idx) => ({
      id: `th-${timestamp}-${idx}`,
      type: "th",
      content: content || "",
      attributes: {},
    }));

    // Create header row
    const headerRow: StructuralNode = {
      id: `tr-header-${timestamp}`,
      type: "tr",
      children: headerCellNodes,
      attributes: {},
    };

    // Create thead
    const thead: StructuralNode = {
      id: `thead-${timestamp}`,
      type: "thead",
      children: [headerRow],
      attributes: {},
    };

    // Create body rows
    const bodyRows: StructuralNode[] = bodyLines.map((line, rowIdx) => {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim());

      const cellNodes: TextNode[] = cells.map((content, colIdx) => ({
        id: `td-${timestamp}-${rowIdx}-${colIdx}`,
        type: "td",
        content: content || "",
        attributes: {},
      }));

      return {
        id: `tr-${timestamp}-${rowIdx}`,
        type: "tr",
        children: cellNodes,
        attributes: {},
      };
    });

    // Create tbody
    const tbody: StructuralNode = {
      id: `tbody-${timestamp}`,
      type: "tbody",
      children: bodyRows,
      attributes: {},
    };

    // Create table
    const table: StructuralNode = {
      id: `table-${timestamp}`,
      type: "table",
      children: [thead, tbody],
      attributes: {},
    };

    return {
      success: true,
      table,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse markdown table",
    };
  }
}

/**
 * Validate if string looks like a markdown table
 */
export function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) return false;
  
  // Check if first line has pipes
  if (!lines[0].includes('|')) return false;
  
  // Check if second line is separator
  const secondLine = lines[1];
  return secondLine.includes('---') || (secondLine.includes('-') && secondLine.includes('|'));
}


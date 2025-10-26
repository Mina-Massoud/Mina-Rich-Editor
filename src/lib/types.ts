/**
 * Mina Rich Editor - Core Type Definitions
 * 
 * A flexible, type-safe document model for building rich text editors.
 * Supports nested containers, various node types, and dynamic attributes.
 * 
 * @packageDocumentation
 */

/**
 * Supported node types for the editor.
 * Can be extended for custom node types via plugins.
 */
export type NodeType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'blockquote'
  | 'ol'
  | 'li'
  | 'code'
  | 'pre'
  | 'img'
  | 'video'
  | 'audio'
  | 'a'
  | 'span'
  | 'div'
  | 'hr'
  | 'br'
  | 'table'
  | 'thead'
  | 'tbody'
  | 'tr'
  | 'th'
  | 'td'
  | 'container'
  | 'text';

/**
 * Dynamic attributes that can be attached to any node.
 * Allows for custom styling, classes, data attributes, etc.
 * 
 * Special formatting attributes:
 * - bold: boolean - makes text bold
 * - italic: boolean - makes text italic
 * - underline: boolean - makes text underlined
 * - strikethrough: boolean - makes text strikethrough
 * - code: boolean - makes text inline code
 * - styles: Record<string, string> - inline CSS styles (e.g., { width: '50%' })
 * 
 * @example
 * ```typescript
 * const attributes: NodeAttributes = {
 *   bold: true,
 *   italic: true,
 *   className: 'text-blue-500',
 *   href: 'https://example.com',
 *   styles: { width: '75%' },
 * };
 * ```
 */
export interface NodeAttributes {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  styles?: Record<string, string>;
  [key: string]: string | number | boolean | Record<string, string> | undefined;
}

/**
 * Base interface for all editor nodes.
 * Every node must have an id, type, and attributes.
 */
export interface BaseNode {
  /** Unique identifier for the node (used for updates, deletion, etc.) */
  id: string;
  
  /** The type of node (h1, p, img, container, etc.) */
  type: NodeType;
  
  /** Dynamic attributes (className, style, href, src, etc.) */
  attributes?: NodeAttributes;
}

/**
 * Inline text segment with its own formatting
 */
export interface InlineText {
  content: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  // Inline element type (for text that should render as p, h1, h2, etc. within a paragraph)
  // Note: 'code' is not included here - use the 'code' boolean property for inline code formatting
  elementType?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li' | 'blockquote';
  // Link URL (makes the text a clickable link)
  href?: string;
  // Custom Tailwind CSS classes
  className?: string;
  // Inline CSS styles (e.g., { fontSize: '24px', color: '#ff0000' })
  styles?: Record<string, string>;
}

/**
 * A single line of content within a block.
 * Can contain either plain text or inline formatted children.
 */
export interface BlockLine {
  /** Plain text content (if no formatting) */
  content?: string;
  /** Inline children with formatting */
  children?: InlineText[];
}

/**
 * Text content node - represents actual content/text.
 * Can be simple text, have inline children with formatting, OR have multiple lines.
 * 
 * @example Simple text (no formatting):
 * ```typescript
 * const textNode: TextNode = {
 *   id: 'p-1',
 *   type: 'p',
 *   content: 'Hello, world!',
 * };
 * ```
 * 
 * @example Block with inline children (rich formatting):
 * ```typescript
 * const paragraph: TextNode = {
 *   id: 'p-1',
 *   type: 'p',
 *   children: [
 *     { content: 'Hello ', bold: false },
 *     { content: 'world', bold: true },
 *     { content: '!', bold: false }
 *   ]
 * };
 * ```
 * 
 * @example Block with multiple lines (e.g., ordered list):
 * ```typescript
 * const listItem: TextNode = {
 *   id: 'li-1',
 *   type: 'li',
 *   lines: [
 *     { content: 'First item' },
 *     { content: 'Second item' },
 *     { content: 'Third item' }
 *   ]
 * };
 * ```
 */
export interface TextNode extends BaseNode {
  type: Exclude<NodeType, 'container'>;
  
  /** The actual text content (used when no inline formatting and single line) */
  content?: string;
  
  /** Inline children with individual formatting (used for rich text, single line) */
  children?: InlineText[];
  
  /** Multiple lines of content (used for multi-line blocks like ordered lists) */
  lines?: BlockLine[];
}

/**
 * Container node - can have children nodes (nested structure).
 * Allows building complex document trees.
 * 
 * @example
 * ```typescript
 * const container: ContainerNode = {
 *   id: 'root',
 *   type: 'container',
 *   children: [
 *     { id: 'h1-1', type: 'h1', content: 'Title' },
 *     { id: 'p-1', type: 'p', content: 'Paragraph' },
 *     {
 *       id: 'nested',
 *       type: 'container',
 *       children: [...]
 *     }
 *   ]
 * };
 * ```
 */
export interface ContainerNode extends BaseNode {
  type: 'container';
  
  /** Child nodes (can be TextNode or ContainerNode) */
  children: EditorNode[];
}

/**
 * Structural node - similar to container but for specific structures like tables
 * Can have children nodes for table elements (thead, tbody, tr)
 */
export interface StructuralNode extends BaseNode {
  type: 'table' | 'thead' | 'tbody' | 'tr';
  
  /** Child nodes */
  children: EditorNode[];
}

/**
 * Union type representing any node in the editor.
 */
export type EditorNode = TextNode | ContainerNode | StructuralNode;

/**
 * Information about the current text selection
 */
export interface SelectionInfo {
  /** The selected text */
  text: string;
  
  /** Start position in the text content */
  start: number;
  
  /** End position in the text content */
  end: number;
  
  /** ID of the node containing the selection */
  nodeId: string;
  
  /** Active formatting styles on the selection */
  formats: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    code: boolean;
  };
  
  /** Active element type on the selection (if all selected text has the same type) */
  elementType?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'code' | 'blockquote' | 'li' | 'ol' | null;
  
  /** Active link href on the selection (if all selected text has the same href) */
  href?: string | null;
  
  /** Active custom class on the selection (if all selected text has the same class) */
  className?: string | null;
  
  /** Active inline styles on the selection (if all selected text has the same styles) */
  styles?: Record<string, string> | null;
}

/**
 * Cover image configuration for the document
 */
export interface CoverImage {
  /** URL of the cover image */
  url: string;
  
  /** Alt text for accessibility */
  alt?: string;
  
  /** Vertical position (0-100) for image positioning */
  position?: number;
}

/**
 * The root document state for the editor.
 * Contains metadata, the root container, UI state, and history for undo/redo.
 */
export interface EditorState {
  /** Schema version for future migrations */
  version: string;
  
  /** History stack of container states for undo/redo */
  history: ContainerNode[];
  
  /** Current position in the history stack */
  historyIndex: number;
  
  /** Currently active/focused node ID */
  activeNodeId: string | null;
  
  /** Whether there is an active text selection */
  hasSelection: boolean;
  
  /** Selection key to trigger re-renders when selection changes */
  selectionKey: number;
  
  /** Current selection information (null if no selection) */
  currentSelection: SelectionInfo | null;
  
  /** Set of block IDs that are currently selected (for multi-block operations like Ctrl+A) */
  selectedBlocks: Set<string>;
  
  /** Cover image for the document (like Notion) */
  coverImage: CoverImage | null;
  
  /** Optional metadata (created date, last modified, author, etc.) */
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
  };
}

/**
 * Type guard to check if a node is a ContainerNode.
 * 
 * @param node - The node to check
 * @returns True if node is a ContainerNode
 * 
 * @example
 * ```typescript
 * if (isContainerNode(node)) {
 *   console.log(node.children.length);
 * }
 * ```
 */
export function isContainerNode(node: EditorNode): node is ContainerNode {
  return node.type === 'container';
}

/**
 * Type guard to check if a node is a StructuralNode (table, thead, tbody, tr).
 * 
 * @param node - The node to check
 * @returns True if node is a StructuralNode
 */
export function isStructuralNode(node: EditorNode): node is StructuralNode {
  return node.type === 'table' || node.type === 'thead' || node.type === 'tbody' || node.type === 'tr';
}

/**
 * Type guard to check if a node is a TextNode.
 * 
 * @param node - The node to check
 * @returns True if node is a TextNode
 * 
 * @example
 * ```typescript
 * if (isTextNode(node)) {
 *   console.log(node.content);
 * }
 * ```
 */
export function isTextNode(node: EditorNode): node is TextNode {
  return node.type !== 'container' && !isStructuralNode(node);
}

/**
 * Type guard to check if a node has inline children (rich text).
 * 
 * @param node - The node to check
 * @returns True if node has inline children
 * 
 * @example
 * ```typescript
 * if (hasInlineChildren(node)) {
 *   console.log(node.children); // Array of inline text segments
 * }
 * ```
 */
export function hasInlineChildren(node: EditorNode): node is TextNode & { children: InlineText[] } {
  return isTextNode(node) && Array.isArray((node as TextNode).children) && (node as TextNode).children!.length > 0;
}

/**
 * Get the text content of a node (whether simple or with inline children).
 * 
 * @param node - The node to extract text from
 * @returns The full text content
 * 
 * @example
 * ```typescript
 * const text = getNodeTextContent(node); // "Hello world!"
 * ```
 */
export function getNodeTextContent(node: TextNode): string {
  // If node has multiple lines, join them with newlines
  if (node.lines && node.lines.length > 0) {
    return node.lines
      .map(line => {
        if (line.children && line.children.length > 0) {
          return line.children.map(child => child.content).join('');
        }
        return line.content || '';
      })
      .join('\n');
  }
  
  // If node has inline children (single line with formatting)
  if (hasInlineChildren(node)) {
    return node.children!.map(child => child.content).join('');
  }
  
  // Simple content (single line, no formatting)
  return node.content || '';
}


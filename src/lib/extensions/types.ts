/**
 * Mina Extension System — Type Definitions
 *
 * TipTap-inspired extension API built natively on Mina's architecture.
 * Supports three extension types:
 *   - Extension.create() → functional extensions (History, Collaboration, AI)
 *   - Node.create()      → block types (Heading, Paragraph, Image, Table)
 *   - Mark.create()      → inline formatting (Bold, Italic, Link, Code)
 */

import type { TextNode, EditorState, EditorNode, InlineText, ContainerNode } from '../types';
import type { EditorAction } from '../reducer/actions';

// ─── Context passed to extension hooks ───────────────────────────────────────

/** Context provided to extension commands and lifecycle hooks. */
export interface ExtensionContext {
  /** Current editor state (read-only snapshot). */
  state: EditorState;
  /** Dispatch an action to mutate editor state. */
  dispatch: (action: EditorAction) => void;
  /** Access the current document container. */
  getContainer: () => ContainerNode;
  /** Access extension storage. */
  storage: Record<string, any>;
}

/** Context provided to commands, extends base context with chainable helpers. */
export interface CommandContext extends ExtensionContext {
  /** The registered commands from all extensions. */
  commands: Record<string, (...args: any[]) => boolean>;
}

// ─── Command types ───────────────────────────────────────────────────────────

/** A command function that returns true if it was applied successfully. */
export type CommandFunction = (...args: any[]) => (context: CommandContext) => boolean;

// ─── Keyboard shortcut types ─────────────────────────────────────────────────

/** Handler for a keyboard shortcut. Return true to prevent default behavior. */
export type ShortcutHandler = (context: ExtensionContext) => boolean;

// ─── Input rule types ────────────────────────────────────────────────────────

/** An input rule that matches text patterns and applies transformations. */
export interface InputRule {
  /** Regex pattern to match against the current text. Use $ anchor for end-of-line. */
  find: RegExp;
  /** Handler called when pattern matches. Return true if handled. */
  handler: (match: RegExpMatchArray, context: ExtensionContext) => boolean;
}

// ─── HTML parse/render rules ─────────────────────────────────────────────────

/** Rule for parsing HTML elements into Mina nodes or marks. */
export interface ParseRule {
  /** CSS selector or tag name to match (e.g., 'strong', 'h1', 'img[src]'). */
  tag?: string;
  /** CSS style property to match (e.g., 'font-weight=bold'). */
  style?: string;
  /** Extract attributes from the DOM element. */
  getAttrs?: (element: HTMLElement) => Record<string, any> | null;
  /** Priority for conflicting rules (higher wins). */
  priority?: number;
}

/** Spec for a node/mark attribute with defaults and serialization. */
export interface AttributeSpec {
  /** Default value when not specified. */
  default?: any;
  /** Extract attribute from HTML during parsing. */
  parseHTML?: (element: HTMLElement) => any;
  /** Render attribute to HTML attributes. */
  renderHTML?: (value: any) => Record<string, string> | null;
}

// ─── Slash command (for CommandMenu integration) ─────────────────────────────

/** Describes a slash command entry in the command palette. */
export interface SlashCommand {
  /** Display label in the menu. */
  label: string;
  /** Optional description shown below the label. */
  description?: string;
  /** Keywords for search filtering. */
  keywords?: string[];
  /** Icon component (React element). */
  icon?: React.ReactNode;
  /** Command to execute when selected. */
  action: (context: ExtensionContext) => void;
  /** Group for organizing commands (e.g., 'text', 'media', 'advanced'). */
  group?: string;
}

// ─── Block rendering props ───────────────────────────────────────────────────

/** Props passed to custom block renderers. */
export interface BlockRenderProps {
  node: TextNode;
  isActive: boolean;
  isReadOnly: boolean;
  onUpdate: (content: string) => void;
}

// ─── Base extension config ───────────────────────────────────────────────────

/** Configuration object passed to Extension.create(). */
export interface ExtensionConfig {
  /** Unique name for this extension. */
  name: string;
  /** Load priority (higher loads first, default: 100). */
  priority?: number;

  // ── Configuration ──
  /** Define configurable options for this extension. */
  addOptions?: () => Record<string, any>;
  /** Define mutable storage for this extension. */
  addStorage?: () => Record<string, any>;

  // ── Commands ──
  /** Register commands that can be called via editor.commands.name(). */
  addCommands?: () => Record<string, CommandFunction>;

  // ── Keyboard shortcuts ──
  /** Map key combinations to handlers (e.g., 'Mod-b' → toggle bold). */
  addKeyboardShortcuts?: () => Record<string, ShortcutHandler>;

  // ── Input rules ──
  /** Pattern-based text transformations during typing. */
  addInputRules?: () => InputRule[];

  // ── Slash commands ──
  /** Register entries in the slash command palette. */
  addSlashCommands?: () => SlashCommand[];

  // ── Lifecycle hooks ──
  onCreate?: (context: ExtensionContext) => void;
  onUpdate?: (context: ExtensionContext) => void;
  onSelectionUpdate?: (context: ExtensionContext) => void;
  onDestroy?: () => void;
}

/** Configuration object passed to Node.create(). */
export interface NodeExtensionConfig extends ExtensionConfig {
  /** The node type string (e.g., 'h1', 'p', 'img'). Maps to EditorNode.type. */
  nodeType: string | string[];
  /** Node group for content rules. */
  group?: 'block' | 'inline' | 'structural';
  /** Whether the node can be dragged. */
  draggable?: boolean;

  // ── HTML round-trip ──
  /** How to recognize this node in pasted/imported HTML. */
  parseHTML?: () => ParseRule[];
  /** How to serialize this node to semantic HTML. */
  renderHTML?: (node: TextNode) => string;

  // ── React rendering ──
  /** Custom React component to render this block. */
  renderBlock?: (props: BlockRenderProps) => React.ReactNode;

  // ── Attributes ──
  /** Define custom attributes for this node type. */
  addAttributes?: () => Record<string, AttributeSpec>;

  // ── Styles ──
  /** CSS class string for this node type (replaces hardcoded getTypeClassName). */
  addStyles?: () => string;
}

/** Configuration object passed to Mark.create(). */
export interface MarkExtensionConfig extends ExtensionConfig {
  /** The mark name (e.g., 'bold', 'italic', 'link'). */
  markName: string;
  /** Which InlineText property this mark maps to (e.g., 'bold', 'href'). */
  inlineProperty: keyof InlineText;

  // ── HTML round-trip ──
  /** How to recognize this mark in pasted/imported HTML. */
  parseHTML?: () => ParseRule[];
  /** How to render this mark to HTML tag (e.g., returns '<strong>'). */
  renderHTML?: (attrs?: Record<string, any>) => string;

  // ── Attributes ──
  /** Define custom attributes for this mark. */
  addAttributes?: () => Record<string, AttributeSpec>;
}

// ─── Resolved extension instances ────────────────────────────────────────────

/** A resolved extension instance with type discriminator. */
export interface ResolvedExtension {
  kind: 'extension';
  name: string;
  priority: number;
  config: ExtensionConfig;
  options: Record<string, any>;
  storage: Record<string, any>;
}

/** A resolved node extension instance. */
export interface ResolvedNodeExtension {
  kind: 'node';
  name: string;
  priority: number;
  config: NodeExtensionConfig;
  options: Record<string, any>;
  storage: Record<string, any>;
  /** All node type strings this extension handles. */
  nodeTypes: string[];
}

/** A resolved mark extension instance. */
export interface ResolvedMarkExtension {
  kind: 'mark';
  name: string;
  priority: number;
  config: MarkExtensionConfig;
  options: Record<string, any>;
  storage: Record<string, any>;
}

/** Union of all resolved extension types. */
export type AnyResolvedExtension = ResolvedExtension | ResolvedNodeExtension | ResolvedMarkExtension;

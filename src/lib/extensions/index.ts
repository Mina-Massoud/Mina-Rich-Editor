/**
 * Mina Extension System
 *
 * Build custom extensions for the Mina Rich Editor.
 *
 * @example
 * ```typescript
 * import { Extension, Node, Mark, ExtensionManager } from '@mina-editor/core';
 *
 * const MyMark = Mark.create({
 *   name: 'highlight',
 *   markName: 'highlight',
 *   inlineProperty: 'className',
 *   renderHTML() { return '<mark>'; },
 * });
 *
 * const manager = new ExtensionManager();
 * manager.register(MyMark);
 * ```
 */

export { Extension } from './Extension';
export { Node } from './Node';
export { Mark } from './Mark';
export { ExtensionManager } from './ExtensionManager';
export { CommandManager, CommandChain } from './CommandManager';
export { StarterKit } from './starter-kit';

// Built-in node extensions
export {
  Paragraph,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Blockquote, CodeBlock, BulletList, OrderedList,
  HorizontalRule, Image, Video, Table, Divider,
} from './nodes';

// Built-in mark extensions
export {
  Bold, Italic, Underline, Strikethrough, InlineCode, Link,
} from './marks';

export type {
  // Config types (what users pass to .create())
  ExtensionConfig,
  NodeExtensionConfig,
  MarkExtensionConfig,

  // Resolved types (what .create() returns)
  ResolvedExtension,
  ResolvedNodeExtension,
  ResolvedMarkExtension,
  AnyResolvedExtension,

  // Hook types
  ExtensionContext,
  CommandContext,
  CommandFunction,
  ShortcutHandler,
  InputRule,
  SlashCommand,
  ParseRule,
  AttributeSpec,
  BlockRenderProps,
} from './types';

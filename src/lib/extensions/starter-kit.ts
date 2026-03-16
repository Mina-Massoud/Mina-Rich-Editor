/**
 * Mina Rich Editor - StarterKit
 *
 * A pre-bundled array of all built-in node and mark extensions.
 * Pass this to ExtensionManager (or to the Editor component's `extensions` prop)
 * to get full default functionality out of the box.
 *
 * @example
 * ```typescript
 * import { ExtensionManager } from './ExtensionManager';
 * import { StarterKit } from './starter-kit';
 *
 * const manager = new ExtensionManager(StarterKit);
 * ```
 */

import { Paragraph } from './nodes/paragraph';
import { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from './nodes/heading';
import { Blockquote } from './nodes/blockquote';
import { CodeBlock } from './nodes/code-block';
import { BulletList, OrderedList } from './nodes/list-item';
import { HorizontalRule } from './nodes/horizontal-rule';
import { Image as ImageNode } from './nodes/image';
import { Video as VideoNode } from './nodes/video';
import { Table as TableNode } from './nodes/table';
import { Divider } from './nodes/divider';
import { Bold } from './marks/bold';
import { Italic } from './marks/italic';
import { Underline } from './marks/underline';
import { Strikethrough } from './marks/strikethrough';
import { InlineCode } from './marks/code';
import { Link } from './marks/link';
import type { AnyResolvedExtension } from './types';

export const StarterKit: AnyResolvedExtension[] = [
  // Nodes
  Paragraph,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Blockquote,
  CodeBlock,
  BulletList,
  OrderedList,
  HorizontalRule,
  ImageNode,
  VideoNode,
  TableNode,
  Divider,
  // Marks
  Bold,
  Italic,
  Underline,
  Strikethrough,
  InlineCode,
  Link,
];

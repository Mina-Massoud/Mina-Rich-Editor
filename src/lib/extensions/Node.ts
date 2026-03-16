/**
 * Node.create() — Factory for block-type extensions.
 *
 * Node extensions define new block types (headings, paragraphs, images, etc.)
 * and how they render, serialize, and parse from HTML.
 *
 * @example
 * ```typescript
 * const Heading = Node.create({
 *   name: 'heading',
 *   nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
 *   group: 'block',
 *   addStyles() { return 'text-4xl font-bold'; },
 *   addKeyboardShortcuts() {
 *     return { 'Mod-Alt-1': (ctx) => ctx.commands.setHeading({ level: 1 }) };
 *   },
 * });
 * ```
 */

import type { NodeExtensionConfig, ResolvedNodeExtension } from './types';

export const Node = {
  /**
   * Create a node extension from a config object.
   * Returns a resolved node extension instance ready for registration.
   */
  create(config: NodeExtensionConfig): ResolvedNodeExtension {
    const nodeTypes = Array.isArray(config.nodeType)
      ? config.nodeType
      : [config.nodeType];

    return {
      kind: 'node',
      name: config.name,
      priority: config.priority ?? 100,
      config,
      options: config.addOptions?.() ?? {},
      storage: config.addStorage?.() ?? {},
      nodeTypes,
    };
  },
};

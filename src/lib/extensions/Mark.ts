/**
 * Mark.create() — Factory for inline formatting extensions.
 *
 * Mark extensions define inline formatting (bold, italic, link, code, etc.)
 * and map to InlineText properties in Mina's document model.
 *
 * @example
 * ```typescript
 * const Bold = Mark.create({
 *   name: 'bold',
 *   markName: 'bold',
 *   inlineProperty: 'bold',
 *   parseHTML() {
 *     return [{ tag: 'strong' }, { tag: 'b' }, { style: 'font-weight=bold' }];
 *   },
 *   renderHTML() { return '<strong>'; },
 *   addKeyboardShortcuts() {
 *     return { 'Mod-b': (ctx) => ctx.commands.toggleBold() };
 *   },
 * });
 * ```
 */

import type { MarkExtensionConfig, ResolvedMarkExtension } from './types';

export const Mark = {
  /**
   * Create a mark extension from a config object.
   * Returns a resolved mark extension instance ready for registration.
   */
  create(config: MarkExtensionConfig): ResolvedMarkExtension {
    return {
      kind: 'mark',
      name: config.name,
      priority: config.priority ?? 100,
      config,
      options: config.addOptions?.() ?? {},
      storage: config.addStorage?.() ?? {},
    };
  },
};

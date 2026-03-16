/**
 * Extension.create() — Factory for functional extensions.
 *
 * Functional extensions add behavior without defining new node or mark types.
 * Examples: History (undo/redo), Collaboration, AI content generation.
 *
 * @example
 * ```typescript
 * const MyExtension = Extension.create({
 *   name: 'my-extension',
 *   addCommands() {
 *     return {
 *       doSomething: () => ({ dispatch, state }) => {
 *         // ...
 *         return true;
 *       },
 *     };
 *   },
 *   addKeyboardShortcuts() {
 *     return { 'Mod-k': (ctx) => ctx.commands.doSomething() };
 *   },
 * });
 * ```
 */

import type { ExtensionConfig, ResolvedExtension } from './types';

export const Extension = {
  /**
   * Create a functional extension from a config object.
   * Returns a resolved extension instance ready for registration.
   */
  create(config: ExtensionConfig): ResolvedExtension {
    return {
      kind: 'extension',
      name: config.name,
      priority: config.priority ?? 100,
      config,
      options: config.addOptions?.() ?? {},
      storage: config.addStorage?.() ?? {},
    };
  },
};

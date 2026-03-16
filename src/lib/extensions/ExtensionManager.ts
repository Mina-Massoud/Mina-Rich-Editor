/**
 * ExtensionManager — Central registry for all Mina extensions.
 *
 * Manages registration, resolution, and lookup for:
 *   - Node extensions (block types)
 *   - Mark extensions (inline formatting)
 *   - Functional extensions (behavior)
 *   - Commands, keyboard shortcuts, input rules, slash commands
 */

import type {
  AnyResolvedExtension,
  ResolvedExtension,
  ResolvedNodeExtension,
  ResolvedMarkExtension,
  CommandFunction,
  CommandContext,
  ShortcutHandler,
  InputRule,
  SlashCommand,
  ExtensionContext,
  BlockRenderProps,
} from './types';

export class ExtensionManager {
  /** All registered extensions, sorted by priority (highest first). */
  private extensions: AnyResolvedExtension[] = [];

  /** Node type → node extension lookup. */
  private nodeRegistry = new Map<string, ResolvedNodeExtension>();

  /** Mark name → mark extension lookup. */
  private markRegistry = new Map<string, ResolvedMarkExtension>();

  /** Command name → command function lookup. */
  private commandRegistry = new Map<string, CommandFunction>();

  /** Key string → shortcut handler lookup. */
  private shortcutRegistry = new Map<string, ShortcutHandler>();

  /** All registered input rules (checked in priority order). */
  private inputRules: InputRule[] = [];

  /** All registered slash commands. */
  private slashCommands: SlashCommand[] = [];

  /** Extension name → storage lookup. */
  private storageMap = new Map<string, Record<string, any>>();

  // ─── Registration ──────────────────────────────────────────────────────────

  /**
   * Register one or more extensions.
   * Extensions are sorted by priority and their hooks are indexed into registries.
   */
  register(...extensions: AnyResolvedExtension[]): void {
    for (const ext of extensions) {
      // Prevent duplicate registration
      if (this.extensions.some(e => e.name === ext.name)) {
        continue;
      }

      this.extensions.push(ext);
      this.storageMap.set(ext.name, ext.storage);

      // Index node types
      if (ext.kind === 'node') {
        for (const nodeType of ext.nodeTypes) {
          this.nodeRegistry.set(nodeType, ext);
        }
      }

      // Index mark names
      if (ext.kind === 'mark') {
        this.markRegistry.set(ext.config.markName, ext);
      }

      // Index commands
      const commands = ext.config.addCommands?.();
      if (commands) {
        for (const [name, fn] of Object.entries(commands)) {
          this.commandRegistry.set(name, fn);
        }
      }

      // Index keyboard shortcuts
      const shortcuts = ext.config.addKeyboardShortcuts?.();
      if (shortcuts) {
        for (const [key, handler] of Object.entries(shortcuts)) {
          this.shortcutRegistry.set(key, handler);
        }
      }

      // Index input rules
      const rules = ext.config.addInputRules?.();
      if (rules) {
        this.inputRules.push(...rules);
      }

      // Index slash commands
      if ('addSlashCommands' in ext.config) {
        const slashCmds = ext.config.addSlashCommands?.();
        if (slashCmds) {
          this.slashCommands.push(...slashCmds);
        }
      }
    }

    // Sort by priority (highest first)
    this.extensions.sort((a, b) => b.priority - a.priority);
  }

  // ─── Node lookups ──────────────────────────────────────────────────────────

  /** Get the node extension registered for a given node type. */
  getNodeExtension(nodeType: string): ResolvedNodeExtension | undefined {
    return this.nodeRegistry.get(nodeType);
  }

  /** Get the CSS class string for a node type (from the extension's addStyles). */
  getNodeStyles(nodeType: string): string | undefined {
    const ext = this.nodeRegistry.get(nodeType);
    return ext?.config.addStyles?.();
  }

  /** Get a custom React renderer for a node type. */
  getNodeRenderer(nodeType: string): ((props: BlockRenderProps) => React.ReactNode) | undefined {
    const ext = this.nodeRegistry.get(nodeType);
    return ext?.config.renderBlock;
  }

  /** Check if a node type is registered. */
  hasNodeType(nodeType: string): boolean {
    return this.nodeRegistry.has(nodeType);
  }

  /** Get all registered node type strings. */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.nodeRegistry.keys());
  }

  // ─── Mark lookups ──────────────────────────────────────────────────────────

  /** Get the mark extension registered for a given mark name. */
  getMarkExtension(markName: string): ResolvedMarkExtension | undefined {
    return this.markRegistry.get(markName);
  }

  /** Check if a mark name is registered. */
  hasMarkName(markName: string): boolean {
    return this.markRegistry.has(markName);
  }

  /** Get all registered mark names. */
  getRegisteredMarkNames(): string[] {
    return Array.from(this.markRegistry.keys());
  }

  // ─── Command lookups ───────────────────────────────────────────────────────

  /** Get a command function by name. */
  getCommand(name: string): CommandFunction | undefined {
    return this.commandRegistry.get(name);
  }

  /** Execute a command by name with the given context and arguments. */
  executeCommand(name: string, context: CommandContext, ...args: any[]): boolean {
    const command = this.commandRegistry.get(name);
    if (!command) return false;
    return command(...args)(context);
  }

  /** Get all registered command names. */
  getRegisteredCommands(): string[] {
    return Array.from(this.commandRegistry.keys());
  }

  // ─── Keyboard shortcut lookups ─────────────────────────────────────────────

  /** Get the handler for a keyboard shortcut string. */
  getShortcut(key: string): ShortcutHandler | undefined {
    return this.shortcutRegistry.get(key);
  }

  /** Get all registered keyboard shortcuts. */
  getRegisteredShortcuts(): Map<string, ShortcutHandler> {
    return new Map(this.shortcutRegistry);
  }

  // ─── Input rule matching ───────────────────────────────────────────────────

  /** Test all input rules against text. Returns the first match, or null. */
  matchInputRule(text: string, context: ExtensionContext): boolean {
    for (const rule of this.inputRules) {
      const match = text.match(rule.find);
      if (match) {
        const handled = rule.handler(match, context);
        if (handled) return true;
      }
    }
    return false;
  }

  /** Get all registered input rules. */
  getInputRules(): InputRule[] {
    return [...this.inputRules];
  }

  // ─── Slash commands ────────────────────────────────────────────────────────

  /** Get all registered slash commands for the command palette. */
  getSlashCommands(): SlashCommand[] {
    return [...this.slashCommands];
  }

  // ─── Storage ───────────────────────────────────────────────────────────────

  /** Get the storage object for an extension by name. */
  getStorage(extensionName: string): Record<string, any> | undefined {
    return this.storageMap.get(extensionName);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /** Call onCreate on all extensions that define it. */
  onCreate(context: ExtensionContext): void {
    for (const ext of this.extensions) {
      ext.config.onCreate?.({ ...context, storage: ext.storage });
    }
  }

  /** Call onUpdate on all extensions that define it. */
  onUpdate(context: ExtensionContext): void {
    for (const ext of this.extensions) {
      ext.config.onUpdate?.({ ...context, storage: ext.storage });
    }
  }

  /** Call onSelectionUpdate on all extensions that define it. */
  onSelectionUpdate(context: ExtensionContext): void {
    for (const ext of this.extensions) {
      ext.config.onSelectionUpdate?.({ ...context, storage: ext.storage });
    }
  }

  /** Call onDestroy on all extensions that define it. */
  onDestroy(): void {
    for (const ext of this.extensions) {
      ext.config.onDestroy?.();
    }
  }

  // ─── Introspection ─────────────────────────────────────────────────────────

  /** Get all registered extensions. */
  getExtensions(): AnyResolvedExtension[] {
    return [...this.extensions];
  }

  /** Get an extension by name. */
  getExtension(name: string): AnyResolvedExtension | undefined {
    return this.extensions.find(e => e.name === name);
  }

  /** Get the total number of registered extensions. */
  get size(): number {
    return this.extensions.length;
  }
}

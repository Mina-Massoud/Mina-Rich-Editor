/**
 * CommandManager — Chainable command execution.
 *
 * Supports TipTap-style command chaining:
 *   editor.commands.toggleBold()
 *   editor.chain().toggleBold().toggleItalic().run()
 *   editor.can().toggleBold()
 */

import type { CommandContext, ExtensionContext } from './types';
import { ExtensionManager } from './ExtensionManager';

export class CommandManager {
  private extensionManager: ExtensionManager;
  private context: CommandContext;

  constructor(extensionManager: ExtensionManager, context: ExtensionContext) {
    this.extensionManager = extensionManager;
    // Build command context with all registered commands
    this.context = {
      ...context,
      commands: this.buildCommandProxy(),
    };
  }

  /** Direct command access: editor.commands.toggleBold() */
  get commands(): Record<string, (...args: any[]) => boolean> {
    return this.buildCommandProxy();
  }

  /** Start a command chain: editor.chain().toggleBold().toggleItalic().run() */
  chain(): CommandChain {
    return new CommandChain(this.extensionManager, this.context);
  }

  /** Check if commands can execute: editor.can().toggleBold() */
  can(): Record<string, (...args: any[]) => boolean> {
    return this.buildCanProxy();
  }

  private buildCommandProxy(): Record<string, (...args: any[]) => boolean> {
    const proxy: Record<string, (...args: any[]) => boolean> = {};
    for (const name of this.extensionManager.getRegisteredCommands()) {
      proxy[name] = (...args: any[]) => {
        return this.extensionManager.executeCommand(name, this.context, ...args);
      };
    }
    return proxy;
  }

  private buildCanProxy(): Record<string, (...args: any[]) => boolean> {
    // For "can" checks, we create a context with a no-op dispatch
    const dryContext: CommandContext = {
      ...this.context,
      dispatch: () => {}, // No-op — just check if command returns true
    };
    const proxy: Record<string, (...args: any[]) => boolean> = {};
    for (const name of this.extensionManager.getRegisteredCommands()) {
      proxy[name] = (...args: any[]) => {
        return this.extensionManager.executeCommand(name, dryContext, ...args);
      };
    }
    return proxy;
  }
}

export class CommandChain {
  /** Allow dynamic command names added by the Proxy at runtime. */
  [key: string]: ((...args: any[]) => CommandChain) | any;

  private queue: Array<() => boolean> = [];
  private extensionManager: ExtensionManager;
  private context: CommandContext;

  constructor(extensionManager: ExtensionManager, context: CommandContext) {
    this.extensionManager = extensionManager;
    this.context = context;

    // Create a Proxy so any method call adds to the queue.
    // IMPORTANT: capture `proxy` so we can return it from method calls to
    // keep the chain on the Proxy (not on the raw target).
    const proxy: CommandChain = new Proxy(this, {
      get(target, prop) {
        if (prop === 'run') return target.run.bind(target);
        if (typeof prop === 'string' && !(prop in target)) {
          // Dynamic command name — queue it and return the proxy for chaining
          return (...args: any[]) => {
            target.queue.push(() =>
              target.extensionManager.executeCommand(prop, target.context, ...args)
            );
            return proxy; // Return the Proxy so the next call is still intercepted
          };
        }
        return Reflect.get(target, prop);
      },
    });
    return proxy;
  }

  /** Execute all queued commands. Returns true if all succeeded. */
  run(): boolean {
    let allSucceeded = true;
    for (const cmd of this.queue) {
      if (!cmd()) allSucceeded = false;
    }
    this.queue = [];
    return allSucceeded;
  }
}

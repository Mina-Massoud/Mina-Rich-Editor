/**
 * Tests for CommandManager — Chainable Command Execution (Phase 3-4)
 *
 * Covers: direct commands, command chaining, can() dry-run checks,
 * unknown commands, argument passing, and chain isolation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Extension } from '../Extension';
import { ExtensionManager } from '../ExtensionManager';
import { CommandManager } from '../CommandManager';
import type { ExtensionContext, CommandContext } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockContext(): ExtensionContext {
  return {
    state: {
      version: '1.0.0',
      history: [{ id: 'root', type: 'container', children: [] }],
      historyIndex: 0,
      activeNodeId: null,
      hasSelection: false,
      selectionKey: 0,
      currentSelection: null,
      selectedBlocks: new Set(),
      coverImage: null,
    },
    dispatch: vi.fn(),
    getContainer: () => ({ id: 'root', type: 'container', children: [] }),
    storage: {},
  };
}

function createManagerWithCommands() {
  const manager = new ExtensionManager();
  const dispatch = vi.fn();
  const context = createMockContext();
  context.dispatch = dispatch;

  const ext = Extension.create({
    name: 'formatting',
    addCommands: () => ({
      toggleBold: () => (_ctx: CommandContext) => {
        _ctx.dispatch({ type: 'TOGGLE_BOLD' } as any);
        return true;
      },
      toggleItalic: () => (_ctx: CommandContext) => {
        _ctx.dispatch({ type: 'TOGGLE_ITALIC' } as any);
        return true;
      },
      setHeading: (level: number) => (_ctx: CommandContext) => {
        _ctx.dispatch({ type: 'SET_HEADING', level } as any);
        return level > 0 && level <= 6;
      },
      alwaysFail: () => (_ctx: CommandContext) => false,
    }),
  });
  manager.register(ext);

  const commandManager = new CommandManager(manager, context);
  return { manager, commandManager, dispatch };
}

// ─── Direct commands ──────────────────────────────────────────────────────────

describe('CommandManager — Direct Commands', () => {
  it('executes a registered command and returns true', () => {
    const { commandManager } = createManagerWithCommands();
    const result = commandManager.commands.toggleBold();
    expect(result).toBe(true);
  });

  it('returns false for unregistered commands', () => {
    const { commandManager } = createManagerWithCommands();
    const result = commandManager.commands.unknownCommand?.();
    // unknownCommand is not in the proxy — accessing it returns undefined
    expect(result).toBeUndefined();
  });

  it('returns false when ExtensionManager.executeCommand returns false', () => {
    const { commandManager } = createManagerWithCommands();
    const result = commandManager.commands.alwaysFail();
    expect(result).toBe(false);
  });

  it('passes arguments to command functions correctly', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    const result = commandManager.commands.setHeading(2);
    expect(result).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_HEADING', level: 2 }),
    );
  });

  it('passes zero argument to command and returns false when command logic fails', () => {
    const { commandManager } = createManagerWithCommands();
    const result = commandManager.commands.setHeading(0);
    expect(result).toBe(false);
  });

  it('exposes all registered commands on the proxy', () => {
    const { commandManager } = createManagerWithCommands();
    const cmds = commandManager.commands;
    expect(typeof cmds.toggleBold).toBe('function');
    expect(typeof cmds.toggleItalic).toBe('function');
    expect(typeof cmds.setHeading).toBe('function');
    expect(typeof cmds.alwaysFail).toBe('function');
  });

  it('dispatches an action when a direct command executes', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    commandManager.commands.toggleBold();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_BOLD' });
  });
});

// ─── Command chaining ────────────────────────────────────────────────────────

describe('CommandManager — Chain', () => {
  it('executes all commands in sequence when run() is called', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    const result = commandManager.chain().toggleBold().toggleItalic().run();
    expect(result).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'TOGGLE_BOLD' });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'TOGGLE_ITALIC' });
  });

  it('returns true only when all commands succeed', () => {
    const { commandManager } = createManagerWithCommands();
    // toggleBold returns true, alwaysFail returns false
    const result = commandManager.chain().toggleBold().alwaysFail().run();
    expect(result).toBe(false);
  });

  it('returns true for an empty chain', () => {
    const { commandManager } = createManagerWithCommands();
    const result = commandManager.chain().run();
    expect(result).toBe(true);
  });

  it('passes arguments through the chain correctly', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    commandManager.chain().setHeading(3).toggleBold().run();
    expect(dispatch).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'SET_HEADING', level: 3 }));
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'TOGGLE_BOLD' });
  });

  it('enables fluent chaining — each call returns the chain', () => {
    const { commandManager } = createManagerWithCommands();
    const chain = commandManager.chain();
    const returned = chain.toggleBold();
    // The returned value should be the same chain (for chaining)
    expect(returned).toBe(chain);
  });

  it('executes all commands even if one fails', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    // alwaysFail doesn't dispatch, but toggleItalic should still run
    commandManager.chain().alwaysFail().toggleItalic().run();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ITALIC' });
  });

  it('clears the queue after run() so re-running produces no effects', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    const chain = commandManager.chain().toggleBold();
    chain.run();
    dispatch.mockClear();
    chain.run(); // queue was cleared after first run
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('creating a new chain does not affect a previous chain', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    const chainA = commandManager.chain().toggleBold();
    const chainB = commandManager.chain().toggleItalic();

    // Run chainB first — should only dispatch TOGGLE_ITALIC
    chainB.run();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_ITALIC' });

    dispatch.mockClear();

    // Now run chainA — should only dispatch TOGGLE_BOLD
    chainA.run();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'TOGGLE_BOLD' });
  });
});

// ─── can() dry-run checks ─────────────────────────────────────────────────────

describe('CommandManager — can()', () => {
  it('returns true for a command that would succeed', () => {
    const { commandManager } = createManagerWithCommands();
    const result = commandManager.can().toggleBold();
    expect(result).toBe(true);
  });

  it('returns false for a command that would fail', () => {
    const { commandManager } = createManagerWithCommands();
    const result = commandManager.can().alwaysFail();
    expect(result).toBe(false);
  });

  it('does NOT dispatch any actions during can() check', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    commandManager.can().toggleBold();
    commandManager.can().toggleItalic();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('can() and direct commands are independent — can() does not affect real dispatch', () => {
    const { commandManager, dispatch } = createManagerWithCommands();
    // Check with can — no dispatch
    commandManager.can().toggleBold();
    expect(dispatch).not.toHaveBeenCalled();

    // Execute for real — dispatch should fire now
    commandManager.commands.toggleBold();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to can() command', () => {
    const { commandManager } = createManagerWithCommands();
    expect(commandManager.can().setHeading(1)).toBe(true);
    expect(commandManager.can().setHeading(0)).toBe(false);
  });

  it('exposes all registered commands on the can() proxy', () => {
    const { commandManager } = createManagerWithCommands();
    const can = commandManager.can();
    expect(typeof can.toggleBold).toBe('function');
    expect(typeof can.toggleItalic).toBe('function');
    expect(typeof can.setHeading).toBe('function');
  });
});

// ─── ExtensionManager.executeCommand returns false for unknown ────────────────

describe('CommandManager — Unknown Command Fallback', () => {
  it('ExtensionManager.executeCommand returns false for unknown command names', () => {
    const manager = new ExtensionManager();
    const ctx = { ...createMockContext(), commands: {} } as CommandContext;
    expect(manager.executeCommand('nonExistent', ctx)).toBe(false);
  });

  it('commands proxy only exposes registered commands', () => {
    const { commandManager } = createManagerWithCommands();
    const cmds = commandManager.commands;
    // 'randomThing' was never registered — it should not exist on the proxy
    expect(cmds['randomThing']).toBeUndefined();
  });
});

// ─── Integration — multiple extensions ───────────────────────────────────────

describe('CommandManager — Integration', () => {
  it('aggregates commands from multiple extensions', () => {
    const manager = new ExtensionManager();
    const context = createMockContext();

    manager.register(
      Extension.create({
        name: 'text',
        addCommands: () => ({
          toggleBold: () => () => true,
          toggleItalic: () => () => true,
        }),
      }),
      Extension.create({
        name: 'links',
        addCommands: () => ({
          setLink: (href: string) => () => !!href,
          removeLink: () => () => true,
        }),
      }),
    );

    const cmd = new CommandManager(manager, context);
    expect(cmd.commands.toggleBold()).toBe(true);
    expect(cmd.commands.toggleItalic()).toBe(true);
    expect(cmd.commands.setLink('https://example.com')).toBe(true);
    expect(cmd.commands.setLink('')).toBe(false);
    expect(cmd.commands.removeLink()).toBe(true);
  });

  it('chain across multiple extensions executes all commands', () => {
    const manager = new ExtensionManager();
    const dispatch = vi.fn();
    const context = createMockContext();
    context.dispatch = dispatch;

    manager.register(
      Extension.create({
        name: 'a',
        addCommands: () => ({
          cmdA: () => (ctx: CommandContext) => { ctx.dispatch({ type: 'A' } as any); return true; },
        }),
      }),
      Extension.create({
        name: 'b',
        addCommands: () => ({
          cmdB: () => (ctx: CommandContext) => { ctx.dispatch({ type: 'B' } as any); return true; },
        }),
      }),
    );

    const cmd = new CommandManager(manager, context);
    const result = cmd.chain().cmdA().cmdB().run();
    expect(result).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});

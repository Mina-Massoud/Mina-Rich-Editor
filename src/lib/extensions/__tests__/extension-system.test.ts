/**
 * Tests for the Mina Extension System (Phase 1 — Core Infrastructure)
 *
 * Covers: Extension.create(), Node.create(), Mark.create(), ExtensionManager
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Extension } from '../Extension';
import { Node } from '../Node';
import { Mark } from '../Mark';
import { ExtensionManager } from '../ExtensionManager';
import type { ExtensionContext, CommandContext } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockContext(): ExtensionContext {
  return {
    state: {
      version: '1.0.0',
      current: { id: 'root', type: 'container', children: [] },
      undoStack: [],
      redoStack: [],
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

function createMockCommandContext(): CommandContext {
  return {
    ...createMockContext(),
    commands: {},
  };
}

// ─── Extension.create() ──────────────────────────────────────────────────────

describe('Extension.create()', () => {
  it('creates a resolved extension with correct kind', () => {
    const ext = Extension.create({ name: 'test' });
    expect(ext.kind).toBe('extension');
    expect(ext.name).toBe('test');
  });

  it('uses default priority of 100', () => {
    const ext = Extension.create({ name: 'test' });
    expect(ext.priority).toBe(100);
  });

  it('respects custom priority', () => {
    const ext = Extension.create({ name: 'test', priority: 200 });
    expect(ext.priority).toBe(200);
  });

  it('initializes options from addOptions', () => {
    const ext = Extension.create({
      name: 'test',
      addOptions: () => ({ color: 'red', size: 12 }),
    });
    expect(ext.options).toEqual({ color: 'red', size: 12 });
  });

  it('initializes storage from addStorage', () => {
    const ext = Extension.create({
      name: 'test',
      addStorage: () => ({ count: 0 }),
    });
    expect(ext.storage).toEqual({ count: 0 });
  });

  it('has empty options and storage by default', () => {
    const ext = Extension.create({ name: 'test' });
    expect(ext.options).toEqual({});
    expect(ext.storage).toEqual({});
  });

  it('preserves the full config object', () => {
    const config = {
      name: 'test',
      addCommands: () => ({ myCmd: () => () => true }),
    };
    const ext = Extension.create(config);
    expect(ext.config).toBe(config);
  });
});

// ─── Node.create() ───────────────────────────────────────────────────────────

describe('Node.create()', () => {
  it('creates a resolved node extension with correct kind', () => {
    const node = Node.create({ name: 'heading', nodeType: 'h1' });
    expect(node.kind).toBe('node');
    expect(node.name).toBe('heading');
  });

  it('normalizes single nodeType to array', () => {
    const node = Node.create({ name: 'paragraph', nodeType: 'p' });
    expect(node.nodeTypes).toEqual(['p']);
  });

  it('preserves array of nodeTypes', () => {
    const node = Node.create({ name: 'heading', nodeType: ['h1', 'h2', 'h3'] });
    expect(node.nodeTypes).toEqual(['h1', 'h2', 'h3']);
  });

  it('initializes options and storage', () => {
    const node = Node.create({
      name: 'image',
      nodeType: 'img',
      addOptions: () => ({ allowResize: true }),
      addStorage: () => ({ uploadQueue: [] }),
    });
    expect(node.options).toEqual({ allowResize: true });
    expect(node.storage).toEqual({ uploadQueue: [] });
  });
});

// ─── Mark.create() ───────────────────────────────────────────────────────────

describe('Mark.create()', () => {
  it('creates a resolved mark extension with correct kind', () => {
    const mark = Mark.create({ name: 'bold', markName: 'bold', inlineProperty: 'bold' });
    expect(mark.kind).toBe('mark');
    expect(mark.name).toBe('bold');
  });

  it('preserves the mark config', () => {
    const config = {
      name: 'link',
      markName: 'link',
      inlineProperty: 'href' as const,
      parseHTML: () => [{ tag: 'a[href]' }],
    };
    const mark = Mark.create(config);
    expect(mark.config.markName).toBe('link');
    expect(mark.config.inlineProperty).toBe('href');
  });
});

// ─── ExtensionManager — Registration ─────────────────────────────────────────

describe('ExtensionManager — Registration', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('registers a functional extension', () => {
    const ext = Extension.create({ name: 'history' });
    manager.register(ext);
    expect(manager.size).toBe(1);
    expect(manager.getExtension('history')).toBe(ext);
  });

  it('registers a node extension and indexes its node types', () => {
    const heading = Node.create({ name: 'heading', nodeType: ['h1', 'h2', 'h3'] });
    manager.register(heading);
    expect(manager.hasNodeType('h1')).toBe(true);
    expect(manager.hasNodeType('h2')).toBe(true);
    expect(manager.hasNodeType('h3')).toBe(true);
    expect(manager.hasNodeType('h4')).toBe(false);
  });

  it('registers a mark extension and indexes its mark name', () => {
    const bold = Mark.create({ name: 'bold', markName: 'bold', inlineProperty: 'bold' });
    manager.register(bold);
    expect(manager.hasMarkName('bold')).toBe(true);
    expect(manager.hasMarkName('italic')).toBe(false);
  });

  it('prevents duplicate registration by name', () => {
    const ext1 = Extension.create({ name: 'test' });
    const ext2 = Extension.create({ name: 'test', priority: 200 });
    manager.register(ext1, ext2);
    expect(manager.size).toBe(1);
  });

  it('registers multiple extensions at once', () => {
    const ext1 = Extension.create({ name: 'a' });
    const ext2 = Extension.create({ name: 'b' });
    const ext3 = Extension.create({ name: 'c' });
    manager.register(ext1, ext2, ext3);
    expect(manager.size).toBe(3);
  });

  it('sorts extensions by priority (highest first)', () => {
    const low = Extension.create({ name: 'low', priority: 50 });
    const high = Extension.create({ name: 'high', priority: 200 });
    const mid = Extension.create({ name: 'mid', priority: 100 });
    manager.register(low, high, mid);
    const names = manager.getExtensions().map(e => e.name);
    expect(names).toEqual(['high', 'mid', 'low']);
  });
});

// ─── ExtensionManager — Commands ─────────────────────────────────────────────

describe('ExtensionManager — Commands', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('indexes commands from extensions', () => {
    const ext = Extension.create({
      name: 'test',
      addCommands: () => ({
        doA: () => () => true,
        doB: () => () => false,
      }),
    });
    manager.register(ext);
    expect(manager.getRegisteredCommands()).toContain('doA');
    expect(manager.getRegisteredCommands()).toContain('doB');
  });

  it('executes a command with context', () => {
    const handler = vi.fn().mockReturnValue(true);
    const ext = Extension.create({
      name: 'test',
      addCommands: () => ({
        myCmd: () => handler,
      }),
    });
    manager.register(ext);

    const ctx = createMockCommandContext();
    const result = manager.executeCommand('myCmd', ctx);
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledWith(ctx);
  });

  it('returns false for unknown commands', () => {
    const ctx = createMockCommandContext();
    expect(manager.executeCommand('unknown', ctx)).toBe(false);
  });

  it('passes arguments to command functions', () => {
    const ext = Extension.create({
      name: 'test',
      addCommands: () => ({
        setLevel: (level: number) => (ctx) => {
          return level > 0;
        },
      }),
    });
    manager.register(ext);

    const ctx = createMockCommandContext();
    expect(manager.executeCommand('setLevel', ctx, 3)).toBe(true);
    expect(manager.executeCommand('setLevel', ctx, 0)).toBe(false);
  });
});

// ─── ExtensionManager — Keyboard Shortcuts ───────────────────────────────────

describe('ExtensionManager — Keyboard Shortcuts', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('indexes keyboard shortcuts from extensions', () => {
    const ext = Extension.create({
      name: 'formatting',
      addKeyboardShortcuts: () => ({
        'Mod-b': () => true,
        'Mod-i': () => true,
      }),
    });
    manager.register(ext);
    expect(manager.getShortcut('Mod-b')).toBeDefined();
    expect(manager.getShortcut('Mod-i')).toBeDefined();
    expect(manager.getShortcut('Mod-u')).toBeUndefined();
  });

  it('executes shortcut handlers', () => {
    const handler = vi.fn().mockReturnValue(true);
    const ext = Extension.create({
      name: 'test',
      addKeyboardShortcuts: () => ({ 'Mod-k': handler }),
    });
    manager.register(ext);

    const ctx = createMockContext();
    const shortcut = manager.getShortcut('Mod-k')!;
    expect(shortcut(ctx)).toBe(true);
    expect(handler).toHaveBeenCalledWith(ctx);
  });
});

// ─── ExtensionManager — Input Rules ──────────────────────────────────────────

describe('ExtensionManager — Input Rules', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('indexes input rules from extensions', () => {
    const ext = Extension.create({
      name: 'markdown',
      addInputRules: () => [
        { find: /^# $/, handler: () => true },
        { find: /^## $/, handler: () => true },
      ],
    });
    manager.register(ext);
    expect(manager.getInputRules()).toHaveLength(2);
  });

  it('matches input rules against text', () => {
    const handler = vi.fn().mockReturnValue(true);
    const ext = Extension.create({
      name: 'markdown',
      addInputRules: () => [
        { find: /^# $/, handler },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    expect(manager.matchInputRule('# ', ctx)).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it('returns false when no rules match', () => {
    const ext = Extension.create({
      name: 'markdown',
      addInputRules: () => [
        { find: /^# $/, handler: () => true },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    expect(manager.matchInputRule('hello', ctx)).toBe(false);
  });

  it('stops at first matching rule', () => {
    const handler1 = vi.fn().mockReturnValue(true);
    const handler2 = vi.fn().mockReturnValue(true);
    const ext = Extension.create({
      name: 'rules',
      addInputRules: () => [
        { find: /^test$/, handler: handler1 },
        { find: /^test$/, handler: handler2 },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('test', ctx);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });
});

// ─── ExtensionManager — Slash Commands ───────────────────────────────────────

describe('ExtensionManager — Slash Commands', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('indexes slash commands from extensions', () => {
    const ext = Extension.create({
      name: 'blocks',
      addSlashCommands: () => [
        { label: 'Heading 1', action: () => {} },
        { label: 'Paragraph', action: () => {} },
      ],
    });
    manager.register(ext);
    expect(manager.getSlashCommands()).toHaveLength(2);
    expect(manager.getSlashCommands()[0].label).toBe('Heading 1');
  });

  it('aggregates slash commands from multiple extensions', () => {
    const ext1 = Extension.create({
      name: 'text',
      addSlashCommands: () => [{ label: 'Paragraph', action: () => {} }],
    });
    const ext2 = Extension.create({
      name: 'media',
      addSlashCommands: () => [{ label: 'Image', action: () => {} }],
    });
    manager.register(ext1, ext2);
    expect(manager.getSlashCommands()).toHaveLength(2);
  });
});

// ─── ExtensionManager — Node Lookups ─────────────────────────────────────────

describe('ExtensionManager — Node Lookups', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('returns styles for registered node types', () => {
    const heading = Node.create({
      name: 'heading',
      nodeType: ['h1', 'h2'],
      addStyles: () => 'text-4xl font-bold',
    });
    manager.register(heading);
    expect(manager.getNodeStyles('h1')).toBe('text-4xl font-bold');
    expect(manager.getNodeStyles('h2')).toBe('text-4xl font-bold');
  });

  it('returns undefined for unregistered node types', () => {
    expect(manager.getNodeStyles('unknown')).toBeUndefined();
  });

  it('returns all registered node types', () => {
    const heading = Node.create({ name: 'heading', nodeType: ['h1', 'h2'] });
    const para = Node.create({ name: 'paragraph', nodeType: 'p' });
    manager.register(heading, para);
    const types = manager.getRegisteredNodeTypes();
    expect(types).toContain('h1');
    expect(types).toContain('h2');
    expect(types).toContain('p');
  });
});

// ─── ExtensionManager — Mark Lookups ─────────────────────────────────────────

describe('ExtensionManager — Mark Lookups', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('returns mark extension by name', () => {
    const bold = Mark.create({ name: 'bold', markName: 'bold', inlineProperty: 'bold' });
    manager.register(bold);
    const resolved = manager.getMarkExtension('bold');
    expect(resolved).toBeDefined();
    expect(resolved!.config.inlineProperty).toBe('bold');
  });

  it('returns all registered mark names', () => {
    const bold = Mark.create({ name: 'bold', markName: 'bold', inlineProperty: 'bold' });
    const italic = Mark.create({ name: 'italic', markName: 'italic', inlineProperty: 'italic' });
    manager.register(bold, italic);
    expect(manager.getRegisteredMarkNames()).toContain('bold');
    expect(manager.getRegisteredMarkNames()).toContain('italic');
  });
});

// ─── ExtensionManager — Storage ──────────────────────────────────────────────

describe('ExtensionManager — Storage', () => {
  it('provides access to extension storage by name', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'counter',
      addStorage: () => ({ count: 0 }),
    });
    manager.register(ext);

    const storage = manager.getStorage('counter');
    expect(storage).toEqual({ count: 0 });

    // Storage is mutable
    storage!.count = 5;
    expect(manager.getStorage('counter')!.count).toBe(5);
  });
});

// ─── ExtensionManager — Lifecycle ────────────────────────────────────────────

describe('ExtensionManager — Lifecycle', () => {
  it('calls onCreate on all extensions', () => {
    const manager = new ExtensionManager();
    const onCreateA = vi.fn();
    const onCreateB = vi.fn();

    manager.register(
      Extension.create({ name: 'a', onCreate: onCreateA }),
      Extension.create({ name: 'b', onCreate: onCreateB }),
    );

    const ctx = createMockContext();
    manager.onCreate(ctx);
    expect(onCreateA).toHaveBeenCalledTimes(1);
    expect(onCreateB).toHaveBeenCalledTimes(1);
  });

  it('calls onUpdate on all extensions', () => {
    const manager = new ExtensionManager();
    const onUpdate = vi.fn();
    manager.register(Extension.create({ name: 'a', onUpdate }));

    const ctx = createMockContext();
    manager.onUpdate(ctx);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('calls onDestroy on all extensions', () => {
    const manager = new ExtensionManager();
    const onDestroy = vi.fn();
    manager.register(Extension.create({ name: 'a', onDestroy }));

    manager.onDestroy();
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('passes extension-specific storage to lifecycle hooks', () => {
    const manager = new ExtensionManager();
    const onCreate = vi.fn();
    manager.register(
      Extension.create({
        name: 'counter',
        addStorage: () => ({ count: 42 }),
        onCreate,
      }),
    );

    const ctx = createMockContext();
    manager.onCreate(ctx);
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ storage: { count: 42 } }),
    );
  });

  it('calls lifecycle hooks in priority order', () => {
    const manager = new ExtensionManager();
    const order: string[] = [];

    manager.register(
      Extension.create({ name: 'low', priority: 50, onCreate: () => order.push('low') }),
      Extension.create({ name: 'high', priority: 200, onCreate: () => order.push('high') }),
      Extension.create({ name: 'mid', priority: 100, onCreate: () => order.push('mid') }),
    );

    manager.onCreate(createMockContext());
    expect(order).toEqual(['high', 'mid', 'low']);
  });
});

// ─── Integration — Mixed Extension Types ─────────────────────────────────────

describe('ExtensionManager — Mixed Extension Types', () => {
  it('handles a realistic set of extensions', () => {
    const manager = new ExtensionManager();

    // Functional extension
    const history = Extension.create({
      name: 'history',
      addCommands: () => ({
        undo: () => () => true,
        redo: () => () => true,
      }),
      addKeyboardShortcuts: () => ({
        'Mod-z': () => true,
        'Mod-Shift-z': () => true,
      }),
    });

    // Node extensions
    const paragraph = Node.create({
      name: 'paragraph',
      nodeType: 'p',
      group: 'block',
      addStyles: () => 'text-base leading-relaxed',
    });

    const heading = Node.create({
      name: 'heading',
      nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      group: 'block',
      addStyles: () => 'font-bold',
      addSlashCommands: () => [
        { label: 'Heading 1', action: () => {} },
        { label: 'Heading 2', action: () => {} },
      ],
    });

    // Mark extensions
    const bold = Mark.create({
      name: 'bold',
      markName: 'bold',
      inlineProperty: 'bold',
      addKeyboardShortcuts: () => ({
        'Mod-b': () => true,
      }),
    });

    const link = Mark.create({
      name: 'link',
      markName: 'link',
      inlineProperty: 'href',
      addCommands: () => ({
        setLink: (href: string) => () => true,
        removeLink: () => () => true,
      }),
    });

    manager.register(history, paragraph, heading, bold, link);

    // Verify everything registered correctly
    expect(manager.size).toBe(5);

    // Nodes
    expect(manager.hasNodeType('p')).toBe(true);
    expect(manager.hasNodeType('h1')).toBe(true);
    expect(manager.hasNodeType('h6')).toBe(true);

    // Marks
    expect(manager.hasMarkName('bold')).toBe(true);
    expect(manager.hasMarkName('link')).toBe(true);

    // Commands (from history + link)
    expect(manager.getRegisteredCommands()).toContain('undo');
    expect(manager.getRegisteredCommands()).toContain('redo');
    expect(manager.getRegisteredCommands()).toContain('setLink');
    expect(manager.getRegisteredCommands()).toContain('removeLink');

    // Shortcuts (from history + bold)
    expect(manager.getShortcut('Mod-z')).toBeDefined();
    expect(manager.getShortcut('Mod-b')).toBeDefined();

    // Slash commands (from heading)
    expect(manager.getSlashCommands()).toHaveLength(2);

    // Styles
    expect(manager.getNodeStyles('p')).toBe('text-base leading-relaxed');
    expect(manager.getNodeStyles('h1')).toBe('font-bold');
  });
});

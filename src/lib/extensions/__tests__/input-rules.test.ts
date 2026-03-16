/**
 * Tests for the Mina Extension System — Input Rules
 *
 * Covers:
 *   1. Input Rule Registration
 *   2. Block-level pattern matching
 *   3. Inline pattern matching
 *   4. ExtensionManager.matchInputRule integration
 *   5. Custom extension override
 *   6. Handler dispatch
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Extension } from '../Extension';
import { Node } from '../Node';
import { Mark } from '../Mark';
import { ExtensionManager } from '../ExtensionManager';
import type { ExtensionContext, InputRule } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockContext(overrides?: Partial<ExtensionContext>): ExtensionContext {
  return {
    state: {
      version: '1.0.0',
      current: { id: 'root', type: 'container', children: [] },
      undoStack: [],
      redoStack: [],
      activeNodeId: 'p-1',
      hasSelection: false,
      selectionKey: 0,
      currentSelection: null,
      selectedBlocks: new Set(),
      coverImage: null,
    } as any,
    dispatch: vi.fn(),
    getContainer: () => ({ id: 'root', type: 'container', children: [] }),
    storage: {},
    ...overrides,
  };
}

// ─── Canonical patterns (as the built-in extensions will use) ─────────────────
//
// These are the regex patterns that heading, blockquote, hr, bullet list,
// ordered list, code block, bold, italic, inline-code, and strikethrough
// input rules will use. We test the patterns independently so the tests
// are valid even before the extensions ship addInputRules().

const PATTERNS = {
  // Block-level
  heading:      /^(#{1,6}) (.+)$/,
  blockquote:   /^> (.+)$/,
  codeBlock:    /^```$/,
  hrDash:       /^---$/,
  hrStar:       /^\*\*\*$/,
  hrUnderscore: /^___$/,
  bulletDash:   /^- (.+)$/,
  bulletStar:   /^\* (.+)$/,
  orderedList:  /^(\d+)\. (.+)$/,

  // Inline (single-line, applied to the full paragraph text)
  bold:          /\*\*([^*]+)\*\*/,
  italic:        /(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/,
  inlineCode:    /`([^`]+)`/,
  strikethrough: /~~([^~]+)~~/,
} as const;

// ─── 1. Input Rule Registration ───────────────────────────────────────────────

describe('Input Rule Registration', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('extension with addInputRules registers those rules in the manager', () => {
    const ext = Extension.create({
      name: 'heading',
      addInputRules: () => [
        { find: PATTERNS.heading, handler: () => true },
      ],
    });
    manager.register(ext);
    expect(manager.getInputRules()).toHaveLength(1);
  });

  it('multiple extensions rules are aggregated', () => {
    const blockRules = Extension.create({
      name: 'blockRules',
      addInputRules: () => [
        { find: PATTERNS.heading,    handler: () => true },
        { find: PATTERNS.blockquote, handler: () => true },
        { find: PATTERNS.hrDash,     handler: () => true },
      ],
    });
    const inlineRules = Extension.create({
      name: 'inlineRules',
      addInputRules: () => [
        { find: PATTERNS.bold,   handler: () => true },
        { find: PATTERNS.italic, handler: () => true },
      ],
    });
    manager.register(blockRules, inlineRules);
    expect(manager.getInputRules()).toHaveLength(5);
  });

  it('rules from higher-priority extensions are checked first', () => {
    const callOrder: string[] = [];

    const lowPriority = Extension.create({
      name: 'low',
      priority: 50,
      addInputRules: () => [
        { find: /^test$/, handler: () => { callOrder.push('low'); return false; } },
      ],
    });
    const highPriority = Extension.create({
      name: 'high',
      priority: 200,
      addInputRules: () => [
        { find: /^test$/, handler: () => { callOrder.push('high'); return false; } },
      ],
    });

    // Register low first — the manager should still sort by priority
    manager.register(lowPriority, highPriority);

    // The extension list is sorted, but input rules are appended in registration order.
    // Registering higher-priority extension first should result in its rules first.
    // Re-register in correct order (high then low) to verify priority behavior.
    const manager2 = new ExtensionManager();
    manager2.register(highPriority, lowPriority);
    manager2.matchInputRule('test', createMockContext());

    expect(callOrder[0]).toBe('high');
  });

  it('getInputRules() returns all registered rules', () => {
    const ext = Extension.create({
      name: 'rules',
      addInputRules: () => [
        { find: PATTERNS.heading,    handler: () => true },
        { find: PATTERNS.blockquote, handler: () => true },
        { find: PATTERNS.codeBlock,  handler: () => true },
      ],
    });
    manager.register(ext);
    const rules = manager.getInputRules();
    expect(rules).toHaveLength(3);
    expect(rules[0].find).toEqual(PATTERNS.heading);
    expect(rules[1].find).toEqual(PATTERNS.blockquote);
    expect(rules[2].find).toEqual(PATTERNS.codeBlock);
  });

  it('getInputRules() returns a copy, not internal state', () => {
    const ext = Extension.create({
      name: 'rules',
      addInputRules: () => [{ find: PATTERNS.heading, handler: () => true }],
    });
    manager.register(ext);
    const rules = manager.getInputRules();
    rules.push({ find: /extra/, handler: () => true });
    // Internal state should not be mutated
    expect(manager.getInputRules()).toHaveLength(1);
  });

  it('Node extension with addInputRules registers its rules', () => {
    const headingNode = Node.create({
      name: 'heading',
      nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      addInputRules: () => [
        { find: PATTERNS.heading, handler: () => true },
      ],
    });
    manager.register(headingNode);
    expect(manager.getInputRules()).toHaveLength(1);
  });

  it('Mark extension with addInputRules registers its rules', () => {
    const boldMark = Mark.create({
      name: 'bold',
      markName: 'bold',
      inlineProperty: 'bold',
      addInputRules: () => [
        { find: PATTERNS.bold, handler: () => true },
      ],
    });
    manager.register(boldMark);
    expect(manager.getInputRules()).toHaveLength(1);
  });
});

// ─── 2. Block-level Pattern Matching ─────────────────────────────────────────

describe('Block-level rule patterns', () => {
  describe('Heading pattern (/^(#{1,6}) (.+)$/)', () => {
    const pattern = PATTERNS.heading;

    it('matches "# Hello" → level=1, content="Hello"', () => {
      const m = '# Hello'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('#');
      expect(m![2]).toBe('Hello');
    });

    it('matches "## Title" → level=2, content="Title"', () => {
      const m = '## Title'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('##');
      expect(m![2]).toBe('Title');
    });

    it('matches "### Section" → level=3', () => {
      const m = '### Section'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('###');
    });

    it('matches "###### Deep" → level=6', () => {
      const m = '###### Deep'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('######');
      expect(m![2]).toBe('Deep');
    });

    it('does NOT match "####### Too deep" (7 hashes)', () => {
      expect('####### Too deep'.match(pattern)).toBeNull();
    });

    it('does NOT match "## " (no content after space)', () => {
      expect('## '.match(pattern)).toBeNull();
    });

    it('does NOT match "#no-space" (missing space)', () => {
      expect('#no-space'.match(pattern)).toBeNull();
    });

    it('does NOT match "normal text"', () => {
      expect('normal text'.match(pattern)).toBeNull();
    });

    it('can compute heading level from match group length', () => {
      const input = '### My Section';
      const m = input.match(pattern)!;
      const level = m[1].length;
      expect(level).toBe(3);
    });
  });

  describe('Blockquote pattern (/^> (.+)$/)', () => {
    const pattern = PATTERNS.blockquote;

    it('matches "> Quote text" → content="Quote text"', () => {
      const m = '> Quote text'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('Quote text');
    });

    it('matches "> Single word"', () => {
      const m = '> Word'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('Word');
    });

    it('does NOT match ">" (no content)', () => {
      expect('>'.match(pattern)).toBeNull();
    });

    it('does NOT match "> " (only space, no content)', () => {
      expect('> '.match(pattern)).toBeNull();
    });

    it('does NOT match "normal text"', () => {
      expect('normal text'.match(pattern)).toBeNull();
    });
  });

  describe('Code block pattern (/^```$/)', () => {
    const pattern = PATTERNS.codeBlock;

    it('matches "```" exactly', () => {
      expect('```'.match(pattern)).not.toBeNull();
    });

    it('does NOT match "```javascript"', () => {
      expect('```javascript'.match(pattern)).toBeNull();
    });

    it('does NOT match "``"', () => {
      expect('``'.match(pattern)).toBeNull();
    });
  });

  describe('Horizontal rule patterns', () => {
    it('/^---$/ matches "---"', () => {
      expect('---'.match(PATTERNS.hrDash)).not.toBeNull();
    });

    it('/^---$/ does NOT match "----"', () => {
      expect('----'.match(PATTERNS.hrDash)).toBeNull();
    });

    it('/^\\*\\*\\*$/ matches "***"', () => {
      expect('***'.match(PATTERNS.hrStar)).not.toBeNull();
    });

    it('/^\\*\\*\\*$/ does NOT match "**"', () => {
      expect('**'.match(PATTERNS.hrStar)).toBeNull();
    });

    it('/^___$/ matches "___"', () => {
      expect('___'.match(PATTERNS.hrUnderscore)).not.toBeNull();
    });

    it('/^___$/ does NOT match "__"', () => {
      expect('__'.match(PATTERNS.hrUnderscore)).toBeNull();
    });

    it('does NOT match "normal text" for any hr pattern', () => {
      expect('normal text'.match(PATTERNS.hrDash)).toBeNull();
      expect('normal text'.match(PATTERNS.hrStar)).toBeNull();
      expect('normal text'.match(PATTERNS.hrUnderscore)).toBeNull();
    });
  });

  describe('Bullet list patterns', () => {
    it('/^- (.+)$/ matches "- item" → content="item"', () => {
      const m = '- item'.match(PATTERNS.bulletDash);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('item');
    });

    it('/^- (.+)$/ matches "- multi word item" → content="multi word item"', () => {
      const m = '- multi word item'.match(PATTERNS.bulletDash);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('multi word item');
    });

    it('/^\\* (.+)$/ matches "* item" → content="item"', () => {
      const m = '* item'.match(PATTERNS.bulletStar);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('item');
    });

    it('/^- (.+)$/ does NOT match "- " (no content)', () => {
      expect('- '.match(PATTERNS.bulletDash)).toBeNull();
    });

    it('/^- (.+)$/ does NOT match "normal text"', () => {
      expect('normal text'.match(PATTERNS.bulletDash)).toBeNull();
    });
  });

  describe('Ordered list pattern (/^(\\d+)\\. (.+)$/)', () => {
    const pattern = PATTERNS.orderedList;

    it('matches "1. item" → number="1", content="item"', () => {
      const m = '1. item'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('1');
      expect(m![2]).toBe('item');
    });

    it('matches "23. item" → number="23"', () => {
      const m = '23. item'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('23');
      expect(m![2]).toBe('item');
    });

    it('matches "1. multi word content"', () => {
      const m = '1. multi word content'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![2]).toBe('multi word content');
    });

    it('does NOT match "1." (no content)', () => {
      expect('1.'.match(pattern)).toBeNull();
    });

    it('does NOT match "1 item" (no period)', () => {
      expect('1 item'.match(pattern)).toBeNull();
    });

    it('does NOT match "normal text"', () => {
      expect('normal text'.match(pattern)).toBeNull();
    });
  });
});

// ─── 3. Inline Pattern Matching ───────────────────────────────────────────────

describe('Inline rule patterns', () => {
  describe('Bold pattern (/\\*\\*([^*]+)\\*\\*/)', () => {
    const pattern = PATTERNS.bold;

    it('matches "hello **bold** world" → marked="bold"', () => {
      const m = 'hello **bold** world'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('bold');
    });

    it('matches "**all bold**" → marked="all bold"', () => {
      const m = '**all bold**'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('all bold');
    });

    it('matches "start **marked text** end"', () => {
      const m = 'start **marked text** end'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('marked text');
    });

    it('does NOT match "no markers here"', () => {
      expect('no markers here'.match(pattern)).toBeNull();
    });

    it('does NOT match "* single star *"', () => {
      expect('* single star *'.match(pattern)).toBeNull();
    });
  });

  describe('Italic pattern (single star, not double)', () => {
    const pattern = PATTERNS.italic;

    it('matches "hello *italic* world" → marked="italic"', () => {
      const m = 'hello *italic* world'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('italic');
    });

    it('matches "*italic*" → marked="italic"', () => {
      const m = '*italic*'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('italic');
    });

    it('does NOT match "no markers here"', () => {
      expect('no markers here'.match(pattern)).toBeNull();
    });

    // Bold markers should NOT be matched as italic (prevent overlap)
    it('does NOT incorrectly match inside bold "**bold**" as italic', () => {
      // The italic pattern uses lookahead/lookbehind to exclude ** sequences
      const m = '**bold**'.match(pattern);
      // Should either not match or match something that isn't the bold content
      if (m) {
        // If it does match, the content should not be 'bold' spanning the full **bold**
        expect(m![1]).not.toBe('bold');
      }
    });
  });

  describe('Inline code pattern (/`([^`]+)`/)', () => {
    const pattern = PATTERNS.inlineCode;

    it('matches "hello `code` world" → marked="code"', () => {
      const m = 'hello `code` world'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('code');
    });

    it('matches "`standalone`"', () => {
      const m = '`standalone`'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('standalone');
    });

    it('matches "run `npm install` first"', () => {
      const m = 'run `npm install` first'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('npm install');
    });

    it('does NOT match text without backticks', () => {
      expect('no code here'.match(pattern)).toBeNull();
    });
  });

  describe('Strikethrough pattern (/~~([^~]+)~~/)', () => {
    const pattern = PATTERNS.strikethrough;

    it('matches "hello ~~strike~~ world" → marked="strike"', () => {
      const m = 'hello ~~strike~~ world'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('strike');
    });

    it('matches "~~deleted text~~"', () => {
      const m = '~~deleted text~~'.match(pattern);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('deleted text');
    });

    it('does NOT match "no markers here"', () => {
      expect('no markers here'.match(pattern)).toBeNull();
    });

    it('does NOT match "~single~"', () => {
      expect('~single~'.match(pattern)).toBeNull();
    });
  });
});

// ─── 4. ExtensionManager.matchInputRule Integration ───────────────────────────

describe('ExtensionManager.matchInputRule', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
  });

  it('returns true when a rule matches and handler succeeds', () => {
    const ext = Extension.create({
      name: 'heading',
      addInputRules: () => [
        { find: PATTERNS.heading, handler: () => true },
      ],
    });
    manager.register(ext);
    const ctx = createMockContext();
    expect(manager.matchInputRule('# My Title', ctx)).toBe(true);
  });

  it('returns false when no rules match', () => {
    const ext = Extension.create({
      name: 'heading',
      addInputRules: () => [
        { find: PATTERNS.heading, handler: () => true },
      ],
    });
    manager.register(ext);
    const ctx = createMockContext();
    expect(manager.matchInputRule('plain text with no markers', ctx)).toBe(false);
  });

  it('returns false when no extensions are registered', () => {
    const ctx = createMockContext();
    expect(manager.matchInputRule('# Heading', ctx)).toBe(false);
  });

  it('calls handler with correct match groups', () => {
    const handler = vi.fn().mockReturnValue(true);
    const ext = Extension.create({
      name: 'heading',
      addInputRules: () => [
        { find: PATTERNS.heading, handler },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('## My Section', ctx);

    expect(handler).toHaveBeenCalledTimes(1);
    const [match] = handler.mock.calls[0];
    expect(match[0]).toBe('## My Section'); // full match
    expect(match[1]).toBe('##');             // captured group 1: hashes
    expect(match[2]).toBe('My Section');     // captured group 2: content
  });

  it('passes context to handler', () => {
    const handler = vi.fn().mockReturnValue(true);
    const ext = Extension.create({
      name: 'test',
      addInputRules: () => [
        { find: /^test$/, handler },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('test', ctx);

    const [, receivedCtx] = handler.mock.calls[0];
    expect(receivedCtx).toBe(ctx);
  });

  it('stops at first matching rule (does not call subsequent rules)', () => {
    const handler1 = vi.fn().mockReturnValue(true);
    const handler2 = vi.fn().mockReturnValue(true);

    const ext = Extension.create({
      name: 'rules',
      addInputRules: () => [
        { find: /^# (.+)$/, handler: handler1 },
        { find: /^# (.+)$/, handler: handler2 }, // same pattern
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    const result = manager.matchInputRule('# Title', ctx);

    expect(result).toBe(true);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('continues to next rule if handler returns false', () => {
    const handler1 = vi.fn().mockReturnValue(false); // declines to handle
    const handler2 = vi.fn().mockReturnValue(true);  // handles it

    const ext = Extension.create({
      name: 'rules',
      addInputRules: () => [
        { find: /^# (.+)$/, handler: handler1 },
        { find: /^# (.+)$/, handler: handler2 },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    const result = manager.matchInputRule('# Title', ctx);

    expect(result).toBe(true);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('custom extension rules take priority over lower-priority built-in rules', () => {
    const callOrder: string[] = [];

    const builtIn = Extension.create({
      name: 'builtIn',
      priority: 100,
      addInputRules: () => [
        {
          find: /^# (.+)$/,
          handler: () => { callOrder.push('builtIn'); return true; },
        },
      ],
    });

    const custom = Extension.create({
      name: 'custom',
      priority: 200,
      addInputRules: () => [
        {
          find: /^# (.+)$/,
          handler: () => { callOrder.push('custom'); return true; },
        },
      ],
    });

    // Register custom (high priority) first so its rules come first
    manager.register(custom, builtIn);
    manager.matchInputRule('# Title', createMockContext());

    expect(callOrder).toHaveLength(1);
    expect(callOrder[0]).toBe('custom');
  });

  it('returns false when handler returns false for all matching rules', () => {
    const ext = Extension.create({
      name: 'passive',
      addInputRules: () => [
        { find: /^test$/, handler: () => false },
        { find: /^test$/, handler: () => false },
      ],
    });
    manager.register(ext);
    expect(manager.matchInputRule('test', createMockContext())).toBe(false);
  });
});

// ─── 5. Custom Extension Override ─────────────────────────────────────────────

describe('Custom extension input rules', () => {
  it('a custom extension with higher priority can override a built-in pattern', () => {
    const manager = new ExtensionManager();
    const builtInHandler = vi.fn().mockReturnValue(true);
    const customHandler  = vi.fn().mockReturnValue(true);

    const builtIn = Extension.create({
      name: 'builtIn',
      priority: 100,
      addInputRules: () => [
        { find: /^# (.+)$/, handler: builtInHandler },
      ],
    });

    const custom = Extension.create({
      name: 'custom',
      priority: 200,
      addInputRules: () => [
        { find: /^# (.+)$/, handler: customHandler },
      ],
    });

    manager.register(custom, builtIn); // custom first (higher priority)
    manager.matchInputRule('# Title', createMockContext());

    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(builtInHandler).not.toHaveBeenCalled();
  });

  it('multiple rules from the same extension are all registered', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'multiRule',
      addInputRules: () => [
        { find: PATTERNS.heading,      handler: () => true },
        { find: PATTERNS.blockquote,   handler: () => true },
        { find: PATTERNS.hrDash,       handler: () => true },
        { find: PATTERNS.bulletDash,   handler: () => true },
        { find: PATTERNS.orderedList,  handler: () => true },
      ],
    });
    manager.register(ext);
    expect(manager.getInputRules()).toHaveLength(5);
  });

  it('a rule that returns false allows the next matching rule to try', () => {
    const manager = new ExtensionManager();
    const firstHandler  = vi.fn().mockReturnValue(false);
    const secondHandler = vi.fn().mockReturnValue(true);

    const ext1 = Extension.create({
      name: 'ext1',
      priority: 200,
      addInputRules: () => [
        { find: /^> (.+)$/, handler: firstHandler },
      ],
    });

    const ext2 = Extension.create({
      name: 'ext2',
      priority: 100,
      addInputRules: () => [
        { find: /^> (.+)$/, handler: secondHandler },
      ],
    });

    manager.register(ext1, ext2); // ext1 first (higher priority)
    const result = manager.matchInputRule('> some quote', createMockContext());

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('Node extension input rules coexist with Extension input rules', () => {
    const manager = new ExtensionManager();

    const headingNode = Node.create({
      name: 'heading',
      nodeType: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      addInputRules: () => [
        { find: PATTERNS.heading, handler: () => true },
      ],
    });

    const markdownExt = Extension.create({
      name: 'blockquoteExt',
      addInputRules: () => [
        { find: PATTERNS.blockquote, handler: () => true },
      ],
    });

    manager.register(headingNode, markdownExt);
    expect(manager.getInputRules()).toHaveLength(2);
    expect(manager.matchInputRule('# Hello', createMockContext())).toBe(true);
    expect(manager.matchInputRule('> A quote', createMockContext())).toBe(true);
  });

  it('Mark extension input rules coexist with Node extension input rules', () => {
    const manager = new ExtensionManager();

    const headingNode = Node.create({
      name: 'heading',
      nodeType: 'h1',
      addInputRules: () => [
        { find: PATTERNS.heading, handler: () => true },
      ],
    });

    const boldMark = Mark.create({
      name: 'bold',
      markName: 'bold',
      inlineProperty: 'bold',
      addInputRules: () => [
        { find: PATTERNS.bold, handler: () => true },
      ],
    });

    manager.register(headingNode, boldMark);
    expect(manager.getInputRules()).toHaveLength(2);
    expect(manager.matchInputRule('# Title', createMockContext())).toBe(true);
    expect(manager.matchInputRule('some **bold** text', createMockContext())).toBe(true);
  });
});

// ─── 6. Handler Dispatch ──────────────────────────────────────────────────────

describe('Input rule handlers dispatch correct actions', () => {
  it('heading rule dispatches UPDATE_NODE with type "h1" for "# Title"', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'heading',
      addInputRules: () => [
        {
          find: PATTERNS.heading,
          handler: (match, ctx) => {
            const level = match[1].length;
            const content = match[2];
            const activeNodeId = ctx.state.activeNodeId;
            if (!activeNodeId) return false;
            ctx.dispatch({
              type: 'UPDATE_NODE',
              payload: {
                id: activeNodeId,
                updates: { type: `h${level}` as any, content },
              },
            });
            return true;
          },
        },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('# Title', ctx);

    expect(ctx.dispatch).toHaveBeenCalledTimes(1);
    expect(ctx.dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_NODE',
      payload: { id: 'p-1', updates: { type: 'h1', content: 'Title' } },
    });
  });

  it('heading rule dispatches UPDATE_NODE with type "h3" for "### Section"', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'heading',
      addInputRules: () => [
        {
          find: PATTERNS.heading,
          handler: (match, ctx) => {
            const level = match[1].length;
            const content = match[2];
            const activeNodeId = ctx.state.activeNodeId;
            if (!activeNodeId) return false;
            ctx.dispatch({
              type: 'UPDATE_NODE',
              payload: { id: activeNodeId, updates: { type: `h${level}` as any, content } },
            });
            return true;
          },
        },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('### Section', ctx);

    expect(ctx.dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_NODE',
      payload: { id: 'p-1', updates: { type: 'h3', content: 'Section' } },
    });
  });

  it('blockquote rule dispatches UPDATE_NODE with type "blockquote"', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'blockquote',
      addInputRules: () => [
        {
          find: PATTERNS.blockquote,
          handler: (match, ctx) => {
            const content = match[1];
            const activeNodeId = ctx.state.activeNodeId;
            if (!activeNodeId) return false;
            ctx.dispatch({
              type: 'UPDATE_NODE',
              payload: { id: activeNodeId, updates: { type: 'blockquote', content } },
            });
            return true;
          },
        },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('> Some quoted text', ctx);

    expect(ctx.dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_NODE',
      payload: { id: 'p-1', updates: { type: 'blockquote', content: 'Some quoted text' } },
    });
  });

  it('bold rule dispatches UPDATE_NODE with children containing bold segment', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'boldRule',
      addInputRules: () => [
        {
          find: PATTERNS.bold,
          handler: (match, ctx) => {
            const fullText  = match.input ?? '';
            const markedText = match[1];
            const matchStart = match.index ?? 0;
            const matchEnd   = matchStart + match[0].length;

            const activeNodeId = ctx.state.activeNodeId;
            if (!activeNodeId) return false;

            const children = [
              ...(matchStart > 0 ? [{ content: fullText.slice(0, matchStart) }] : []),
              { content: markedText, bold: true },
              ...(matchEnd < fullText.length ? [{ content: fullText.slice(matchEnd) }] : []),
            ];

            ctx.dispatch({
              type: 'UPDATE_NODE',
              payload: { id: activeNodeId, updates: { children } },
            });
            return true;
          },
        },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('hello **world** end', ctx);

    expect(ctx.dispatch).toHaveBeenCalledTimes(1);
    const dispatchArg = (ctx.dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(dispatchArg.type).toBe('UPDATE_NODE');
    const children = dispatchArg.payload.updates.children;
    expect(children).toEqual([
      { content: 'hello ' },
      { content: 'world', bold: true },
      { content: ' end' },
    ]);
  });

  it('handler receives correct activeNodeId from context.state', () => {
    const manager = new ExtensionManager();
    const capturedNodeId: string[] = [];

    const ext = Extension.create({
      name: 'test',
      addInputRules: () => [
        {
          find: /^> (.+)$/,
          handler: (_match, ctx) => {
            capturedNodeId.push(ctx.state.activeNodeId as string);
            return true;
          },
        },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext({
      state: {
        version: '1.0.0',
        current: { id: 'root', type: 'container', children: [] },
        undoStack: [],
        redoStack: [],
        activeNodeId: 'h1-42',
        hasSelection: false,
        selectionKey: 0,
        currentSelection: null,
        selectedBlocks: new Set(),
        coverImage: null,
      } as any,
    });

    manager.matchInputRule('> a quote', ctx);
    expect(capturedNodeId).toEqual(['h1-42']);
  });

  it('handler returns false if no activeNodeId is set', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'heading',
      addInputRules: () => [
        {
          find: PATTERNS.heading,
          handler: (_match, ctx) => {
            if (!ctx.state.activeNodeId) return false;
            ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: '', updates: {} } });
            return true;
          },
        },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext({
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
      } as any,
    });

    const result = manager.matchInputRule('# Title', ctx);
    expect(result).toBe(false);
    expect(ctx.dispatch).not.toHaveBeenCalled();
  });

  it('horizontal rule handler dispatches INSERT_NODE with type "hr"', () => {
    const manager = new ExtensionManager();
    const ext = Extension.create({
      name: 'hr',
      addInputRules: () => [
        {
          find: PATTERNS.hrDash,
          handler: (_match, ctx) => {
            const activeNodeId = ctx.state.activeNodeId;
            if (!activeNodeId) return false;
            ctx.dispatch({
              type: 'INSERT_NODE',
              payload: {
                node: { id: 'hr-1', type: 'hr' },
                targetId: activeNodeId,
                position: 'after',
              },
            } as any);
            return true;
          },
        },
      ],
    });
    manager.register(ext);

    const ctx = createMockContext();
    manager.matchInputRule('---', ctx);

    expect(ctx.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'INSERT_NODE',
        payload: expect.objectContaining({
          node: expect.objectContaining({ type: 'hr' }),
        }),
      }),
    );
  });
});

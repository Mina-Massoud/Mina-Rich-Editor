/**
 * StarterKit Tests
 *
 * Verifies that the StarterKit bundle contains the expected extensions
 * and that ExtensionManager registers them correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StarterKit } from '../starter-kit';
import { ExtensionManager } from '../ExtensionManager';

// ---------------------------------------------------------------------------
// Expected values — kept in sync with block-utils.ts getTypeClassName()
// ---------------------------------------------------------------------------

const EXPECTED_NODE_STYLES: Record<string, string> = {
  h1: 'text-4xl font-bold text-foreground leading-[1.2] mb-2',
  h2: 'text-3xl font-bold text-foreground leading-[1.2] mb-1.5',
  h3: 'text-2xl font-bold text-foreground leading-[1.2] mb-1',
  h4: 'text-xl font-semibold text-foreground leading-[1.3] mb-1',
  h5: 'text-lg font-semibold text-foreground leading-[1.4] mb-0.5',
  h6: 'text-base font-semibold text-foreground leading-[1.4] mb-0.5',
  p: 'text-base text-foreground leading-[1.6]',
  ol: 'text-base text-foreground leading-[1.6] list-decimal list-inside',
  li: 'text-base text-foreground leading-[1.6] list-disc list-inside',
  blockquote: 'text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-1',
  code: 'font-mono text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg whitespace-pre-wrap break-words',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StarterKit', () => {
  it('is an array', () => {
    expect(Array.isArray(StarterKit)).toBe(true);
  });

  it('contains the expected number of extensions', () => {
    expect(StarterKit.length).toBe(22); // 16 nodes + 6 marks
  });

  it('all entries have a kind of node or mark', () => {
    for (const ext of StarterKit) {
      expect(['node', 'mark']).toContain(ext.kind);
    }
  });

  it('contains 16 node extensions', () => {
    const nodes = StarterKit.filter((e) => e.kind === 'node');
    expect(nodes).toHaveLength(16);
  });

  it('contains 6 mark extensions', () => {
    const marks = StarterKit.filter((e) => e.kind === 'mark');
    expect(marks).toHaveLength(6);
  });
});

describe('ExtensionManager (loaded with StarterKit)', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    manager = new ExtensionManager();
    manager.register(...StarterKit);
  });

  // ── Node registration ────────────────────────────────────────────────────

  it('registers all built-in node types', () => {
    const expected = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'li', 'ol', 'hr', 'img', 'video', 'br'];
    for (const nodeType of expected) {
      expect(manager.hasNodeType(nodeType)).toBe(true);
    }
  });

  it('registers table structural nodes', () => {
    for (const nodeType of ['table', 'thead', 'tbody', 'tr', 'th', 'td']) {
      expect(manager.hasNodeType(nodeType)).toBe(true);
    }
  });

  // ── Mark registration ────────────────────────────────────────────────────

  it('registers all built-in mark names', () => {
    for (const markName of ['bold', 'italic', 'underline', 'strikethrough', 'code', 'link']) {
      expect(manager.hasMarkName(markName)).toBe(true);
    }
  });

  // ── Node styles — compared against hardcoded values in block-utils.ts ──

  for (const [nodeType, expectedStyle] of Object.entries(EXPECTED_NODE_STYLES)) {
    it(`getNodeStyles returns correct classes for ${nodeType}`, () => {
      expect(manager.getNodeStyles(nodeType)).toBe(expectedStyle);
    });
  }

  it('getNodeStyles returns undefined for unregistered node', () => {
    expect(manager.getNodeStyles('unknown-node')).toBeUndefined();
  });

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  it('aggregates keyboard shortcuts from all extensions', () => {
    const shortcuts = manager.getRegisteredShortcuts();
    expect(shortcuts.has('Mod-b')).toBe(true);
    expect(shortcuts.has('Mod-i')).toBe(true);
    expect(shortcuts.has('Mod-u')).toBe(true);
    expect(shortcuts.has('Mod-e')).toBe(true);
    expect(shortcuts.has('Mod-k')).toBe(true);
  });

  // ── Mark extension properties ────────────────────────────────────────────

  it('bold mark has correct inlineProperty', () => {
    const bold = manager.getMarkExtension('bold');
    expect(bold?.config.inlineProperty).toBe('bold');
  });

  it('italic mark has correct inlineProperty', () => {
    const italic = manager.getMarkExtension('italic');
    expect(italic?.config.inlineProperty).toBe('italic');
  });

  it('underline mark has correct inlineProperty', () => {
    const underline = manager.getMarkExtension('underline');
    expect(underline?.config.inlineProperty).toBe('underline');
  });

  it('strikethrough mark has correct inlineProperty', () => {
    const strikethrough = manager.getMarkExtension('strikethrough');
    expect(strikethrough?.config.inlineProperty).toBe('strikethrough');
  });

  it('code mark has correct inlineProperty', () => {
    const code = manager.getMarkExtension('code');
    expect(code?.config.inlineProperty).toBe('code');
  });

  it('link mark has correct inlineProperty', () => {
    const link = manager.getMarkExtension('link');
    expect(link?.config.inlineProperty).toBe('href');
  });

  // ── renderHTML ───────────────────────────────────────────────────────────

  it('bold renderHTML returns <strong>', () => {
    const bold = manager.getMarkExtension('bold');
    expect(bold?.config.renderHTML?.()).toBe('<strong>');
  });

  it('italic renderHTML returns <em>', () => {
    const italic = manager.getMarkExtension('italic');
    expect(italic?.config.renderHTML?.()).toBe('<em>');
  });

  it('link renderHTML includes href attr', () => {
    const link = manager.getMarkExtension('link');
    expect(link?.config.renderHTML?.({ href: 'https://example.com' })).toContain('https://example.com');
  });

  it('link renderHTML with no attrs falls back gracefully', () => {
    const link = manager.getMarkExtension('link');
    expect(link?.config.renderHTML?.()).toBe('<a href="">');
  });
});

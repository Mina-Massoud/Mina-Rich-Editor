/**
 * Theme preset smoke tests
 *
 * Verifies that each CSS theme file:
 *   1. Exists and is non-empty
 *   2. Targets the correct scoped selector
 *   3. Includes a dark-mode section
 *   4. Overrides the three minimum theming variables:
 *        --mina-font-body, --mina-color-text, --mina-color-bg
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const THEMES_DIR = path.resolve(__dirname, '../../styles/themes');

const themes = [
  {
    name: 'notion',
    file: path.join(THEMES_DIR, 'notion.css'),
    selector: '.mina-editor.theme-notion',
    darkSelector: '.dark .mina-editor.theme-notion',
  },
  {
    name: 'minimal',
    file: path.join(THEMES_DIR, 'minimal.css'),
    selector: '.mina-editor.theme-minimal',
    darkSelector: '.dark .mina-editor.theme-minimal',
  },
  {
    name: 'github',
    file: path.join(THEMES_DIR, 'github.css'),
    selector: '.mina-editor.theme-github',
    darkSelector: '.dark .mina-editor.theme-github',
  },
] as const;

for (const theme of themes) {
  describe(`theme-${theme.name}`, () => {
    let css: string;

    it('file exists and is non-empty', () => {
      expect(fs.existsSync(theme.file), `${theme.file} must exist`).toBe(true);
      css = fs.readFileSync(theme.file, 'utf8');
      expect(css.trim().length).toBeGreaterThan(0);
    });

    it('contains the correct scoped selector', () => {
      if (!css) css = fs.readFileSync(theme.file, 'utf8');
      expect(css).toContain(theme.selector);
    });

    it('contains a dark mode override section', () => {
      if (!css) css = fs.readFileSync(theme.file, 'utf8');
      // Accept either .dark or [data-theme="dark"] dark-mode patterns
      const hasDarkClass = css.includes(theme.darkSelector);
      const hasDarkAttr = css.includes(`[data-theme="dark"] .mina-editor.theme-${theme.name}`);
      expect(hasDarkClass || hasDarkAttr, 'must have at least one dark-mode selector').toBe(true);
    });

    it('overrides --mina-font-body', () => {
      if (!css) css = fs.readFileSync(theme.file, 'utf8');
      expect(css).toContain('--mina-font-body');
    });

    it('overrides --mina-color-text', () => {
      if (!css) css = fs.readFileSync(theme.file, 'utf8');
      expect(css).toContain('--mina-color-text');
    });

    it('overrides --mina-color-bg', () => {
      if (!css) css = fs.readFileSync(theme.file, 'utf8');
      expect(css).toContain('--mina-color-bg');
    });
  });
}

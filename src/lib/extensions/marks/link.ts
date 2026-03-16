import { Mark } from '../Mark';

export const Link = Mark.create({
  name: 'link',
  markName: 'link',
  inlineProperty: 'href',
  parseHTML: () => [{ tag: 'a[href]' }],
  renderHTML: (attrs) => `<a href="${attrs?.href || ''}">`,
  addKeyboardShortcuts: () => ({
    'Mod-k': (_ctx) => {
      // Toggle link popover — will be wired up in Phase 3
      return true;
    },
  }),
});

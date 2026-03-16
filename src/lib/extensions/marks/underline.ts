import { Mark } from '../Mark';

export const Underline = Mark.create({
  name: 'underline',
  markName: 'underline',
  inlineProperty: 'underline',
  parseHTML: () => [
    { tag: 'u' },
    { style: 'text-decoration=underline' },
  ],
  renderHTML: () => '<u>',
  addKeyboardShortcuts: () => ({
    'Mod-u': (ctx) => {
      ctx.dispatch({ type: 'TOGGLE_FORMAT', payload: { format: 'underline' } } as any);
      return true;
    },
  }),
});

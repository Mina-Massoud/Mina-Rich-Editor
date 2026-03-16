import { Mark } from '../Mark';

export const Italic = Mark.create({
  name: 'italic',
  markName: 'italic',
  inlineProperty: 'italic',
  parseHTML: () => [
    { tag: 'em' },
    { tag: 'i' },
    { style: 'font-style=italic' },
  ],
  renderHTML: () => '<em>',
  addKeyboardShortcuts: () => ({
    'Mod-i': (ctx) => {
      ctx.dispatch({ type: 'TOGGLE_FORMAT', payload: { format: 'italic' } } as any);
      return true;
    },
  }),
  addInputRules: () => [{
    find: /^([\s\S]*?)(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)([\s\S]*)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      const [, before, marked, after] = match;
      const children: any[] = [];
      if (before) children.push({ content: before });
      children.push({ content: marked, italic: true });
      if (after) children.push({ content: after });
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { children, content: undefined } } });
      return true;
    },
  }],
});

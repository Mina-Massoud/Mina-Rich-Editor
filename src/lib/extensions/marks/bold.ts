import { Mark } from '../Mark';

export const Bold = Mark.create({
  name: 'bold',
  markName: 'bold',
  inlineProperty: 'bold',
  parseHTML: () => [
    { tag: 'strong' },
    { tag: 'b' },
    { style: 'font-weight=bold' },
    { style: 'font-weight=700' },
  ],
  renderHTML: () => '<strong>',
  addKeyboardShortcuts: () => ({
    'Mod-b': (ctx) => {
      ctx.dispatch({ type: 'TOGGLE_FORMAT', payload: { format: 'bold' } } as any);
      return true;
    },
  }),
  addInputRules: () => [{
    find: /^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      const [, before, marked, after] = match;
      const children: any[] = [];
      if (before) children.push({ content: before });
      children.push({ content: marked, bold: true });
      if (after) children.push({ content: after });
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { children, content: undefined } } });
      return true;
    },
  }],
});

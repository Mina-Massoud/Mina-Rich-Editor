import { Mark } from '../Mark';

export const InlineCode = Mark.create({
  name: 'code',
  markName: 'code',
  inlineProperty: 'code',
  parseHTML: () => [{ tag: 'code' }],
  renderHTML: () => '<code>',
  addKeyboardShortcuts: () => ({
    'Mod-e': (ctx) => {
      ctx.dispatch({ type: 'TOGGLE_FORMAT', payload: { format: 'code' } } as any);
      return true;
    },
  }),
  addInputRules: () => [{
    find: /^([\s\S]*?)(?<!`)`(?!`)(.+?)(?<!`)`(?!`)([\s\S]*)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      const [, before, marked, after] = match;
      const children: any[] = [];
      if (before) children.push({ content: before });
      children.push({ content: marked, code: true });
      if (after) children.push({ content: after });
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { children, content: undefined } } });
      return true;
    },
  }],
});

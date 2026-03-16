import { Mark } from '../Mark';

export const Strikethrough = Mark.create({
  name: 'strikethrough',
  markName: 'strikethrough',
  inlineProperty: 'strikethrough',
  parseHTML: () => [
    { tag: 'del' },
    { tag: 's' },
    { tag: 'strike' },
    { style: 'text-decoration=line-through' },
  ],
  renderHTML: () => '<del>',
  addInputRules: () => [{
    find: /^([\s\S]*?)~~(.+?)~~([\s\S]*)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      const [, before, marked, after] = match;
      const children: any[] = [];
      if (before) children.push({ content: before });
      children.push({ content: marked, strikethrough: true });
      if (after) children.push({ content: after });
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { children, content: undefined } } });
      return true;
    },
  }],
});

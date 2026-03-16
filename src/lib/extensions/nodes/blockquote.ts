import { Node } from '../Node';

export const Blockquote = Node.create({
  name: 'blockquote',
  nodeType: 'blockquote',
  group: 'block',
  addStyles: () => 'text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-1',
  addInputRules: () => [{
    find: /^>\s(.+)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { type: 'blockquote', content: match[1], children: undefined, lines: undefined } } });
      return true;
    },
  }],
});

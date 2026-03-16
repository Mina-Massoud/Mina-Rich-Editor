import { Node } from '../Node';

export const HorizontalRule = Node.create({
  name: 'horizontalRule',
  nodeType: 'hr',
  group: 'block',
  addInputRules: () => [{
    find: /^(-{3,}|\*{3,}|_{3,})$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { type: 'hr', content: '', children: undefined, lines: undefined } } });
      return true;
    },
  }],
});

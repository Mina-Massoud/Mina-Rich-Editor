import { Node } from '../Node';

export const BulletList = Node.create({
  name: 'bulletList',
  nodeType: 'li',
  group: 'block',
  addStyles: () => 'text-base text-foreground leading-[1.6] list-disc list-inside',
  addInputRules: () => [{
    find: /^[-*]\s(.+)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { type: 'li', content: match[1], children: undefined, lines: undefined } } });
      return true;
    },
  }],
});

export const OrderedList = Node.create({
  name: 'orderedList',
  nodeType: 'ol',
  group: 'block',
  addStyles: () => 'text-base text-foreground leading-[1.6] list-decimal list-inside',
  addInputRules: () => [{
    find: /^(\d+)\.\s(.+)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { type: 'ol', content: match[2], children: undefined, lines: undefined } } });
      return true;
    },
  }],
});

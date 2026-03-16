import { Node } from '../Node';

export const CodeBlock = Node.create({
  name: 'codeBlock',
  nodeType: 'code',
  group: 'block',
  addStyles: () => 'font-mono text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg whitespace-pre-wrap break-words',
  addInputRules: () => [{
    find: /^```$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { type: 'code', content: '', children: undefined, lines: undefined } } });
      return true;
    },
  }],
});

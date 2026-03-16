import { Node } from '../Node';

export const Heading1 = Node.create({
  name: 'heading1',
  nodeType: 'h1',
  group: 'block',
  addStyles: () => 'text-4xl font-bold text-foreground leading-[1.2] mb-2',
  addInputRules: () => [{
    find: /^(#{1,6})\s(.+)$/,
    handler: (match, ctx) => {
      const nodeId = ctx.state.activeNodeId;
      if (!nodeId) return false;
      const level = match[1].length;
      const type = `h${level}` as any;
      ctx.dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates: { type, content: match[2], children: undefined, lines: undefined } } });
      return true;
    },
  }],
});

export const Heading2 = Node.create({
  name: 'heading2',
  nodeType: 'h2',
  group: 'block',
  addStyles: () => 'text-3xl font-bold text-foreground leading-[1.2] mb-1.5',
});

export const Heading3 = Node.create({
  name: 'heading3',
  nodeType: 'h3',
  group: 'block',
  addStyles: () => 'text-2xl font-bold text-foreground leading-[1.2] mb-1',
});

export const Heading4 = Node.create({
  name: 'heading4',
  nodeType: 'h4',
  group: 'block',
  addStyles: () => 'text-xl font-semibold text-foreground leading-[1.3] mb-1',
});

export const Heading5 = Node.create({
  name: 'heading5',
  nodeType: 'h5',
  group: 'block',
  addStyles: () => 'text-lg font-semibold text-foreground leading-[1.4] mb-0.5',
});

export const Heading6 = Node.create({
  name: 'heading6',
  nodeType: 'h6',
  group: 'block',
  addStyles: () => 'text-base font-semibold text-foreground leading-[1.4] mb-0.5',
});

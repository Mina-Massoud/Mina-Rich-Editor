import { Node } from '../Node';

export const Paragraph = Node.create({
  name: 'paragraph',
  nodeType: 'p',
  group: 'block',
  addStyles: () => 'text-base text-foreground leading-[1.6]',
});

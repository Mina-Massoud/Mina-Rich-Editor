import { Node } from '../Node';

export const Table = Node.create({
  name: 'table',
  nodeType: ['table', 'thead', 'tbody', 'tr', 'th', 'td'],
  group: 'structural',
});

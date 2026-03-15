import { describe, it, expect } from 'vitest';
import { isContainerNode, isTextNode, isStructuralNode } from '@/lib/types';

describe('smoke test – test setup', () => {
  it('imports runtime helpers from @/lib/types', () => {
    expect(isContainerNode).toBeDefined();
    expect(typeof isContainerNode).toBe('function');
  });

  it('isTextNode is a function', () => {
    expect(isTextNode).toBeDefined();
    expect(typeof isTextNode).toBe('function');
  });

  it('isStructuralNode is a function', () => {
    expect(isStructuralNode).toBeDefined();
    expect(typeof isStructuralNode).toBe('function');
  });
});

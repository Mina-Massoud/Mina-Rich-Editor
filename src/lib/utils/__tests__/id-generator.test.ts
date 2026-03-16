import { describe, it, expect, beforeEach } from 'vitest';
import { generateId, resetIdCounter } from '../id-generator';

describe('generateId', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('returns string with default prefix "node"', () => {
    const id = generateId();
    expect(id).toMatch(/^node-/);
  });

  it('uses custom prefix', () => {
    const id = generateId('block');
    expect(id).toMatch(/^block-/);
  });

  it('generates incrementing IDs (counter part changes)', () => {
    const id1 = generateId();
    const id2 = generateId();
    // Extract counter part (second segment)
    const counter1 = parseInt(id1.split('-')[1], 10);
    const counter2 = parseInt(id2.split('-')[1], 10);
    expect(counter2).toBe(counter1 + 1);
  });

  it('generates unique IDs (no duplicates in 100 calls)', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('format is "prefix-counter"', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test-\d+$/);
  });

  it('each call increments counter', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();
    expect(parseInt(id1.split('-')[1], 10)).toBe(1);
    expect(parseInt(id2.split('-')[1], 10)).toBe(2);
    expect(parseInt(id3.split('-')[1], 10)).toBe(3);
  });
});

describe('resetIdCounter', () => {
  it('resets counter so next ID starts from 1', () => {
    generateId();
    generateId();
    generateId();
    resetIdCounter();
    const id = generateId();
    expect(parseInt(id.split('-')[1], 10)).toBe(1);
  });
});

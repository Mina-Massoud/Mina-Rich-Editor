let counter = 0;

/** Generates a unique node ID with an optional prefix, combining a monotonic counter and random suffix. */
export function generateId(prefix: string = 'node'): string {
  return `${prefix}-${++counter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Resets the internal ID counter to zero, useful for deterministic output in tests. */
export function resetIdCounter(): void {
  counter = 0;
}

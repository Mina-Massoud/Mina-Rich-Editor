let counter = 0;

/** Generates a unique, deterministic node ID with an optional prefix using a monotonic counter. */
export function generateId(prefix: string = 'node'): string {
  return `${prefix}-${++counter}`;
}

/** Resets the internal ID counter to zero, useful for deterministic output in tests. */
export function resetIdCounter(): void {
  counter = 0;
}

/**
 * Mina Rich Editor - Collaboration Module
 *
 * Re-exports the public API surface for the collaboration system.
 *
 * @packageDocumentation
 */

export type { CollabOptions, CollabState, CollabUser } from './types';
export { REMOTE_ORIGIN } from './types';

export {
  applyOperationToYDoc,
  syncYDocToStore,
  initYDocFromContainer,
} from './y-binding';

export type { AwarenessManager } from './awareness';
export { createAwarenessManager } from './awareness';

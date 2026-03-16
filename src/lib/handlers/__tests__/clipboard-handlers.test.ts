/**
 * Unit tests for clipboard-handlers.ts
 *
 * Covers:
 *  1. createHandlePaste — single-line plain text is NOT intercepted
 *  2. createHandlePaste — multi-line plain text IS intercepted and dispatches nodes
 *  3. createHandlePaste — media file items cause an early return (no dispatch)
 *  4. createHandleCopy  — factory returns a callable function
 *  5. createHandleCut   — factory returns a callable function
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createHandlePaste,
  createHandleCopy,
  createHandleCut,
  ClipboardHandlerParams,
} from '@/lib/handlers/clipboard-handlers';
import type { ContainerNode } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal ContainerNode used as the editor root during tests. */
function makeContainer(childIds: string[] = ['node-1']): ContainerNode {
  return {
    id: 'root',
    type: 'container',
    children: childIds.map((id) => ({ id, type: 'p', content: 'text' })),
  };
}

/**
 * Build a mock ClipboardHandlerParams.
 * `dispatch` is always a vi.fn() spy so we can assert calls.
 */
function makeParams(activeNodeId: string | null = 'node-1'): {
  params: ClipboardHandlerParams;
  dispatch: ReturnType<typeof vi.fn>;
} {
  const dispatch = vi.fn();
  const params: ClipboardHandlerParams = {
    getContainer: () => makeContainer(),
    getActiveNodeId: () => activeNodeId,
    dispatch,
  };
  return { params, dispatch };
}

/**
 * Build a mock ClipboardEvent.
 * `text/plain` and `text/html` can be supplied; `items` defaults to an empty array.
 */
function makeClipboardEvent(options: {
  plain?: string;
  html?: string;
  items?: Array<{ kind: string; type: string }>;
}): any {
  const { plain = '', html = '', items = [] } = options;
  return {
    clipboardData: {
      getData: (type: string) => {
        if (type === 'text/plain') return plain;
        if (type === 'text/html') return html;
        return '';
      },
      items,
    },
    preventDefault: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createHandleCopy', () => {
  it('returns a function', () => {
    const { params } = makeParams();
    const handler = createHandleCopy(params);
    expect(typeof handler).toBe('function');
  });

  it('returned function is callable without throwing', () => {
    const { params } = makeParams();
    const handler = createHandleCopy(params);
    expect(() => handler(makeClipboardEvent({}) as any)).not.toThrow();
  });
});

describe('createHandleCut', () => {
  it('returns a function', () => {
    const { params } = makeParams();
    const handler = createHandleCut(params);
    expect(typeof handler).toBe('function');
  });

  it('returned function is callable without throwing', () => {
    const { params } = makeParams();
    const handler = createHandleCut(params);
    expect(() => handler(makeClipboardEvent({}) as any)).not.toThrow();
  });
});

describe('createHandlePaste', () => {
  // ── 1. Single-line plain text ───────────────────────────────────────────

  describe('single-line plain text (no HTML)', () => {
    it('does NOT call preventDefault — browser handles inline insert', () => {
      const { params } = makeParams();
      const handler = createHandlePaste(params);
      const event = makeClipboardEvent({ plain: 'hello world' });

      handler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does NOT dispatch any action', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: 'single line' }));

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('single-line text WITH HTML formatting', () => {
    it('does NOT call preventDefault — browser handles it', () => {
      const { params } = makeParams();
      const handler = createHandlePaste(params);
      const event = makeClipboardEvent({
        plain: 'hello world',
        html: '<p>hello world</p>',
      });

      handler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does NOT dispatch any action', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: 'hi', html: '<b>hi</b>' }));

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  // ── 2. Multi-line plain text ────────────────────────────────────────────

  describe('multi-line plain text', () => {
    it('calls preventDefault to suppress browser default', () => {
      const { params } = makeParams();
      const handler = createHandlePaste(params);
      const event = makeClipboardEvent({ plain: 'line one\nline two' });

      handler(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('dispatches an action to insert nodes', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: 'line one\nline two' }));

      expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('dispatches a batch action when there are multiple lines', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: 'line one\nline two\nline three' }));

      const action = dispatch.mock.calls[0][0];
      // A batch action has type 'BATCH' and wraps an array of child actions
      expect(action.type).toBe('BATCH');
    });

    it('dispatches a single insertNode action for exactly two non-empty lines', () => {
      // Two lines → two nodes → batch
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: 'alpha\nbeta' }));

      const action = dispatch.mock.calls[0][0];
      expect(action.type).toBe('BATCH');
      expect(action.payload.actions).toHaveLength(2);
    });

    it('wraps each non-empty line in a paragraph node', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: 'foo\nbar' }));

      const action = dispatch.mock.calls[0][0];
      const childActions = action.payload.actions as any[];
      expect(childActions[0].payload.node.type).toBe('p');
      expect(childActions[1].payload.node.type).toBe('p');
    });

    it('preserves the text content of each line', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: 'foo\nbar' }));

      const action = dispatch.mock.calls[0][0];
      const childActions = action.payload.actions as any[];
      expect(childActions[0].payload.node.content).toBe('foo');
      expect(childActions[1].payload.node.content).toBe('bar');
    });
  });

  // ── 3. Media file items ─────────────────────────────────────────────────

  describe('media file items in clipboard', () => {
    it('returns early and does NOT call preventDefault for image files', () => {
      const { params } = makeParams();
      const handler = createHandlePaste(params);
      const event = makeClipboardEvent({
        plain: '',
        items: [{ kind: 'file', type: 'image/png' }],
      });

      handler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does NOT dispatch any action when a video file is present', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(
        makeClipboardEvent({
          plain: 'some text\nmore text',
          items: [{ kind: 'file', type: 'video/mp4' }],
        })
      );

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('does NOT return early for non-media file kinds (e.g. string items)', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(
        makeClipboardEvent({
          plain: 'line one\nline two',
          items: [{ kind: 'string', type: 'text/plain' }],
        })
      );

      // Should reach multi-line handling and dispatch
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns early when clipboardData is absent', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      // e.clipboardData is null/undefined
      handler({ clipboardData: null, preventDefault: vi.fn() } as any);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when multi-line text consists only of blank lines', () => {
      const { params, dispatch } = makeParams();
      const handler = createHandlePaste(params);

      handler(makeClipboardEvent({ plain: '\n\n\n' }));

      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});

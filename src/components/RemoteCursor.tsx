/**
 * Mina Rich Editor - RemoteCursor Component
 *
 * Renders a colored caret with a floating name label representing a
 * remote collaborator's cursor position inside the editor.
 *
 * ## How it works
 *
 * The cursor is positioned **absolutely** within the editor's relatively-
 * positioned container. The `nodeId` + `offset` from the awareness
 * protocol is used to locate the correct DOM element and measure the
 * pixel coordinates via `Range` / `getBoundingClientRect`.
 *
 * The label fades out after a configurable period of inactivity.
 *
 * @packageDocumentation
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { CollabUser } from '../lib/collaboration/types';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RemoteCursorProps {
  /** The collaborator whose cursor to render. */
  user: CollabUser;

  /**
   * The DOM element that acts as the positioning parent for the cursor.
   * Typically the editor's scrollable container.
   */
  containerRef: React.RefObject<HTMLElement | null>;

  /**
   * Milliseconds of cursor inactivity before the name label fades out.
   * @default 3000
   */
  fadeAfterMs?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a remote user's cursor as a thin colored line with a name
 * tooltip. Automatically repositions when the cursor data changes.
 */
export const RemoteCursor = React.memo(function RemoteCursor({
  user,
  containerRef,
  fadeAfterMs = 3000,
}: RemoteCursorProps) {
  const [position, setPosition] = useState<{ top: number; left: number; height: number } | null>(null);
  const [labelVisible, setLabelVisible] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Measure cursor position from DOM ────────────────────────────────────

  useEffect(() => {
    if (!user.cursor || !containerRef.current) {
      setPosition(null);
      return;
    }

    const { nodeId, offset } = user.cursor;

    // Find the DOM element that corresponds to the node.
    const el = containerRef.current.querySelector(`[data-node-id="${nodeId}"]`);
    if (!el) {
      setPosition(null);
      return;
    }

    // Walk into the first text node to build a Range.
    const textNode = findFirstTextNode(el);
    if (!textNode) {
      // Fallback: position at the start of the element.
      const rect = el.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - containerRect.top + containerRef.current.scrollTop,
        left: rect.left - containerRect.left + containerRef.current.scrollLeft,
        height: rect.height || 20,
      });
      return;
    }

    try {
      const range = document.createRange();
      const clampedOffset = Math.min(offset, textNode.textContent?.length ?? 0);
      range.setStart(textNode, clampedOffset);
      range.collapse(true);

      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setPosition({
        top: rect.top - containerRect.top + containerRef.current.scrollTop,
        left: rect.left - containerRect.left + containerRef.current.scrollLeft,
        height: rect.height || 20,
      });
    } catch {
      setPosition(null);
    }
  }, [user.cursor, containerRef]);

  // ── Fade label after inactivity ─────────────────────────────────────────

  useEffect(() => {
    setLabelVisible(true);

    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setLabelVisible(false);
    }, fadeAfterMs);

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [user.cursor, fadeAfterMs]);

  // ── Styles ──────────────────────────────────────────────────────────────

  const caretStyle = useMemo<React.CSSProperties>(() => {
    if (!position) return { display: 'none' };
    return {
      position: 'absolute',
      top: position.top,
      left: position.left,
      width: 2,
      height: position.height,
      backgroundColor: user.color,
      pointerEvents: 'none',
      zIndex: 50,
      transition: 'top 120ms ease, left 120ms ease',
    };
  }, [position, user.color]);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    if (!position) return { display: 'none' };
    return {
      position: 'absolute',
      top: position.top - 18,
      left: position.left,
      backgroundColor: user.color,
      color: '#fff',
      fontSize: 11,
      lineHeight: '16px',
      padding: '0 4px',
      borderRadius: 3,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 51,
      opacity: labelVisible ? 1 : 0,
      transition: 'opacity 300ms ease, top 120ms ease, left 120ms ease',
      userSelect: 'none',
    };
  }, [position, user.color, labelVisible]);

  if (!position) return null;

  return React.createElement(React.Fragment, null,
    React.createElement('div', {
      style: caretStyle,
      'data-collab-cursor': user.id,
      'aria-hidden': true,
    }),
    React.createElement('div', {
      style: labelStyle,
      'data-collab-label': user.id,
      'aria-hidden': true,
    }, user.name)
  );
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Walk a DOM element tree to find the first `Text` node.
 */
function findFirstTextNode(el: Node): Text | null {
  if (el.nodeType === Node.TEXT_NODE) return el as Text;
  for (let i = 0; i < el.childNodes.length; i++) {
    const found = findFirstTextNode(el.childNodes[i]);
    if (found) return found;
  }
  return null;
}

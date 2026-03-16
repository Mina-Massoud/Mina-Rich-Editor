/**
 * Mina Rich Editor - RemoteCursor Component
 *
 * Renders a colored SVG cursor pointer with a name flag representing a
 * remote collaborator's cursor position inside the editor.
 *
 * The cursor is positioned absolutely within the editor's relatively-
 * positioned container. The `nodeId` + `offset` from the awareness
 * protocol locates the correct DOM element and measures pixel
 * coordinates via `Range` / `getBoundingClientRect`.
 *
 * @packageDocumentation
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
   * @default 5000
   */
  fadeAfterMs?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RemoteCursor = React.memo(function RemoteCursor({
  user,
  containerRef,
  fadeAfterMs = 5000,
}: RemoteCursorProps) {
  const [position, setPosition] = useState<{ top: number; left: number; height: number } | null>(null);
  const [labelVisible, setLabelVisible] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store cursor data in a ref so the measure function always has latest values
  const cursorRef = useRef(user.cursor);
  cursorRef.current = user.cursor;

  // ── Measure cursor position from DOM ────────────────────────────────────

  const measure = useCallback(() => {
    const cursor = cursorRef.current;
    const container = containerRef.current;
    if (!cursor || !container) {
      setPosition(null);
      return false;
    }

    const { nodeId, offset } = cursor;

    // Find the DOM element that corresponds to the node.
    const el = container.querySelector(`[data-node-id="${nodeId}"]`);
    if (!el) {
      setPosition(null);
      return false; // element not in DOM yet
    }

    const containerRect = container.getBoundingClientRect();

    // Walk into the first text node to build a Range.
    const textNode = findFirstTextNode(el);
    if (!textNode) {
      // Fallback: position at the start of the element.
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top - containerRect.top + container.scrollTop,
        left: rect.left - containerRect.left + container.scrollLeft,
        height: rect.height || 20,
      });
      return true;
    }

    try {
      const range = document.createRange();
      const clampedOffset = Math.min(offset, textNode.textContent?.length ?? 0);
      range.setStart(textNode, clampedOffset);
      range.collapse(true);

      const rect = range.getBoundingClientRect();

      setPosition({
        top: rect.top - containerRect.top + container.scrollTop,
        left: rect.left - containerRect.left + container.scrollLeft,
        height: rect.height || 20,
      });
      return true;
    } catch {
      setPosition(null);
      return false;
    }
  }, [containerRef]);

  // ── Run measure on cursor change + observe DOM for retries ─────────────

  useEffect(() => {
    if (!user.cursor) {
      setPosition(null);
      return;
    }

    // Try immediately
    const found = measure();

    // If the element wasn't found (DOM not ready yet), watch for DOM changes
    // so we can retry once the content renders.
    if (!found && containerRef.current) {
      const observer = new MutationObserver(() => {
        const success = measure();
        if (success) {
          observer.disconnect();
        }
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      // Also try on next animation frame (covers the case where DOM is
      // already updated but layout hasn't been computed yet)
      const rafId = requestAnimationFrame(() => {
        const success = measure();
        if (success) observer.disconnect();
      });

      return () => {
        observer.disconnect();
        cancelAnimationFrame(rafId);
      };
    }
  }, [user.cursor, containerRef, measure]);

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

  // ── Render ────────────────────────────────────────────────────────────────

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    if (!position) return { display: 'none' };
    return {
      position: 'absolute',
      top: position.top - 2,
      left: position.left - 1,
      pointerEvents: 'none',
      zIndex: 50,
      transition: 'top 120ms ease, left 120ms ease',
    };
  }, [position]);

  if (!position) return null;

  return (
    <div style={wrapperStyle} data-collab-cursor={user.id} aria-hidden>
      {/* SVG cursor pointer */}
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M1 1L1 15.5L5.5 11.5L9.5 19L12 18L8 10L14 10L1 1Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name flag */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 12,
          backgroundColor: user.color,
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: '18px',
          padding: '0 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          opacity: labelVisible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      >
        {user.name}
      </div>

      {/* Caret line at the text insertion point */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 2,
          height: position.height,
          backgroundColor: user.color,
          borderRadius: 1,
        }}
      />
    </div>
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

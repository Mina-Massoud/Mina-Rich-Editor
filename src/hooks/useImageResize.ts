/**
 * useImageResize Hook
 *
 * Reusable hook that encapsulates image resize logic using the PointerEvent API.
 * Uses refs for intermediate values during drag to avoid re-renders per pixel,
 * and only commits state + dispatch on pointerup.
 */

"use client";

import { useRef, useState, useCallback, RefObject } from "react";

export interface UseImageResizeOptions {
  nodeId: string;
  initialWidth: number;
  unit: "percent" | "px";
  minWidth: number; // 20 for %, 200 for px
  maxWidth: number; // 100 for %, 800 for px
  containerRef: RefObject<HTMLElement | null>;
  dispatch: (action: any) => void;
  getNodeAttributes: () => Record<string, any>;
  aspectRatio?: number | null;
}

export interface UseImageResizeReturn {
  /** Current committed width value */
  currentWidth: number;
  /** Whether a resize drag is in progress */
  isResizing: boolean;
  /** Which handle side is being dragged */
  resizeSide: "left" | "right" | null;
  /** Dimension label string during resize, e.g. "640 x 480" */
  dimensionLabel: string | null;
  /** Attach to a resize handle's onPointerDown */
  handlePointerDown: (
    e: React.PointerEvent,
    side: "left" | "right"
  ) => void;
  /** Attach to a resize handle's onPointerMove */
  handlePointerMove: (e: React.PointerEvent) => void;
  /** Attach to a resize handle's onPointerUp */
  handlePointerUp: (e: React.PointerEvent) => void;
  /** Set width to a preset percentage (25, 50, 75, 100) */
  setWidthPreset: (preset: 25 | 50 | 75 | 100) => void;
  /** Keyboard handler for Shift+Arrow resizing */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Update currentWidth when node attributes change externally */
  setCurrentWidth: (width: number) => void;
}

export function useImageResize({
  nodeId,
  initialWidth,
  unit,
  minWidth,
  maxWidth,
  containerRef,
  dispatch,
  getNodeAttributes,
  aspectRatio,
}: UseImageResizeOptions): UseImageResizeReturn {
  const [currentWidth, setCurrentWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSide, setResizeSide] = useState<"left" | "right" | null>(null);
  const [dimensionLabel, setDimensionLabel] = useState<string | null>(null);

  // Refs for intermediate drag values — no re-renders per pixel
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);
  const liveWidthRef = useRef(initialWidth);
  const rafRef = useRef<number | null>(null);
  const resizeSideRef = useRef<"left" | "right" | null>(null);

  const clamp = useCallback(
    (value: number) => Math.max(minWidth, Math.min(maxWidth, value)),
    [minWidth, maxWidth]
  );

  const computeDimensionLabel = useCallback(
    (width: number): string => {
      if (unit === "percent") {
        if (aspectRatio && containerRef.current) {
          const containerW = containerRef.current.offsetWidth;
          const pxWidth = Math.round((width / 100) * containerW);
          const pxHeight = Math.round(pxWidth / aspectRatio);
          return `${pxWidth} x ${pxHeight}`;
        }
        return `${Math.round(width)}%`;
      }
      // px mode
      if (aspectRatio) {
        const pxHeight = Math.round(width / aspectRatio);
        return `${Math.round(width)} x ${pxHeight}`;
      }
      return `${Math.round(width)}px`;
    },
    [unit, aspectRatio, containerRef]
  );

  const commitWidth = useCallback(
    (width: number) => {
      const attrs = getNodeAttributes();
      const existingStyles =
        attrs?.styles && typeof attrs.styles === "object" && !Array.isArray(attrs.styles)
          ? (attrs.styles as Record<string, string>)
          : {};

      const widthStr = unit === "percent" ? `${width.toFixed(2)}%` : `${Math.round(width)}px`;

      const newStyles = {
        ...existingStyles,
        width: widthStr,
      };

      dispatch({
        type: "UPDATE_ATTRIBUTES",
        payload: {
          id: nodeId,
          attributes: {
            ...attrs,
            styles: newStyles,
          },
          merge: false,
        },
      });
    },
    [nodeId, unit, dispatch, getNodeAttributes]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, side: "left" | "right") => {
      e.preventDefault();
      e.stopPropagation();

      // Capture pointer so all subsequent events route to this element
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      startXRef.current = e.clientX;
      startWidthRef.current = currentWidth;
      liveWidthRef.current = currentWidth;
      resizeSideRef.current = side;

      setIsResizing(true);
      setResizeSide(side);
      setDimensionLabel(computeDimensionLabel(currentWidth));
    },
    [currentWidth, computeDimensionLabel]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;

      // Cancel any pending rAF to avoid stacking
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      const clientX = e.clientX;

      rafRef.current = requestAnimationFrame(() => {
        const deltaX = clientX - startXRef.current;
        const side = resizeSideRef.current;

        let newWidth: number;

        if (unit === "percent") {
          if (!containerRef.current) return;
          const containerWidth = containerRef.current.offsetWidth;
          const adjustedDelta = side === "left" ? -deltaX : deltaX;
          const deltaPercent = (adjustedDelta / containerWidth) * 100;
          newWidth = clamp(startWidthRef.current + deltaPercent);
        } else {
          // px mode
          const adjustedDelta = side === "left" ? -deltaX : deltaX;
          newWidth = clamp(startWidthRef.current + adjustedDelta);
        }

        liveWidthRef.current = newWidth;
        setCurrentWidth(newWidth);
        setDimensionLabel(computeDimensionLabel(newWidth));

        rafRef.current = null;
      });
    },
    [isResizing, unit, containerRef, clamp, computeDimensionLabel]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      // Cancel any pending rAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const finalWidth = liveWidthRef.current;
      setCurrentWidth(finalWidth);
      setIsResizing(false);
      setResizeSide(null);
      setDimensionLabel(null);

      commitWidth(finalWidth);
    },
    [isResizing, commitWidth]
  );

  const setWidthPreset = useCallback(
    (preset: 25 | 50 | 75 | 100) => {
      const newWidth = unit === "percent" ? preset : clamp((preset / 100) * maxWidth);
      setCurrentWidth(newWidth);
      commitWidth(newWidth);
    },
    [unit, maxWidth, clamp, commitWidth]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      e.preventDefault();

      const step = unit === "percent" ? 5 : 20;
      const direction = e.key === "ArrowLeft" ? -1 : 1;
      const newWidth = clamp(currentWidth + direction * step);

      setCurrentWidth(newWidth);
      commitWidth(newWidth);
    },
    [currentWidth, unit, clamp, commitWidth]
  );

  return {
    currentWidth,
    isResizing,
    resizeSide,
    dimensionLabel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setWidthPreset,
    onKeyDown,
    setCurrentWidth,
  };
}

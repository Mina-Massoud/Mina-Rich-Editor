/**
 * Drag Auto-Scroll Utility
 * 
 * Provides automatic scrolling functionality when dragging elements near viewport edges
 * This allows users to drag items to areas outside the current visible viewport
 */

import React from "react";

/**
 * Auto-scroll configuration
 */
export interface AutoScrollConfig {
  /** Distance from edge (in pixels) that triggers auto-scroll */
  scrollZone?: number;
  /** Scroll speed in pixels per frame */
  scrollSpeed?: number;
  /** Whether to enable horizontal scrolling */
  enableHorizontal?: boolean;
  /** Whether to enable vertical scrolling */
  enableVertical?: boolean;
}

const DEFAULT_CONFIG: Required<AutoScrollConfig> = {
  scrollZone: 80,
  scrollSpeed: 10,
  enableHorizontal: false,
  enableVertical: true,
};

/**
 * Setup auto-scroll for drag operations
 * Returns a cleanup function to remove event listeners
 */
export function setupDragAutoScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  config: AutoScrollConfig = {}
): () => void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let rafId: number | null = null;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  /**
   * Auto-scroll logic
   */
  const autoScroll = () => {
    if (!isDragging || !containerRef.current) {
      rafId = null;
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const { scrollZone, scrollSpeed, enableVertical, enableHorizontal } = finalConfig;

    let scrollX = 0;
    let scrollY = 0;

    // Check vertical scrolling
    if (enableVertical) {
      // Scroll down when near bottom
      if (lastMouseY > rect.bottom - scrollZone) {
        const distance = lastMouseY - (rect.bottom - scrollZone);
        const intensity = Math.min(distance / scrollZone, 1);
        scrollY = scrollSpeed * intensity;
      }
      // Scroll up when near top
      else if (lastMouseY < rect.top + scrollZone) {
        const distance = (rect.top + scrollZone) - lastMouseY;
        const intensity = Math.min(distance / scrollZone, 1);
        scrollY = -scrollSpeed * intensity;
      }
    }

    // Check horizontal scrolling
    if (enableHorizontal) {
      // Scroll right when near right edge
      if (lastMouseX > rect.right - scrollZone) {
        const distance = lastMouseX - (rect.right - scrollZone);
        const intensity = Math.min(distance / scrollZone, 1);
        scrollX = scrollSpeed * intensity;
      }
      // Scroll left when near left edge
      else if (lastMouseX < rect.left + scrollZone) {
        const distance = (rect.left + scrollZone) - lastMouseX;
        const intensity = Math.min(distance / scrollZone, 1);
        scrollX = -scrollSpeed * intensity;
      }
    }

    // Perform scroll
    if (scrollX !== 0 || scrollY !== 0) {
      // Try to find the scrollable parent (could be window or a container)
      const scrollableParent = findScrollableParent(container);
      
      if (scrollableParent === window) {
        window.scrollBy(scrollX, scrollY);
      } else if (scrollableParent instanceof HTMLElement) {
        scrollableParent.scrollLeft += scrollX;
        scrollableParent.scrollTop += scrollY;
      }
    }

    // Continue animation loop
    rafId = requestAnimationFrame(autoScroll);
  };

  /**
   * Find the scrollable parent element
   */
  const findScrollableParent = (element: HTMLElement): HTMLElement | Window => {
    let parent = element.parentElement;

    while (parent) {
      const style = window.getComputedStyle(parent);
      const isScrollable =
        (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
         style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth);

      if (isScrollable) {
        return parent;
      }

      parent = parent.parentElement;
    }

    // Default to window if no scrollable parent found
    return window;
  };

  /**
   * Track mouse movement during drag
   */
  const handleDragOver = (e: DragEvent) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    // Start auto-scroll loop if not already running
    if (!rafId && isDragging) {
      rafId = requestAnimationFrame(autoScroll);
    }
  };

  /**
   * Start tracking drag
   */
  const handleDragStart = () => {
    isDragging = true;
  };

  /**
   * Stop tracking drag
   */
  const handleDragEnd = () => {
    isDragging = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Attach event listeners
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('dragend', handleDragEnd);
  document.addEventListener('drop', handleDragEnd);

  // Return cleanup function
  return () => {
    isDragging = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('dragend', handleDragEnd);
    document.removeEventListener('drop', handleDragEnd);
  };
}

/**
 * React hook for drag auto-scroll
 */
export function useDragAutoScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  config?: AutoScrollConfig
) {
  const configRef = React.useRef(config);
  
  React.useEffect(() => {
    configRef.current = config;
  }, [config]);

  React.useEffect(() => {
    const cleanup = setupDragAutoScroll(containerRef, configRef.current);
    return cleanup;
  }, [containerRef]);
}

// For non-React usage
export default setupDragAutoScroll;


"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

/* ─── Color interpolation helpers ────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function lerpRgba(
  r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number,
  t: number
): string {
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  const a = +(a1 + (a2 - a1) * t).toFixed(4);
  return `rgba(${r},${g},${b},${a})`;
}

/* ─── Transition map ─────────────────────────────────────────────────────── */

const COLOR_PAIRS: Array<[string, string, string]> = [
  // [css-var, dark-value, light-value]
  ["--background", "#0a0a0a", "#ffffff"],
  ["--foreground", "#e5e5e5", "#1a1a1a"],
  ["--muted", "#1a1a1a", "#f8f8f6"],
  ["--muted-foreground", "#999999", "#666666"],
  ["--card", "#141414", "#ffffff"],
  ["--card-foreground", "#e5e5e5", "#1a1a1a"],
  ["--primary", "#e5e5e5", "#1a1a1a"],
  ["--primary-foreground", "#0a0a0a", "#ffffff"],
  ["--accent", "#1a1a1a", "#f8f8f6"],
  ["--accent-foreground", "#e5e5e5", "#1a1a1a"],
];

const RGBA_PAIRS: Array<[string, [number, number, number, number], [number, number, number, number]]> = [
  // [css-var, dark-rgba, light-rgba]
  ["--border", [255, 255, 255, 0.08], [0, 0, 0, 0.08]],
  ["--input", [255, 255, 255, 0.1], [0, 0, 0, 0.08]],
  ["--ring", [255, 255, 255, 0.12], [0, 0, 0, 0.12]],
  ["--int-border", [255, 255, 255, 0.08], [0, 0, 0, 0.08]],
  ["--int-border-strong", [255, 255, 255, 0.12], [0, 0, 0, 0.12]],
];

/* ─── Easing ─────────────────────────────────────────────────────────────── */

// Smooth ease-in-out for more natural feel
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

interface ScrollColorTransitionProps {
  children: ReactNode;
  triggerSelector?: string;
}

export function ScrollColorTransition({
  children,
  triggerSelector = "[data-section='ai']",
}: ScrollColorTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Find the trigger element after mount
  useEffect(() => {
    if (containerRef.current) {
      triggerRef.current = containerRef.current.querySelector(triggerSelector) as HTMLElement;
    }
  }, [triggerSelector]);

  const { scrollYProgress } = useScroll({
    target: triggerRef as React.RefObject<HTMLElement>,
    offset: ["start end", "start 0.3"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const el = containerRef.current;
    if (!el) return;

    const t = easeInOutCubic(Math.max(0, Math.min(1, v)));

    // Interpolate hex colors
    for (const [prop, dark, light] of COLOR_PAIRS) {
      el.style.setProperty(prop, lerpColor(dark, light, t));
    }

    // Interpolate rgba colors
    for (const [prop, dark, light] of RGBA_PAIRS) {
      el.style.setProperty(
        prop,
        lerpRgba(dark[0], dark[1], dark[2], dark[3], light[0], light[1], light[2], light[3], t)
      );
    }

    // Noise overlay opacity
    document.documentElement.style.setProperty("--noise-opacity", `${0.035 - 0.02 * t}`);
  });

  return (
    <div
      ref={containerRef}
      style={{ willChange: "background-color" }}
    >
      {children}
    </div>
  );
}

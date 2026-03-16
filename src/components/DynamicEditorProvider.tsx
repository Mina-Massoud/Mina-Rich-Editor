import dynamic from "next/dynamic";

/**
 * SSR-safe EditorProvider. Uses `next/dynamic` with `ssr: false` to ensure
 * the editor (and its ID generation) only runs on the client, preventing
 * hydration mismatches from non-deterministic node IDs.
 */
export const DynamicEditorProvider = dynamic(
  () =>
    import("@/lib/store/editor-store").then((mod) => ({
      default: mod.EditorProvider,
    })),
  { ssr: false }
);

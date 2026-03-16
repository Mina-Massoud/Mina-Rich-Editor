#!/bin/bash
set -euo pipefail

# ============================================================================
# sync-to-registry.sh
# Syncs Mina Rich Editor library files to the shadcn/ui registry repo.
# Usage: ./scripts/sync-to-registry.sh
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$SCRIPT_DIR/.." && pwd)/src"
DEST="/Users/mina/Documents/Mina/ui/apps/v4/registry/new-york-v4/ui/rich-editor"

echo "==> Syncing Mina Rich Editor to shadcn registry..."
echo "    Source: $SRC"
echo "    Target: $DEST"

# ── Step 1: Clean old files (preserve images/) ──────────────────────────
echo "==> Removing old files..."
find "$DEST" -mindepth 1 -maxdepth 1 ! -name "images" -exec rm -rf {} +

# ── Step 2: Copy lib root files ─────────────────────────────────────────
echo "==> Copying lib core..."
LIB_ROOT_FILES=(
  index.ts types.ts class-mappings.ts demo-content.ts elements.ts
  empty-content.ts insert-components-data.ts tailwind-classes.ts templates.ts
)
for f in "${LIB_ROOT_FILES[@]}"; do
  [ -f "$SRC/lib/$f" ] && cp "$SRC/lib/$f" "$DEST/$f"
done

# ── Step 3: Copy lib subdirectories (all flat under rich-editor/) ───────
# reducer (flat — NOT under lib/)
mkdir -p "$DEST/reducer/operations"
rsync -a --exclude='__tests__' "$SRC/lib/reducer/" "$DEST/reducer/"

# store
mkdir -p "$DEST/store"
cp "$SRC/lib/store/editor-store.ts" "$DEST/store/editor-store.ts"

# handlers
mkdir -p "$DEST/handlers/block"
rsync -a --exclude='__tests__' "$SRC/lib/handlers/" "$DEST/handlers/"

# utils
mkdir -p "$DEST/utils"
rsync -a --exclude='__tests__' "$SRC/lib/utils/" "$DEST/utils/"

# ai
mkdir -p "$DEST/ai"
cp "$SRC/lib/ai/"*.ts "$DEST/ai/"

# collaboration
mkdir -p "$DEST/collaboration"
cp "$SRC/lib/collaboration/"*.ts "$DEST/collaboration/"

# ── Step 4: Copy components (excluding landing.tsx, ui/) ────────────────
echo "==> Copying components..."
COMPONENTS=(
  AICommandMenu.tsx AISelectionMenu.tsx AddBlockButton.tsx Block.tsx
  BlockContainer.tsx BlockContextMenu.tsx BlockDragHandle.tsx
  CollaborationProvider.tsx ColorPicker.tsx CommandMenu.tsx
  CompactEditor.tsx CompactToolbar.tsx CoverImage.tsx CustomClassPopover.tsx
  Editor.tsx EditorToolbar.tsx ElementSelector.tsx ExportFloatingButton.tsx
  FlexContainer.tsx FontSizePicker.tsx FreeImageBlock.tsx
  GroupImagesButton.tsx ImageBlock.tsx InsertComponentsModal.tsx
  LinkPopover.tsx MediaUploadPopover.tsx QuickModeToggle.tsx
  RemoteCursor.tsx SelectionToolbar.tsx TableBuilder.tsx TableDialog.tsx
  TemplateSwitcherButton.tsx VideoBlock.tsx
)
for comp in "${COMPONENTS[@]}"; do
  [ -f "$SRC/components/$comp" ] && cp "$SRC/components/$comp" "$DEST/$comp"
done

# toolbar sub-components
mkdir -p "$DEST/_toolbar-components"
cp "$SRC/components/_toolbar-components/"* "$DEST/_toolbar-components/"

# ── Step 5: Copy hooks (excluding shadcn's own use-mobile, use-toast) ───
echo "==> Copying hooks..."
mkdir -p "$DEST/hooks"
HOOKS=(
  useBlockHandlers.ts useCollaboration.ts useEditorAI.ts useEditorAPI.ts
  useEditorClipboard.ts useEditorContext.tsx useEditorDragDrop.ts
  useEditorFileUpload.ts useEditorKeyboardShortcuts.ts useEditorSelection.ts
  useImageSelection.ts useMediaPaste.ts useTableOperations.ts
  use-toast.ts use-mobile.ts
)
for hook in "${HOOKS[@]}"; do
  [ -f "$SRC/hooks/$hook" ] && cp "$SRC/hooks/$hook" "$DEST/hooks/$hook"
done

# ── Step 6: Copy bundled dependencies (color picker) ────────────────────
echo "==> Copying bundled deps..."
mkdir -p "$DEST/_color-picker"
cp "$SRC/components/ui/shadcn-io/color-picker/index.tsx" "$DEST/_color-picker/index.tsx"

# ── Step 7: Copy styles ─────────────────────────────────────────────────
echo "==> Copying styles..."
mkdir -p "$DEST/styles"
cp "$SRC/styles/editor-variables.css" "$DEST/styles/editor-variables.css"

# ── Step 7: Rewrite import paths ────────────────────────────────────────
echo "==> Rewriting import paths..."

# --- index.ts ---
# ../hooks/ → ./hooks/, ../components/X → ./X (no reducer nesting needed now)
sed -i '' \
  -e "s|from '../hooks/|from './hooks/|g" \
  -e "s|from \"../hooks/|from \"./hooks/|g" \
  -e "s|from '../components/|from './|g" \
  -e "s|from \"../components/|from \"./|g" \
  "$DEST/index.ts"

# --- Root-level components (*.tsx) ---
# ../lib/ → ./, ../lib → ., ../hooks/ → ./hooks/, ../components/ → ./
# ./ui/ → @/components/ui/ (shadcn sibling components)
# Also handle dynamic import("../lib/...") patterns
for f in "$DEST/"*.tsx; do
  [ -f "$f" ] || continue
  sed -i '' \
    -e "s|from '../lib/|from './|g" \
    -e "s|from \"../lib/|from \"./|g" \
    -e "s|from '../lib'|from '.'|g" \
    -e "s|from \"../lib\"|from \".\"|g" \
    -e "s|import(\"../lib/|import(\"./|g" \
    -e "s|import('../lib/|import('./|g" \
    -e "s|from '../hooks/|from './hooks/|g" \
    -e "s|from \"../hooks/|from \"./hooks/|g" \
    -e "s|from '../components/|from './|g" \
    -e "s|from \"../components/|from \"./|g" \
    -e "s|from './ui/|from '@/components/ui/|g" \
    -e "s|from \"./ui/|from \"@/components/ui/|g" \
    -e "s|from '@/components/ui/shadcn-io/color-picker'|from './_color-picker'|g" \
    -e "s|from \"@/components/ui/shadcn-io/color-picker\"|from \"./_color-picker\"|g" \
    -e "s|from '@/lib'|from '.'|g" \
    -e "s|from \"@/lib\"|from \".\"|g" \
    -e "s|from '@/hooks/use-toast'|from './hooks/use-toast'|g" \
    -e "s|from \"@/hooks/use-toast\"|from \"./hooks/use-toast\"|g" \
    -e "s|from '@/hooks/use-mobile'|from './hooks/use-mobile'|g" \
    -e "s|from \"@/hooks/use-mobile\"|from \"./hooks/use-mobile\"|g" \
    "$f"
done

# --- _toolbar-components ---
# ../ui/ → @/components/ui/
for f in "$DEST/_toolbar-components/"*.ts "$DEST/_toolbar-components/"*.tsx; do
  [ -f "$f" ] || continue
  sed -i '' \
    -e "s|from '../ui/|from '@/components/ui/|g" \
    -e "s|from \"../ui/|from \"@/components/ui/|g" \
    "$f"
done

# --- Hooks ---
# ../lib/ → ../, ../lib → .., ../components/ → ../
# Also handle dynamic import("../lib/...") patterns
for f in "$DEST/hooks/"*.ts "$DEST/hooks/"*.tsx; do
  [ -f "$f" ] || continue
  sed -i '' \
    -e "s|from '../lib/|from '../|g" \
    -e "s|from \"../lib/|from \"../|g" \
    -e "s|from '../lib'|from '..'|g" \
    -e "s|from \"../lib\"|from \"..\"|g" \
    -e "s|import(\"../lib/|import(\"../|g" \
    -e "s|import('../lib/|import('../|g" \
    -e "s|from '../components/|from '../|g" \
    -e "s|from \"../components/|from \"../|g" \
    "$f"
done

# --- Collaboration optional deps (yjs, y-websocket) ---
# Use variable indirection so TS can't statically check the module specifier.
sed -i '' "s|await import('yjs')|await import('yjs' as string)|g" "$DEST/collaboration/y-binding.ts"
sed -i '' "s|await import('y-websocket')|await import('y-websocket' as string)|g" "$DEST/hooks/useCollaboration.ts"

# ── Step 9: Build registry ───────────────────────────────────────────────
FILE_COUNT=$(find "$DEST" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | wc -l | tr -d ' ')
echo ""
echo "==> Synced $FILE_COUNT files. Building registry..."

UI_REPO="/Users/mina/Documents/Mina/ui"
cd "$UI_REPO/apps/v4" && pnpm registry:build

echo ""
echo "==> All done! Registry is ready."

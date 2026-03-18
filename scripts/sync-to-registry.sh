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

# extensions (extension system — nodes, marks, starter-kit, managers)
echo "==> Copying extensions..."
mkdir -p "$DEST/extensions/nodes" "$DEST/extensions/marks"
rsync -a --exclude='__tests__' "$SRC/lib/extensions/" "$DEST/extensions/"

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
  useImageResize.ts useImageSelection.ts useMediaPaste.ts useTableOperations.ts
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
mkdir -p "$DEST/styles/themes"
cp "$SRC/styles/editor-variables.css" "$DEST/styles/editor-variables.css"
cp "$SRC/styles/themes/"*.css "$DEST/styles/themes/" 2>/dev/null || true

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
# ./ui/ → @/registry/new-york-v4/ui/ (shadcn sibling components)
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
    -e "s|from './ui/|from '@/registry/new-york-v4/ui/|g" \
    -e "s|from \"./ui/|from \"@/registry/new-york-v4/ui/|g" \
    -e "s|from '@/registry/new-york-v4/ui/shadcn-io/color-picker'|from './_color-picker'|g" \
    -e "s|from \"@/registry/new-york-v4/ui/shadcn-io/color-picker\"|from \"./_color-picker\"|g" \
    -e "s|from '@/lib'|from '.'|g" \
    -e "s|from \"@/lib\"|from \".\"|g" \
    -e "s|from '@/hooks/use-toast'|from './hooks/use-toast'|g" \
    -e "s|from \"@/hooks/use-toast\"|from \"./hooks/use-toast\"|g" \
    -e "s|from '@/hooks/use-mobile'|from './hooks/use-mobile'|g" \
    -e "s|from \"@/hooks/use-mobile\"|from \"./hooks/use-mobile\"|g" \
    "$f"
done

# --- _toolbar-components ---
# ../ui/ → @/registry/new-york-v4/ui/
for f in "$DEST/_toolbar-components/"*.ts "$DEST/_toolbar-components/"*.tsx; do
  [ -f "$f" ] || continue
  sed -i '' \
    -e "s|from '../ui/|from '@/registry/new-york-v4/ui/|g" \
    -e "s|from \"../ui/|from \"@/registry/new-york-v4/ui/|g" \
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
    -e "s|require(\"../lib/|require(\"../|g" \
    -e "s|require('../lib/|require('../|g" \
    -e "s|from '../components/|from '../|g" \
    -e "s|from \"../components/|from \"../|g" \
    "$f"
done

# --- Final sweep: rewrite remaining @/components/ui/ and @/lib/ paths ---
echo "==> Fixing remaining @ import paths..."
find "$DEST" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 sed -i '' \
  -e "s|from '@/components/ui/shadcn-io/color-picker'|from './_color-picker'|g" \
  -e "s|from \"@/components/ui/shadcn-io/color-picker\"|from \"./_color-picker\"|g" \
  -e "s|from '@/components/ui/|from '@/registry/new-york-v4/ui/|g" \
  -e "s|from \"@/components/ui/|from \"@/registry/new-york-v4/ui/|g" \
  -e "s|from '@/lib/utils'|from '__KEEP_LIB_UTILS__'|g" \
  -e "s|from \"@/lib/utils\"|from \"__KEEP_LIB_UTILS__\"|g" \
  -e "s|from '@/lib/|from './|g" \
  -e "s|from \"@/lib/|from \"./|g" \
  -e "s|from '__KEEP_LIB_UTILS__'|from '@/lib/utils'|g" \
  -e "s|from \"__KEEP_LIB_UTILS__\"|from \"@/lib/utils\"|g"

# --- Fix color-picker: radix-ui → @radix-ui/react-slider ---
sed -i '' "s|from 'radix-ui'|from '@radix-ui/react-slider'|g" "$DEST/_color-picker/index.tsx"
sed -i '' "s|from \"radix-ui\"|from \"@radix-ui/react-slider\"|g" "$DEST/_color-picker/index.tsx"

# --- Collaboration optional deps (yjs, y-websocket) ---
# Use variable indirection to prevent webpack from statically resolving these optional deps.
# The "as string" trick doesn't fool webpack on Vercel — use a runtime variable instead.
sed -i '' "s|await import('yjs')|await import(/* webpackIgnore: true */ 'yjs')|g" "$DEST/collaboration/y-binding.ts"
sed -i '' "s|await import('yjs' as string)|await import(/* webpackIgnore: true */ 'yjs')|g" "$DEST/collaboration/y-binding.ts"
sed -i '' "s|await import('y-websocket')|await import(/* webpackIgnore: true */ 'y-websocket')|g" "$DEST/hooks/useCollaboration.ts"
sed -i '' "s|await import('y-websocket' as string)|await import(/* webpackIgnore: true */ 'y-websocket')|g" "$DEST/hooks/useCollaboration.ts"

# ── Step 8: Inject CSS import into Editor components ─────────────────────
# "use client" must be the FIRST statement in the file for Next.js/SWC.
# Strategy: strip any JSDoc/comments before "use client", then prepend
# "use client" + CSS import at the very top.
echo "==> Injecting CSS imports..."
for f in "$DEST/Editor.tsx" "$DEST/CompactEditor.tsx"; do
  [ -f "$f" ] || continue
  if ! grep -q 'editor-variables.css' "$f"; then
    # Remove everything before (and including) the "use client" line, then
    # re-add "use client" + CSS import at the top
    if grep -q '"use client"' "$f"; then
      # Get line number of "use client"
      UC_LINE=$(grep -n '"use client"' "$f" | head -1 | cut -d: -f1)
      # Remove lines 1 through UC_LINE (the comment block + "use client")
      sed -i '' "1,${UC_LINE}d" "$f"
      # Prepend "use client" + CSS import
      sed -i '' '1i\
"use client"\
\
import "./styles/editor-variables.css"\
' "$f"
    else
      sed -i '' '1i\
import "./styles/editor-variables.css"\
' "$f"
    fi
  fi
done

# ── Step 9: Auto-generate registry-ui.ts file entries ────────────────────
echo "==> Auto-generating registry-ui.ts entries..."

UI_REPO="/Users/mina/Documents/Mina/ui"
REGISTRY_FILE="$UI_REPO/apps/v4/registry/registry-ui.ts"
REGISTRY_BASE="$UI_REPO/apps/v4/registry/new-york-v4"

# Collect all synced files, convert to registry-relative paths, and sort
FILE_ENTRIES=""
while IFS= read -r filepath; do
  rel="${filepath#"$REGISTRY_BASE/"}"
  FILE_ENTRIES+="      { path: \"${rel}\", type: \"registry:ui\" },\n"
done < <(find "$DEST" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort)

# Use awk to splice the new files array into registry-ui.ts
# Strategy: find the rich-editor entry, replace its files: [...] block
awk -v entries="$FILE_ENTRIES" '
  /name: "rich-editor"/ { in_rich_editor = 1 }
  in_rich_editor && /files: \[/ {
    print "    files: ["
    printf "%s", entries
    print "    ],"
    # Skip old file entries until we hit the closing ]
    in_files = 1
    next
  }
  in_files {
    if (/^    \],/) {
      in_files = 0
      in_rich_editor = 0
      next
    }
    next
  }
  { print }
' "$REGISTRY_FILE" > "${REGISTRY_FILE}.tmp" && mv "${REGISTRY_FILE}.tmp" "$REGISTRY_FILE"

# ── Step 10: Build registry ──────────────────────────────────────────────
FILE_COUNT=$(find "$DEST" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | wc -l | tr -d ' ')
echo ""
echo "==> Synced $FILE_COUNT files. Building registry..."

cd "$UI_REPO/apps/v4" && pnpm registry:build

# ── Step 11: Commit and push to UI repo ──────────────────────────────────
echo ""
echo "==> Committing and pushing to UI repo..."
cd "$UI_REPO"
git add -A
git commit -m "sync: rich-editor registry update ($(date +%Y-%m-%d))" || echo "Nothing to commit"
git push

echo ""
echo "==> All done! Registry is synced and pushed."

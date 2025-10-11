# Block Context Menu Feature

## Overview
Added a right-click context menu to all blocks in the editor that allows users to change the background color of individual blocks.

## Files Created

### `src/components/BlockContextMenu.tsx`
A new component that provides:
- Right-click context menu using Radix UI's Context Menu
- Dialog modal with color picker using Radix UI's Dialog
- Two color selection modes:
  - **Preset Colors**: 12 theme-aware preset background colors optimized for text blocks
    - Light mode: Subtle, light backgrounds (pastel shades)
    - Dark mode: Darker, more saturated backgrounds for better contrast
  - **Custom Color**: Full color picker with hue, alpha, eyedropper, and format options

## Files Modified

### `src/components/Block.tsx`
Integrated the context menu into the Block component:
1. **Import**: Added `BlockContextMenu` import
2. **Handler**: Added `handleBackgroundColorChange` callback that dispatches `UPDATE_ATTRIBUTES` action
3. **Attribute Retrieval**: Gets `backgroundColor` from node attributes
4. **Style Application**: Applies background color to block's inline style
5. **Wrapper**: Wrapped the block element with `BlockContextMenu` component

## How It Works

### User Flow
1. User right-clicks on any text block (heading, paragraph, list item, etc.)
2. Context menu appears with "Change Background Color" option
3. User clicks the option to open the color picker dialog
4. User can choose from:
   - **Preset colors**: Light, subtle backgrounds (transparent, red, orange, yellow, green, blue, indigo, purple, pink, teal, cyan, gray)
   - **Custom color**: Full color picker with live preview
5. Selected color is applied to the block's background

### Technical Details

#### State Management
- Background color is stored in the node's `attributes.backgroundColor` field
- Uses the existing `UPDATE_ATTRIBUTES` action from the reducer
- Changes are fully integrated with undo/redo system

#### Color Storage
- Colors are stored as CSS color values (hex, rgb, rgba, etc.)
- Supports transparent backgrounds
- Applied via inline styles for precise control

#### Component Structure
```tsx
<BlockContextMenu 
  onBackgroundColorChange={handleBackgroundColorChange}
  currentBackgroundColor={backgroundColor}
>
  <div className="relative">
    <ElementType {...commonProps} />
  </div>
</BlockContextMenu>
```

## Features

### Preset Colors
- 12 carefully selected light background colors
- Visual preview with color name
- Includes transparent option (with checkered background pattern)
- Current selection highlighted with primary color ring

### Custom Color Picker
- Full HSL/RGB/HEX color selection
- Hue slider for main color selection
- Alpha slider for transparency control
- Eyedropper tool for color picking from screen
- Multiple format support (HEX, RGB, HSL)
- Live preview with hex code display
- Apply button to confirm selection

## Usage Example

```tsx
import { EditorProvider } from "@/lib";
import { SimpleEditor } from "@/components/SimpleEditor";

function MyEditor() {
  return (
    <EditorProvider>
      <SimpleEditor />
    </EditorProvider>
  );
}
```

That's it! The context menu is automatically available on all blocks. Just right-click any block to change its background color.

## Keyboard Support
- `Escape` key closes the dialog
- Dialog follows Radix UI accessibility standards

## Future Enhancements
Potential additions could include:
- Text color picker in the same context menu
- Border color/style options
- Padding/margin adjustments
- Block-level font size changes
- Copy/paste block styling
- Save custom color presets


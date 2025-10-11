# Tailwind Classes Feature

## Overview
A comprehensive Tailwind CSS class browser integrated into the Custom Class Popover, allowing users to easily discover and apply Tailwind classes to selected text.

## Files Created/Modified

### New Files
- **`src/lib/tailwind-classes.ts`**: Comprehensive collection of Tailwind CSS classes organized by category

### Modified Files
- **`src/components/CustomClassPopover.tsx`**: Updated to use the organized Tailwind classes with search functionality
- **`src/lib/index.ts`**: Exported the new Tailwind utilities

## Features

### 1. Organized Tailwind Classes (`tailwind-classes.ts`)
All Tailwind classes are organized into 30+ categories:

- **Text Styling**: Text Color, Font Size, Font Weight, Text Decoration, Text Alignment, Text Transform
- **Spacing**: Padding, Margin
- **Layout**: Display, Flex, Justify Content, Align Items, Gap, Position
- **Borders**: Border, Border Color, Border Radius
- **Visual Effects**: Shadow, Opacity, Gradient, Transform, Transitions
- **Typography**: Letter Spacing, Line Height, List Style, Whitespace, Word Break
- **Sizing**: Width, Height
- **Interactive**: Cursor, User Select
- **Background**: Background Color
- **Other**: Z-Index, Overflow

### 2. Search Functionality
- Real-time search across all Tailwind classes
- Filters classes by keyword
- Shows only matching categories
- Displays helpful message when no results found

### 3. User Interface
- **Browse Mode**: Clean interface with search bar at the top
- **Scrollable Area**: 500px height scrollable area for browsing categories
- **Grouped Display**: Classes organized by category with clear headers
- **Compact Buttons**: Small, clickable buttons for each class
- **Responsive Layout**: Flex-wrap layout that adapts to popover width

### 4. Quick Application
- Click any class button to instantly apply it to selected text
- Toast notification confirms the applied class
- Maintains text selection state during class application

## Usage

### For Developers

```typescript
import { 
  tailwindClasses, 
  popularClasses, 
  searchTailwindClasses,
  getAllClasses 
} from 'mina-rich-editor';

// Get all classes organized by category
const allClasses = tailwindClasses;

// Get popular classes
const popular = popularClasses;

// Search for specific classes
const results = searchTailwindClasses('text-red');

// Get flat array of all classes
const flatList = getAllClasses();
```

### For End Users

1. **Select text** in the editor
2. **Click the floating pencil icon** that appears above the selection
3. **Search for classes** using the search bar (e.g., "text", "bg", "flex")
4. **Browse categories** to find the class you need
5. **Click a class button** to apply it to your selected text

## Technical Details

### Data Structure

```typescript
interface TailwindClassGroup {
  category: string;
  classes: string[];
}
```

### Key Functions

- **`searchTailwindClasses(query: string)`**: Search classes by keyword
- **`getAllClasses()`**: Get all classes as a flat array
- **`popularClasses`**: Array of frequently used classes

### Component Architecture

```
CustomClassPopover
├── Floating Button (Pencil Icon)
└── Popover Content
    ├── Search Input
    └── Scrollable Area
        └── Category Groups
            └── Class Buttons
```

## Statistics

- **30+ Categories**: Organized class groups
- **600+ Classes**: Comprehensive Tailwind coverage
- **20 Popular Classes**: Quick access to most-used classes
- **Real-time Search**: Instant filtering as you type

## Future Enhancements (Optional)

1. **Favorites System**: Allow users to mark frequently used classes
2. **Recent Classes**: Show recently applied classes
3. **Color Preview**: Visual preview for color-related classes
4. **Custom Classes**: Allow adding custom/arbitrary classes
5. **Class Combinations**: Suggest common class combinations
6. **Responsive Variants**: Support for responsive prefixes (sm:, md:, lg:, etc.)
7. **Dark Mode Variants**: Support for dark: prefix
8. **Hover/Focus States**: Support for hover:, focus:, etc.

## Benefits

- **Discoverability**: Users can easily find Tailwind classes without memorizing them
- **Speed**: Quick application without typing
- **Organization**: Clear categorization helps users understand class purposes
- **Search**: Fast filtering reduces time to find the right class
- **Consistency**: Ensures valid Tailwind classes are used
- **Learning Tool**: Helps users learn Tailwind CSS structure and naming

## Browser Compatibility

Works in all modern browsers that support:
- CSS Grid
- Flexbox
- ES6+
- React 18+



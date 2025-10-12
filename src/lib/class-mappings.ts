/**
 * User-friendly class names mapped to Tailwind classes
 * Used when dev mode is OFF to show simplified, readable class names
 */

export interface ClassMapping {
  userFriendly: string;
  tailwindClass: string;
  category: string;
}

export const classMappings: ClassMapping[] = [
  // Text Color
  { userFriendly: "Red Text", tailwindClass: "text-red-500", category: "Text Color" },
  { userFriendly: "Dark Red Text", tailwindClass: "text-red-600", category: "Text Color" },
  { userFriendly: "Darker Red Text", tailwindClass: "text-red-700", category: "Text Color" },
  { userFriendly: "Blue Text", tailwindClass: "text-blue-500", category: "Text Color" },
  { userFriendly: "Dark Blue Text", tailwindClass: "text-blue-600", category: "Text Color" },
  { userFriendly: "Darker Blue Text", tailwindClass: "text-blue-700", category: "Text Color" },
  { userFriendly: "Green Text", tailwindClass: "text-green-500", category: "Text Color" },
  { userFriendly: "Dark Green Text", tailwindClass: "text-green-600", category: "Text Color" },
  { userFriendly: "Darker Green Text", tailwindClass: "text-green-700", category: "Text Color" },
  { userFriendly: "Yellow Text", tailwindClass: "text-yellow-500", category: "Text Color" },
  { userFriendly: "Dark Yellow Text", tailwindClass: "text-yellow-600", category: "Text Color" },
  { userFriendly: "Darker Yellow Text", tailwindClass: "text-yellow-700", category: "Text Color" },
  { userFriendly: "Purple Text", tailwindClass: "text-purple-500", category: "Text Color" },
  { userFriendly: "Dark Purple Text", tailwindClass: "text-purple-600", category: "Text Color" },
  { userFriendly: "Darker Purple Text", tailwindClass: "text-purple-700", category: "Text Color" },
  { userFriendly: "Pink Text", tailwindClass: "text-pink-500", category: "Text Color" },
  { userFriendly: "Dark Pink Text", tailwindClass: "text-pink-600", category: "Text Color" },
  { userFriendly: "Darker Pink Text", tailwindClass: "text-pink-700", category: "Text Color" },
  { userFriendly: "Indigo Text", tailwindClass: "text-indigo-500", category: "Text Color" },
  { userFriendly: "Dark Indigo Text", tailwindClass: "text-indigo-600", category: "Text Color" },
  { userFriendly: "Darker Indigo Text", tailwindClass: "text-indigo-700", category: "Text Color" },
  { userFriendly: "Gray Text", tailwindClass: "text-gray-500", category: "Text Color" },
  { userFriendly: "Dark Gray Text", tailwindClass: "text-gray-600", category: "Text Color" },
  { userFriendly: "Darker Gray Text", tailwindClass: "text-gray-700", category: "Text Color" },
  { userFriendly: "Very Dark Gray Text", tailwindClass: "text-gray-800", category: "Text Color" },
  { userFriendly: "Black Gray Text", tailwindClass: "text-gray-900", category: "Text Color" },
  { userFriendly: "White Text", tailwindClass: "text-white", category: "Text Color" },
  { userFriendly: "Black Text", tailwindClass: "text-black", category: "Text Color" },

  // Background Color
  { userFriendly: "Light Red Background", tailwindClass: "bg-red-50", category: "Background Color" },
  { userFriendly: "Lighter Red Background", tailwindClass: "bg-red-100", category: "Background Color" },
  { userFriendly: "Soft Red Background", tailwindClass: "bg-red-200", category: "Background Color" },
  { userFriendly: "Red Background", tailwindClass: "bg-red-500", category: "Background Color" },
  { userFriendly: "Light Blue Background", tailwindClass: "bg-blue-50", category: "Background Color" },
  { userFriendly: "Lighter Blue Background", tailwindClass: "bg-blue-100", category: "Background Color" },
  { userFriendly: "Soft Blue Background", tailwindClass: "bg-blue-200", category: "Background Color" },
  { userFriendly: "Blue Background", tailwindClass: "bg-blue-500", category: "Background Color" },
  { userFriendly: "Light Green Background", tailwindClass: "bg-green-50", category: "Background Color" },
  { userFriendly: "Lighter Green Background", tailwindClass: "bg-green-100", category: "Background Color" },
  { userFriendly: "Soft Green Background", tailwindClass: "bg-green-200", category: "Background Color" },
  { userFriendly: "Green Background", tailwindClass: "bg-green-500", category: "Background Color" },
  { userFriendly: "Light Yellow Background", tailwindClass: "bg-yellow-50", category: "Background Color" },
  { userFriendly: "Lighter Yellow Background", tailwindClass: "bg-yellow-100", category: "Background Color" },
  { userFriendly: "Soft Yellow Background", tailwindClass: "bg-yellow-200", category: "Background Color" },
  { userFriendly: "Yellow Background", tailwindClass: "bg-yellow-500", category: "Background Color" },
  { userFriendly: "Light Purple Background", tailwindClass: "bg-purple-50", category: "Background Color" },
  { userFriendly: "Lighter Purple Background", tailwindClass: "bg-purple-100", category: "Background Color" },
  { userFriendly: "Soft Purple Background", tailwindClass: "bg-purple-200", category: "Background Color" },
  { userFriendly: "Purple Background", tailwindClass: "bg-purple-500", category: "Background Color" },
  { userFriendly: "Light Pink Background", tailwindClass: "bg-pink-50", category: "Background Color" },
  { userFriendly: "Lighter Pink Background", tailwindClass: "bg-pink-100", category: "Background Color" },
  { userFriendly: "Soft Pink Background", tailwindClass: "bg-pink-200", category: "Background Color" },
  { userFriendly: "Pink Background", tailwindClass: "bg-pink-500", category: "Background Color" },
  { userFriendly: "Light Indigo Background", tailwindClass: "bg-indigo-50", category: "Background Color" },
  { userFriendly: "Lighter Indigo Background", tailwindClass: "bg-indigo-100", category: "Background Color" },
  { userFriendly: "Soft Indigo Background", tailwindClass: "bg-indigo-200", category: "Background Color" },
  { userFriendly: "Indigo Background", tailwindClass: "bg-indigo-500", category: "Background Color" },
  { userFriendly: "Light Gray Background", tailwindClass: "bg-gray-50", category: "Background Color" },
  { userFriendly: "Lighter Gray Background", tailwindClass: "bg-gray-100", category: "Background Color" },
  { userFriendly: "Soft Gray Background", tailwindClass: "bg-gray-200", category: "Background Color" },
  { userFriendly: "Gray Background", tailwindClass: "bg-gray-500", category: "Background Color" },
  { userFriendly: "White Background", tailwindClass: "bg-white", category: "Background Color" },
  { userFriendly: "Black Background", tailwindClass: "bg-black", category: "Background Color" },
  { userFriendly: "Transparent Background", tailwindClass: "bg-transparent", category: "Background Color" },

  // Font Size
  { userFriendly: "Extra Small Text", tailwindClass: "text-xs", category: "Font Size" },
  { userFriendly: "Small Text", tailwindClass: "text-sm", category: "Font Size" },
  { userFriendly: "Normal Text", tailwindClass: "text-base", category: "Font Size" },
  { userFriendly: "Large Text", tailwindClass: "text-lg", category: "Font Size" },
  { userFriendly: "Extra Large Text", tailwindClass: "text-xl", category: "Font Size" },
  { userFriendly: "2X Large Text", tailwindClass: "text-2xl", category: "Font Size" },
  { userFriendly: "3X Large Text", tailwindClass: "text-3xl", category: "Font Size" },
  { userFriendly: "4X Large Text", tailwindClass: "text-4xl", category: "Font Size" },
  { userFriendly: "5X Large Text", tailwindClass: "text-5xl", category: "Font Size" },
  { userFriendly: "6X Large Text", tailwindClass: "text-6xl", category: "Font Size" },
  { userFriendly: "7X Large Text", tailwindClass: "text-7xl", category: "Font Size" },
  { userFriendly: "8X Large Text", tailwindClass: "text-8xl", category: "Font Size" },
  { userFriendly: "9X Large Text", tailwindClass: "text-9xl", category: "Font Size" },

  // Font Weight
  { userFriendly: "Thin Weight", tailwindClass: "font-thin", category: "Font Weight" },
  { userFriendly: "Extra Light Weight", tailwindClass: "font-extralight", category: "Font Weight" },
  { userFriendly: "Light Weight", tailwindClass: "font-light", category: "Font Weight" },
  { userFriendly: "Normal Weight", tailwindClass: "font-normal", category: "Font Weight" },
  { userFriendly: "Medium Weight", tailwindClass: "font-medium", category: "Font Weight" },
  { userFriendly: "Semi Bold", tailwindClass: "font-semibold", category: "Font Weight" },
  { userFriendly: "Bold", tailwindClass: "font-bold", category: "Font Weight" },
  { userFriendly: "Extra Bold", tailwindClass: "font-extrabold", category: "Font Weight" },
  { userFriendly: "Black Weight", tailwindClass: "font-black", category: "Font Weight" },

  // Text Decoration
  { userFriendly: "Underline", tailwindClass: "underline", category: "Text Decoration" },
  { userFriendly: "Overline", tailwindClass: "overline", category: "Text Decoration" },
  { userFriendly: "Line Through", tailwindClass: "line-through", category: "Text Decoration" },
  { userFriendly: "No Underline", tailwindClass: "no-underline", category: "Text Decoration" },
  { userFriendly: "Solid Decoration", tailwindClass: "decoration-solid", category: "Text Decoration" },
  { userFriendly: "Double Decoration", tailwindClass: "decoration-double", category: "Text Decoration" },
  { userFriendly: "Dotted Decoration", tailwindClass: "decoration-dotted", category: "Text Decoration" },
  { userFriendly: "Dashed Decoration", tailwindClass: "decoration-dashed", category: "Text Decoration" },
  { userFriendly: "Wavy Decoration", tailwindClass: "decoration-wavy", category: "Text Decoration" },
  { userFriendly: "Small Offset", tailwindClass: "underline-offset-1", category: "Text Decoration" },
  { userFriendly: "Medium Offset", tailwindClass: "underline-offset-2", category: "Text Decoration" },
  { userFriendly: "Large Offset", tailwindClass: "underline-offset-4", category: "Text Decoration" },
  { userFriendly: "Extra Large Offset", tailwindClass: "underline-offset-8", category: "Text Decoration" },

  // Text Alignment
  { userFriendly: "Align Left", tailwindClass: "text-left", category: "Text Alignment" },
  { userFriendly: "Align Center", tailwindClass: "text-center", category: "Text Alignment" },
  { userFriendly: "Align Right", tailwindClass: "text-right", category: "Text Alignment" },
  { userFriendly: "Justify", tailwindClass: "text-justify", category: "Text Alignment" },
  { userFriendly: "Align Start", tailwindClass: "text-start", category: "Text Alignment" },
  { userFriendly: "Align End", tailwindClass: "text-end", category: "Text Alignment" },

  // Text Transform
  { userFriendly: "Uppercase", tailwindClass: "uppercase", category: "Text Transform" },
  { userFriendly: "Lowercase", tailwindClass: "lowercase", category: "Text Transform" },
  { userFriendly: "Capitalize", tailwindClass: "capitalize", category: "Text Transform" },
  { userFriendly: "Normal Case", tailwindClass: "normal-case", category: "Text Transform" },

  // Padding (Simplified - showing most common ones)
  { userFriendly: "No Padding", tailwindClass: "p-0", category: "Padding" },
  { userFriendly: "Tiny Padding", tailwindClass: "p-1", category: "Padding" },
  { userFriendly: "Small Padding", tailwindClass: "p-2", category: "Padding" },
  { userFriendly: "Medium Padding", tailwindClass: "p-4", category: "Padding" },
  { userFriendly: "Large Padding", tailwindClass: "p-6", category: "Padding" },
  { userFriendly: "Extra Large Padding", tailwindClass: "p-8", category: "Padding" },
  { userFriendly: "Small Horizontal Padding", tailwindClass: "px-2", category: "Padding" },
  { userFriendly: "Medium Horizontal Padding", tailwindClass: "px-4", category: "Padding" },
  { userFriendly: "Large Horizontal Padding", tailwindClass: "px-6", category: "Padding" },
  { userFriendly: "Small Vertical Padding", tailwindClass: "py-2", category: "Padding" },
  { userFriendly: "Medium Vertical Padding", tailwindClass: "py-4", category: "Padding" },
  { userFriendly: "Large Vertical Padding", tailwindClass: "py-6", category: "Padding" },

  // Margin (Simplified - showing most common ones)
  { userFriendly: "No Margin", tailwindClass: "m-0", category: "Margin" },
  { userFriendly: "Tiny Margin", tailwindClass: "m-1", category: "Margin" },
  { userFriendly: "Small Margin", tailwindClass: "m-2", category: "Margin" },
  { userFriendly: "Medium Margin", tailwindClass: "m-4", category: "Margin" },
  { userFriendly: "Large Margin", tailwindClass: "m-6", category: "Margin" },
  { userFriendly: "Extra Large Margin", tailwindClass: "m-8", category: "Margin" },
  { userFriendly: "Center Horizontally", tailwindClass: "mx-auto", category: "Margin" },
  { userFriendly: "Small Horizontal Margin", tailwindClass: "mx-2", category: "Margin" },
  { userFriendly: "Medium Horizontal Margin", tailwindClass: "mx-4", category: "Margin" },
  { userFriendly: "Small Vertical Margin", tailwindClass: "my-2", category: "Margin" },
  { userFriendly: "Medium Vertical Margin", tailwindClass: "my-4", category: "Margin" },

  // Border
  { userFriendly: "Border", tailwindClass: "border", category: "Border" },
  { userFriendly: "No Border", tailwindClass: "border-0", category: "Border" },
  { userFriendly: "Thick Border", tailwindClass: "border-2", category: "Border" },
  { userFriendly: "Very Thick Border", tailwindClass: "border-4", category: "Border" },
  { userFriendly: "Top Border", tailwindClass: "border-t", category: "Border" },
  { userFriendly: "Bottom Border", tailwindClass: "border-b", category: "Border" },
  { userFriendly: "Left Border", tailwindClass: "border-l", category: "Border" },
  { userFriendly: "Right Border", tailwindClass: "border-r", category: "Border" },
  { userFriendly: "Solid Border", tailwindClass: "border-solid", category: "Border" },
  { userFriendly: "Dashed Border", tailwindClass: "border-dashed", category: "Border" },
  { userFriendly: "Dotted Border", tailwindClass: "border-dotted", category: "Border" },

  // Border Color
  { userFriendly: "Red Border", tailwindClass: "border-red-500", category: "Border Color" },
  { userFriendly: "Blue Border", tailwindClass: "border-blue-500", category: "Border Color" },
  { userFriendly: "Green Border", tailwindClass: "border-green-500", category: "Border Color" },
  { userFriendly: "Yellow Border", tailwindClass: "border-yellow-500", category: "Border Color" },
  { userFriendly: "Purple Border", tailwindClass: "border-purple-500", category: "Border Color" },
  { userFriendly: "Gray Border", tailwindClass: "border-gray-300", category: "Border Color" },

  // Border Radius
  { userFriendly: "No Rounded", tailwindClass: "rounded-none", category: "Border Radius" },
  { userFriendly: "Small Rounded", tailwindClass: "rounded-sm", category: "Border Radius" },
  { userFriendly: "Rounded", tailwindClass: "rounded", category: "Border Radius" },
  { userFriendly: "Medium Rounded", tailwindClass: "rounded-md", category: "Border Radius" },
  { userFriendly: "Large Rounded", tailwindClass: "rounded-lg", category: "Border Radius" },
  { userFriendly: "Extra Large Rounded", tailwindClass: "rounded-xl", category: "Border Radius" },
  { userFriendly: "Full Rounded (Circle)", tailwindClass: "rounded-full", category: "Border Radius" },

  // Shadow
  { userFriendly: "No Shadow", tailwindClass: "shadow-none", category: "Shadow" },
  { userFriendly: "Small Shadow", tailwindClass: "shadow-sm", category: "Shadow" },
  { userFriendly: "Shadow", tailwindClass: "shadow", category: "Shadow" },
  { userFriendly: "Medium Shadow", tailwindClass: "shadow-md", category: "Shadow" },
  { userFriendly: "Large Shadow", tailwindClass: "shadow-lg", category: "Shadow" },
  { userFriendly: "Extra Large Shadow", tailwindClass: "shadow-xl", category: "Shadow" },
  { userFriendly: "2X Large Shadow", tailwindClass: "shadow-2xl", category: "Shadow" },

  // Opacity
  { userFriendly: "Invisible", tailwindClass: "opacity-0", category: "Opacity" },
  { userFriendly: "Quarter Visible", tailwindClass: "opacity-25", category: "Opacity" },
  { userFriendly: "Half Visible", tailwindClass: "opacity-50", category: "Opacity" },
  { userFriendly: "Three-Quarters Visible", tailwindClass: "opacity-75", category: "Opacity" },
  { userFriendly: "Fully Visible", tailwindClass: "opacity-100", category: "Opacity" },

  // Display
  { userFriendly: "Block", tailwindClass: "block", category: "Display" },
  { userFriendly: "Inline Block", tailwindClass: "inline-block", category: "Display" },
  { userFriendly: "Inline", tailwindClass: "inline", category: "Display" },
  { userFriendly: "Flex", tailwindClass: "flex", category: "Display" },
  { userFriendly: "Grid", tailwindClass: "grid", category: "Display" },
  { userFriendly: "Hidden", tailwindClass: "hidden", category: "Display" },

  // Flex
  { userFriendly: "Flex Row", tailwindClass: "flex-row", category: "Flex" },
  { userFriendly: "Flex Column", tailwindClass: "flex-col", category: "Flex" },
  { userFriendly: "Flex Wrap", tailwindClass: "flex-wrap", category: "Flex" },
  { userFriendly: "No Wrap", tailwindClass: "flex-nowrap", category: "Flex" },

  // Justify Content
  { userFriendly: "Justify Start", tailwindClass: "justify-start", category: "Justify Content" },
  { userFriendly: "Justify Center", tailwindClass: "justify-center", category: "Justify Content" },
  { userFriendly: "Justify End", tailwindClass: "justify-end", category: "Justify Content" },
  { userFriendly: "Justify Between", tailwindClass: "justify-between", category: "Justify Content" },
  { userFriendly: "Justify Around", tailwindClass: "justify-around", category: "Justify Content" },

  // Align Items
  { userFriendly: "Align Start", tailwindClass: "items-start", category: "Align Items" },
  { userFriendly: "Align Center", tailwindClass: "items-center", category: "Align Items" },
  { userFriendly: "Align End", tailwindClass: "items-end", category: "Align Items" },
  { userFriendly: "Align Stretch", tailwindClass: "items-stretch", category: "Align Items" },

  // Gap
  { userFriendly: "No Gap", tailwindClass: "gap-0", category: "Gap" },
  { userFriendly: "Tiny Gap", tailwindClass: "gap-1", category: "Gap" },
  { userFriendly: "Small Gap", tailwindClass: "gap-2", category: "Gap" },
  { userFriendly: "Medium Gap", tailwindClass: "gap-4", category: "Gap" },
  { userFriendly: "Large Gap", tailwindClass: "gap-6", category: "Gap" },
  { userFriendly: "Extra Large Gap", tailwindClass: "gap-8", category: "Gap" },

  // Transitions
  { userFriendly: "No Transition", tailwindClass: "transition-none", category: "Transitions" },
  { userFriendly: "Transition All", tailwindClass: "transition-all", category: "Transitions" },
  { userFriendly: "Transition", tailwindClass: "transition", category: "Transitions" },
  { userFriendly: "Transition Colors", tailwindClass: "transition-colors", category: "Transitions" },
  { userFriendly: "Fast Duration", tailwindClass: "duration-150", category: "Transitions" },
  { userFriendly: "Normal Duration", tailwindClass: "duration-300", category: "Transitions" },
  { userFriendly: "Slow Duration", tailwindClass: "duration-500", category: "Transitions" },

  // Cursor
  { userFriendly: "Pointer Cursor", tailwindClass: "cursor-pointer", category: "Cursor" },
  { userFriendly: "Default Cursor", tailwindClass: "cursor-default", category: "Cursor" },
  { userFriendly: "Not Allowed Cursor", tailwindClass: "cursor-not-allowed", category: "Cursor" },

  // Position
  { userFriendly: "Static", tailwindClass: "static", category: "Position" },
  { userFriendly: "Relative", tailwindClass: "relative", category: "Position" },
  { userFriendly: "Absolute", tailwindClass: "absolute", category: "Position" },
  { userFriendly: "Fixed", tailwindClass: "fixed", category: "Position" },
  { userFriendly: "Sticky", tailwindClass: "sticky", category: "Position" },

  // Overflow
  { userFriendly: "Overflow Auto", tailwindClass: "overflow-auto", category: "Overflow" },
  { userFriendly: "Overflow Hidden", tailwindClass: "overflow-hidden", category: "Overflow" },
  { userFriendly: "Overflow Scroll", tailwindClass: "overflow-scroll", category: "Overflow" },

  // Letter Spacing
  { userFriendly: "Tight Spacing", tailwindClass: "tracking-tight", category: "Letter Spacing" },
  { userFriendly: "Normal Spacing", tailwindClass: "tracking-normal", category: "Letter Spacing" },
  { userFriendly: "Wide Spacing", tailwindClass: "tracking-wide", category: "Letter Spacing" },
  { userFriendly: "Wider Spacing", tailwindClass: "tracking-wider", category: "Letter Spacing" },

  // Line Height
  { userFriendly: "Tight Line Height", tailwindClass: "leading-tight", category: "Line Height" },
  { userFriendly: "Normal Line Height", tailwindClass: "leading-normal", category: "Line Height" },
  { userFriendly: "Relaxed Line Height", tailwindClass: "leading-relaxed", category: "Line Height" },
  { userFriendly: "Loose Line Height", tailwindClass: "leading-loose", category: "Line Height" },
];

/**
 * Get grouped classes with user-friendly names
 */
export function getUserFriendlyClasses(): { category: string; items: { label: string; value: string }[] }[] {
  const grouped = new Map<string, { label: string; value: string }[]>();
  
  classMappings.forEach(({ category, userFriendly, tailwindClass }) => {
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push({
      label: userFriendly,
      value: tailwindClass,
    });
  });

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

/**
 * Search user-friendly classes
 */
export function searchUserFriendlyClasses(query: string) {
  const lowerQuery = query.toLowerCase();
  const grouped = new Map<string, { label: string; value: string }[]>();
  
  classMappings
    .filter(({ userFriendly, tailwindClass }) => 
      userFriendly.toLowerCase().includes(lowerQuery) || 
      tailwindClass.toLowerCase().includes(lowerQuery)
    )
    .forEach(({ category, userFriendly, tailwindClass }) => {
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push({
        label: userFriendly,
        value: tailwindClass,
      });
    });

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}


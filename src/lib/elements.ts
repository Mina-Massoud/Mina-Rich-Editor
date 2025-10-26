/**
 * Centralized Element Type Definitions
 * 
 * All block types and their configurations in one place
 */

export type ElementType =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "code"
  | "blockquote"
  | "li"
  | "ol";

export interface ElementOption {
  value: ElementType;
  label: string;
  description?: string;
  icon?: string; // Icon name from lucide-react
  iconSize?: string; // Tailwind class for icon size
  shortcut?: string;
}

export const ELEMENT_OPTIONS: ElementOption[] = [
  {
    value: "p",
    label: "Text",
    description: "Plain text paragraph",
    icon: "Type",
    iconSize: "h-4 w-4",
  },
  {
    value: "h1",
    label: "Heading 1",
    description: "Big section heading",
    icon: "Heading1",
    iconSize: "h-4 w-4",
    shortcut: "⌘⌥1",
  },
  {
    value: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: "Heading2",
    iconSize: "h-4 w-4",
    shortcut: "⌘⌥2",
  },
  {
    value: "h3",
    label: "Heading 3",
    description: "Small section heading",
    icon: "Heading3",
    iconSize: "h-4 w-4",
    shortcut: "⌘⌥3",
  },
  {
    value: "h4",
    label: "Heading 4",
    description: "Smaller heading",
    icon: "Type",
    iconSize: "h-3.5 w-3.5",
  },
  {
    value: "h5",
    label: "Heading 5",
    description: "Tiny heading",
    icon: "Type",
    iconSize: "h-3 w-3",
  },
  {
    value: "h6",
    label: "Heading 6",
    description: "Smallest heading",
    icon: "Type",
    iconSize: "h-2.5 w-2.5",
  },
  {
    value: "code",
    label: "Code",
    description: "Code block with syntax highlighting",
    icon: "Code",
    iconSize: "h-4 w-4",
  },
  {
    value: "blockquote",
    label: "Quote",
    description: "Quote or callout",
    icon: "Quote",
    iconSize: "h-4 w-4",
  },
  {
    value: "li",
    label: "Bulleted List",
    description: "Unordered list item",
    icon: "List",
    iconSize: "h-4 w-4",
  },
  {
    value: "ol",
    label: "Numbered List",
    description: "Ordered list item",
    icon: "ListOrdered",
    iconSize: "h-4 w-4",
  },
];


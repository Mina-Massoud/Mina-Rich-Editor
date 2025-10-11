/**
 * Mina Rich Editor - Simple Single Block Editor
 * 
 * A minimal editor demonstrating text formatting with our CRUD system.
 * Focus on: Select text → Click format button → Update via reducer
 * 
 * REFACTORED VERSION - Now uses shadcn/ui components for beautiful design
 */

"use client";

import React, { useRef, useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  useEditor,
  EditorActions,
  type TextNode,
  type EditorNode,
  type SelectionInfo,
  hasInlineChildren,
  getNodeTextContent,
  serializeToHtml,
  isTextNode,
  isContainerNode,
  ContainerNode,
} from "../lib";
import { Block } from "./Block";
import { AddBlockButton } from "./AddBlockButton";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Bold,
  Italic,
  Underline,
  Type,
  ImagePlus,
  Loader2,
  Code,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import { uploadImage } from "../lib/utils/image-upload";
import { useToast } from "@/hooks/use-toast";

/**
 * Parse DOM element back into inline children structure
 * This preserves formatting when user types in a formatted block
 */
function parseDOMToInlineChildren(element: HTMLElement): TextNode["children"] {
  const children: TextNode["children"] = [];

  const walkNode = (
    node: Node,
    inheritedFormats: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      elementType?:
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "code"
        | "blockquote";
    } = {}
  ) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Direct text node - use inherited formatting
      const content = node.textContent || "";
      if (content) {
        const hasAnyFormatting =
          inheritedFormats.bold ||
          inheritedFormats.italic ||
          inheritedFormats.underline ||
          inheritedFormats.elementType;
        if (hasAnyFormatting) {
          children.push({
            content,
            bold: inheritedFormats.bold || undefined,
            italic: inheritedFormats.italic || undefined,
            underline: inheritedFormats.underline || undefined,
            elementType: inheritedFormats.elementType,
          });
        } else {
          children.push({ content });
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const classList = Array.from(el.classList);
      
      // Detect formatting from classes
      const bold = classList.includes("font-bold");
      const italic = classList.includes("italic");
      const underline = classList.includes("underline");
      
      // Detect element type from classes
      let elementType:
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "code"
        | "blockquote"
        | undefined = undefined;
      if (classList.some((c) => c.includes("text-5xl"))) {
        elementType = "h1";
      } else if (classList.some((c) => c.includes("text-4xl"))) {
        elementType = "h2";
      } else if (classList.some((c) => c.includes("text-3xl"))) {
        elementType = "h3";
      } else if (classList.some((c) => c.includes("text-2xl"))) {
        elementType = "h4";
      } else if (
        classList.some((c) => c.includes("text-xl")) &&
        !classList.includes("border-l-4")
      ) {
        elementType = "h5";
      } else if (
        classList.some((c) => c.includes("text-lg")) &&
        classList.includes("font-semibold")
      ) {
        elementType = "h6";
      } else if (classList.includes("font-mono")) {
        elementType = "code";
      } else if (classList.includes("border-l-4")) {
        elementType = "blockquote";
      }
      
      // Merge with inherited formatting
      const currentFormats = {
        bold: bold || inheritedFormats.bold,
        italic: italic || inheritedFormats.italic,
        underline: underline || inheritedFormats.underline,
        elementType: elementType || inheritedFormats.elementType,
      };
      
      // If it's a span with formatting, walk its children with inherited formats
      if (el.tagName === "SPAN") {
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNode(node.childNodes[i], currentFormats);
        }
      } else {
        // For other elements (like the main div), just walk children
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNode(node.childNodes[i], inheritedFormats);
        }
      }
    }
  };
  
  for (let i = 0; i < element.childNodes.length; i++) {
    walkNode(element.childNodes[i]);
  }
  
  // Filter out empty content
  return children.filter((child) => child.content && child.content.length > 0);
}

/**
 * Detect which formats are active in a given range of a node
 */
function detectFormatsInRange(
  node: TextNode,
  start: number,
  end: number
): {
  bold: boolean; 
  italic: boolean; 
  underline: boolean;
  elementType?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "code"
    | "blockquote"
    | null;
} {
  const formats = {
    bold: false,
    italic: false,
    underline: false,
    elementType: null as any,
  };
  
  // If node has no children, check node-level attributes
  if (!node.children || node.children.length === 0) {
    return {
      bold: node.attributes?.bold === true,
      italic: node.attributes?.italic === true,
      underline: node.attributes?.underline === true,
      elementType: null,
    };
  }
  
  // Node has children array - analyze the range
  let currentPos = 0;
  let hasAnyBold = false;
  let hasAnyItalic = false;
  let hasAnyUnderline = false;
  let allBold = true;
  let allItalic = true;
  let allUnderline = true;
  let charsInRange = 0;
  let firstElementType: typeof formats.elementType = undefined;
  let allSameElementType = true;
  
  for (const child of node.children) {
    const childLength = (child.content || "").length;
    const childStart = currentPos;
    const childEnd = currentPos + childLength;
    
    // Check if this child overlaps with the selection
    const overlaps = childStart < end && childEnd > start;
    
    if (overlaps) {
      charsInRange += Math.min(childEnd, end) - Math.max(childStart, start);
      
      if (child.bold) {
        hasAnyBold = true;
      } else {
        allBold = false;
      }
      
      if (child.italic) {
        hasAnyItalic = true;
      } else {
        allItalic = false;
      }
      
      if (child.underline) {
        hasAnyUnderline = true;
      } else {
        allUnderline = false;
      }
      
      // Check element type
      const childElementType = child.elementType || null;
      if (firstElementType === undefined) {
        firstElementType = childElementType;
      } else if (firstElementType !== childElementType) {
        allSameElementType = false;
      }
    }
    
    currentPos = childEnd;
  }
  
  // A format is "active" if ALL selected text has that format
  return {
    bold: charsInRange > 0 && allBold,
    italic: charsInRange > 0 && allItalic,
    underline: charsInRange > 0 && allUnderline,
    elementType: allSameElementType ? firstElementType : null,
  };
}

/**
 * Simple Editor Component - Single editable block
 */
interface SimpleEditorProps {
  readOnly?: boolean; // View-only mode - renders content without editing capabilities
}

export function SimpleEditor({ readOnly = false }: SimpleEditorProps = {}) {
  const [state, dispatch] = useEditor();
  const { toast } = useToast();
  const [animationParent] = useAutoAnimate();
  const lastEnterTime = useRef<number>(0);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const contentUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [enhanceSpaces, setEnhanceSpaces] = useState(false);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(
    null
  );
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Get the current container from history
  const container = state.history[state.historyIndex];

  console.log("state", state);
  console.log("History:", { 
    current: state.historyIndex, 
    total: state.history.length,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1
  });

  // Initialize with comprehensive demo content if empty
  useEffect(() => {
    if (container.children.length === 0 && !readOnly) {
      const timestamp = Date.now();

      // Create a comprehensive documentation/showcase document
      const demoNodes: EditorNode[] = [
        // Title
        {
          id: `h1-${timestamp}-1`,
          type: "h1",
          content: "📚 Mina Rich Editor - Complete Documentation",
          attributes: {},
        } as TextNode,

        // Subtitle
        {
          id: `p-${timestamp}-2`,
          type: "p",
          children: [
            { content: "A ", bold: false },
            { content: "powerful", bold: true },
            { content: ", ", bold: false },
            { content: "TypeScript-first", italic: true },
            { content: " rich text editor with ", bold: false },
            { content: "nested blocks", underline: true },
            {
              content:
                ", inline formatting, and read-only mode. Built with React, TypeScript, and Tailwind CSS.",
              bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        // Installation
        {
          id: `h2-${timestamp}-3`,
          type: "h2",
          content: "📦 Installation",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-4`,
          type: "p",
          content: "Install the required dependencies:",
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-5`,
          type: "code",
          content: "npm install react react-dom typescript tailwindcss",
          attributes: {},
        } as TextNode,

        // Quick Start
        {
          id: `h2-${timestamp}-6`,
          type: "h2",
          content: "🚀 Quick Start",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-7`,
          type: "p",
          content:
            "Wrap your editor with the EditorProvider and add the SimpleEditor component:",
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-8`,
          type: "code",
          content: `import { EditorProvider } from '@/lib';
import { SimpleEditor } from '@/components/SimpleEditor';

export default function App() {
  return (
    <EditorProvider>
      <SimpleEditor />
    </EditorProvider>
  );
}`,
          attributes: {},
        } as TextNode,

        // Read-only mode
        {
          id: `h3-${timestamp}-9`,
          type: "h3",
          content: "👁️ Read-Only Mode",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-10`,
          type: "p",
          children: [
            {
              content:
                "Perfect for displaying content without editing. Just pass ",
              bold: false,
            },
            { content: "readOnly={true}", elementType: "code" },
            { content: " prop:", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-11`,
          type: "code",
          content: "<SimpleEditor readOnly={true} />",
          attributes: {},
        } as TextNode,

        {
          id: `blockquote-${timestamp}-12`,
          type: "blockquote",
          children: [
            { content: "💡 Tip: ", bold: true },
            { content: "Try toggling the ", italic: true },
            { content: "View Only", italic: true, bold: true },
            {
              content: " checkbox in the top-right to see this in action!",
              italic: true,
            },
          ],
          attributes: {},
        } as TextNode,

        // Text Formatting
        {
          id: `h2-${timestamp}-13`,
          type: "h2",
          content: "✨ Text Formatting",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-14`,
          type: "p",
          content: "Select any text and use the toolbar to apply formatting:",
          attributes: {},
        } as TextNode,

        // Formatted paragraph
        {
          id: `p-${timestamp}-15`,
          type: "p",
          children: [
            { content: "You can make text ", bold: false },
            { content: "bold", bold: true },
            { content: ", ", bold: false },
            { content: "italic", italic: true },
            { content: ", ", bold: false },
            { content: "underlined", underline: true },
            { content: ", or ", bold: false },
            {
              content: "combine them all",
              bold: true,
              italic: true,
              underline: true,
            },
            {
              content:
                "! Mix and match formatting to create beautiful content.",
              bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-16`,
          type: "code",
          content: `// Formatting is stored in a structured format
const textNode = {
  id: 'p-1234',
        type: 'p',
  children: [
    { 
      content: 'Hello ', 
      bold: false 
    },
    { 
      content: 'World', 
      bold: true,
      italic: true,
      underline: true
    }
  ],
  attributes: {}
};`,
          attributes: {},
        } as TextNode,

        // Block Types
        {
          id: `h2-${timestamp}-17`,
          type: "h2",
          content: "📋 Block Types",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-18`,
          type: "p",
          content:
            "The editor supports multiple block types. Use the type selector in the toolbar:",
          attributes: {},
        } as TextNode,

        {
          id: `h1-${timestamp}-19`,
          type: "h1",
          content: "Heading 1 - Large title",
          attributes: {},
        } as TextNode,

        {
          id: `h2-${timestamp}-20`,
          type: "h2",
          content: "Heading 2 - Section title",
          attributes: {},
        } as TextNode,

        {
          id: `h3-${timestamp}-21`,
          type: "h3",
          content: "Heading 3 - Subsection",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-22`,
          type: "p",
          content: "Paragraph - Regular text content",
          attributes: {},
        } as TextNode,

        {
          id: `blockquote-${timestamp}-23`,
          type: "blockquote",
          children: [
            { content: "Blockquote - ", italic: true },
            {
              content:
                'Perfect for quotes and callouts. "The best way to predict the future is to invent it." - Alan Kay',
              italic: true,
            },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-24`,
          type: "code",
          content: `// Code Block - Multiline support with proper formatting
function createEditor(options) {
  return new MinaEditor({
    readOnly: options.viewOnly,
    theme: 'dark',
    features: {
      nestedBlocks: true,
      inlineFormatting: true,
      htmlExport: true
    }
  });
}`,
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-25`,
          type: "li",
          content: "List Item 1 - Ordered list items",
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-26`,
          type: "li",
          content: "List Item 2 - Auto-numbered",
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-27`,
          type: "li",
          content: "List Item 3 - Can be formatted too!",
          attributes: {},
        } as TextNode,

        // Inline Element Types
        {
          id: `h2-${timestamp}-28`,
          type: "h2",
          content: "🎨 Inline Element Types",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-29`,
          type: "p",
          content:
            "Apply heading styles inline within paragraphs. Select text and choose from the element type dropdown:",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-30`,
          type: "p",
          children: [
            { content: "This is ", bold: false },
            { content: "H1 styled text", elementType: "h1" },
            { content: " and ", bold: false },
            { content: "H2 styled text", elementType: "h2" },
            { content: " within a paragraph, with ", bold: false },
            { content: "inline code", elementType: "code" },
            { content: " support!", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-31`,
          type: "code",
          content: `// Inline element types - style text within blocks
const paragraph = {
  id: 'p-5678',
  type: 'p',  // Paragraph block
  children: [
    { 
      content: 'Regular text ' 
    },
    { 
      content: 'Large title', 
      elementType: 'h1' 
    },
    { 
      content: ' and ', 
    },
    { 
      content: 'inline code', 
      elementType: 'code',
      bold: true 
    }
  ],
  attributes: {}
};`,
          attributes: {},
        } as TextNode,

        // Nested blocks heading
        {
          id: `h2-${timestamp}-32`,
          type: "h2",
          content: "🪆 Nested Blocks",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-33`,
          type: "p",
          children: [
            { content: "Press ", bold: false },
            { content: "Shift+Enter", elementType: "code", bold: true },
            {
              content:
                " to create nested blocks. Maximum nesting level is 1 (nested blocks cannot be nested further).",
          bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        // Nested container
        {
          id: `container-${timestamp}-34`,
          type: "container",
          children: [
            {
              id: `p-${timestamp}-35`,
              type: "p",
              children: [
                { content: "📦 This is a ", bold: false },
                { content: "nested container", bold: true },
                {
                  content: "! It groups related content together.",
                  bold: false,
                },
              ],
              attributes: {},
            } as TextNode,
            {
              id: `p-${timestamp}-36`,
              type: "p",
              content:
                "Each nested block can have its own formatting and type.",
              attributes: {},
            } as TextNode,
            {
              id: `code-${timestamp}-37`,
              type: "code",
              content: `// Code blocks work in nested containers too!
const nestedBlock = {
  type: 'container',
  children: [
    { type: 'p', content: 'Paragraph' },
    { type: 'code', content: 'const x = 1;' }
  ]
};

console.log('Nested blocks are awesome!');`,
              attributes: {},
            } as TextNode,
            {
              id: `blockquote-${timestamp}-38`,
              type: "blockquote",
              content:
                "And quotes too! Perfect for organizing complex content.",
              attributes: {},
            } as TextNode,
          ],
          attributes: {},
        } as ContainerNode,

        {
          id: `code-${timestamp}-39`,
          type: "code",
          content: `// Nested blocks structure
{
  type: 'container',
  children: [
    { type: 'p', content: 'First nested block' },
    { type: 'p', content: 'Second nested block' },
    { type: 'code', content: 'Code in nested block' }
  ]
}`,
          attributes: {},
        } as TextNode,

        // Keyboard Shortcuts
        {
          id: `h2-${timestamp}-40`,
          type: "h2",
          content: "⌨️ Keyboard Shortcuts",
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-41`,
          type: "li",
          children: [
            { content: "Enter", elementType: "code", bold: true },
            { content: " - Create new block after current one", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-42`,
          type: "li",
          children: [
            { content: "Shift + Enter", elementType: "code", bold: true },
            {
              content: " - Create nested block or add to existing nest",
              bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-43`,
          type: "li",
          children: [
            { content: "Ctrl/Cmd + A", elementType: "code", bold: true },
            { content: " - Select all content (for copying)", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-44`,
          type: "li",
          children: [
            { content: "Backspace/Delete", elementType: "code", bold: true },
            { content: " - Delete current block (when empty)", bold: false },
          ],
          attributes: {},
        } as TextNode,

        // HTML Export
        {
          id: `h2-${timestamp}-45`,
          type: "h2",
          content: "📤 HTML Export",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-46`,
          type: "p",
          content:
            "Export your content to beautiful HTML with Tailwind CSS classes:",
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-47`,
          type: "code",
          content: `import { serializeToHtml } from '@/lib/utils/serialize-to-html';

// Get the editor state
const html = serializeToHtml(editorState.container);

// Returns formatted HTML with Tailwind classes
// Ready for rendering in your app!`,
          attributes: {},
        } as TextNode,

        // Key Features
        {
          id: `h2-${timestamp}-48`,
          type: "h2",
          content: "🎯 Key Features Summary",
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-49`,
          type: "li",
          children: [
            { content: "✅ Immutable State Management", bold: true },
            {
              content: " - Built with reducers for predictable updates",
              bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-50`,
          type: "li",
          children: [
            { content: "✅ TypeScript-First", bold: true },
            {
              content: " - Fully typed API with excellent IntelliSense",
              bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-51`,
          type: "li",
          children: [
            { content: "✅ Nested Blocks", bold: true },
            { content: " - Organize content hierarchically", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-52`,
          type: "li",
          children: [
            { content: "✅ Read-Only Mode", bold: true },
            {
              content: " - Perfect for displaying published content",
              bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-53`,
          type: "li",
          children: [
            { content: "✅ Dark Mode Support", bold: true },
            { content: " - Beautiful themes out of the box", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-54`,
          type: "li",
          children: [
            { content: "✅ HTML Export", bold: true },
            { content: " - Serialize to production-ready HTML", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-55`,
          type: "li",
          children: [
            { content: "✅ Image Support", bold: true },
            { content: " - Upload and manage images inline", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-56`,
          type: "li",
          children: [
            { content: "✅ Inline Formatting", bold: true },
            { content: " - Apply styles to selected text ranges", bold: false },
          ],
          attributes: {},
        } as TextNode,

        // Final CTA
        {
          id: `h2-${timestamp}-57`,
          type: "h2",
          content: "🎨 Try It Out!",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-58`,
          type: "p",
          children: [
            { content: "👉 ", bold: false },
            { content: "Select any text", bold: true },
            { content: " and use the toolbar above to format it", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-59`,
          type: "p",
          children: [
            { content: "👉 Press ", bold: false },
            { content: "Enter", elementType: "code" },
            { content: " to create new blocks", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-60`,
          type: "p",
          children: [
            { content: "👉 Press ", bold: false },
            { content: "Shift+Enter", elementType: "code" },
            { content: " for nested blocks", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-61`,
          type: "p",
          children: [
            { content: "👉 Toggle ", bold: false },
            { content: "View Only", bold: true },
            {
              content: " mode in the top-right to see the read-only version",
              bold: false,
            },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-62`,
          type: "p",
          children: [
            { content: "👉 Switch to ", bold: false },
            { content: "Dark Mode", bold: true },
            { content: " using the theme toggle", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `blockquote-${timestamp}-63`,
          type: "blockquote",
          children: [
            { content: "💡 Pro Tip: ", bold: true },
            {
              content:
                "Use the debug panel below to see the JSON structure and copy HTML output. This is your living documentation - feel free to edit, experiment, and explore all features!",
              italic: true,
            },
          ],
          attributes: {},
        } as TextNode,

        // About the Creator
        {
          id: `h2-${timestamp}-64`,
          type: "h2",
          content: "👨‍💻 About the Creator",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-65`,
          type: "p",
          children: [
            { content: "Built by ", bold: false },
            { content: "Mina Massoud", bold: true },
            { content: " - Frontend Developer based in Cairo, Egypt 🇪🇬", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `blockquote-${timestamp}-66`,
          type: "blockquote",
          children: [
            { content: "\"", bold: false },
            { content: "Survived 4 years of school, mastered 3 years of frontend sorcery. Still debugging my life.", italic: true, bold: false },
            { content: "\"", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-67`,
          type: "p",
          children: [
            { content: "🌐 Portfolio: ", bold: false },
            { content: "https://mina-massoud.com/", bold: true, underline: true, href: "https://mina-massoud.com/" },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-68`,
          type: "p",
          children: [
            { content: "💼 LinkedIn: ", bold: false },
            { content: "linkedin.com/in/mina-melad/", bold: true, href: "https://linkedin.com/in/mina-melad/" },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-69`,
          type: "p",
          children: [
            { content: "💻 GitHub: ", bold: false },
            { content: "github.com/Mina-Massoud", bold: true, href: "https://github.com/Mina-Massoud" },
          ],
          attributes: {},
        } as TextNode,

        // Mina Scheduler Section
        {
          id: `h3-${timestamp}-70`,
          type: "h3",
          content: "📅 Discover Mina Scheduler",
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-71`,
          type: "p",
          content: "Check out another powerful library I've built - a customizable calendar component for React!",
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-72`,
          type: "li",
          children: [
            { content: "⭐ 560+ Stars on GitHub", bold: true },
            { content: " - Trusted by developers worldwide", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-73`,
          type: "li",
          children: [
            { content: "🎨 Built with Next UI & shadcn/ui", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-74`,
          type: "li",
          children: [
            { content: "📆 Day, Week, Month Views", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-75`,
          type: "li",
          children: [
            { content: "🎯 Drag & Drop Events", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `li-${timestamp}-76`,
          type: "li",
          children: [
            { content: "💾 State Management with Reducers", bold: false },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-77`,
          type: "p",
          children: [
            { content: "🔗 GitHub: ", bold: false },
            { content: "https://github.com/Mina-Massoud/mina-scheduler", bold: true, underline: true, href: "https://github.com/Mina-Massoud/mina-scheduler" },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `p-${timestamp}-78`,
          type: "p",
          children: [
            { content: "🌐 Live Demo: ", bold: false },
            { content: "https://mina-scheduler.vercel.app/", bold: true, underline: true, href: "https://mina-scheduler.vercel.app/" },
          ],
          attributes: {},
        } as TextNode,

        {
          id: `code-${timestamp}-79`,
          type: "code",
          content: `// Install Mina Scheduler
npm install mina-scheduler

// Use in your React app
import { Scheduler } from 'mina-scheduler';

function App() {
  return <Scheduler events={events} />;
}`,
          attributes: {},
        } as TextNode,

        {
          id: `blockquote-${timestamp}-80`,
          type: "blockquote",
          content: "If you enjoy this Rich Editor, you'll love Mina Scheduler! Both libraries share the same philosophy: beautiful UI, clean code, and developer-friendly APIs.",
          attributes: {},
        } as TextNode,
      ];

      // Dispatch all nodes
      demoNodes.forEach((node) => {
        dispatch(EditorActions.insertNode(node, container.id, "append"));
      });

      // Set first node as active
      if (demoNodes.length > 0) {
        dispatch(EditorActions.setActiveNode(demoNodes[0].id));
      }
    } else if (!state.activeNodeId && container.children.length > 0) {
      dispatch(
        EditorActions.setActiveNode(container.children[0]?.id || null)
      );
    }
  }, [
    container.children.length,
    state.activeNodeId,
    dispatch,
    container.id,
    readOnly,
  ]);

  const currentNode = state.activeNodeId 
    ? (container.children.find((n) => n.id === state.activeNodeId) as
        | TextNode
        | undefined)
    : (container.children[0] as TextNode | undefined);

  // Track text selection and update state
  const handleSelectionChange = React.useCallback(() => {
    console.log("📍 [handleSelectionChange] Called");
    const selection = window.getSelection();
    const hasText =
      selection !== null &&
      !selection.isCollapsed &&
      selection.toString().length > 0;
    console.log("Selection hasText:", hasText, "text:", selection?.toString());
    
    // Get the FRESH current node from state (not the stale one from render)
    const freshCurrentNode = state.activeNodeId 
      ? (container.children.find((n) => n.id === state.activeNodeId) as
          | TextNode
          | undefined)
      : (container.children[0] as TextNode | undefined);
    
    console.log("🔄 Fresh current node:", freshCurrentNode);
    
    if (hasText && freshCurrentNode && selection) {
      const element = nodeRefs.current.get(freshCurrentNode.id);
      if (element) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(element);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        const end = start + range.toString().length;
        
        console.log("📏 Selection range calculated:", {
          start,
          end,
          nodeId: freshCurrentNode.id,
        });
        
        // Detect active formats in the selected range
        const detected = detectFormatsInRange(freshCurrentNode, start, end);
        console.log("🎨 Detected formats in range:", detected);
        
        const selectionInfo: SelectionInfo = {
          text: selection.toString(),
          start,
          end,
          nodeId: freshCurrentNode.id,
          formats: {
            bold: detected.bold,
            italic: detected.italic,
            underline: detected.underline,
          },
          elementType: detected.elementType,
        };
        
        // Only dispatch if selection actually changed
        const currentSel = state.currentSelection;
        const changed =
          !currentSel ||
          currentSel.start !== start || 
          currentSel.end !== end || 
          currentSel.nodeId !== freshCurrentNode.id ||
          currentSel.formats.bold !== detected.bold ||
          currentSel.formats.italic !== detected.italic ||
          currentSel.formats.underline !== detected.underline;
        
        if (changed) {
          console.log(
            "🚀 Dispatching setCurrentSelection with:",
            selectionInfo
          );
          dispatch(EditorActions.setCurrentSelection(selectionInfo));
        }
      }
    } else if (state.currentSelection !== null) {
      console.log("🚀 Dispatching setCurrentSelection(null) - no selection");
      dispatch(EditorActions.setCurrentSelection(null));
    }
  }, [state, dispatch]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Helper function to find a node in the tree (including nested containers)
  const findNodeInTree = (
    searchId: string,
    container: ContainerNode
  ): {
    node: EditorNode;
    parentId: string | null;
    siblings: EditorNode[];
  } | null => {
    // Check direct children
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i];
      if (child.id === searchId) {
        return {
          node: child,
          parentId: container.id,
          siblings: container.children,
        };
      }
      // If child is a container, search recursively
      if (isContainerNode(child)) {
        const found = findNodeInTree(searchId, child as ContainerNode);
        if (found) return found;
      }
    }
    return null;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    nodeId: string
  ) => {
    if (e.key === "Enter") {
      const result = findNodeInTree(nodeId, container);
      if (!result || !isTextNode(result.node)) return;
      const node = result.node as TextNode;
      
      // Shift+Enter: For list items, add a new line within the SAME block
      // For other blocks, insert a line break within the block
      if (e.shiftKey) {
        e.preventDefault();
        
        // For list items, add a new line to the lines array
        if (node.type === "li") {
          const element = nodeRefs.current.get(nodeId);
          if (!element) return;
          
          // Get current text content from DOM
          const textContent = element.innerText || element.textContent || "";
          
          // Parse the current content into lines
          const lines = textContent
            .split("\n")
            .map((line) => ({ content: line }));
          
          // Add a new empty line
          lines.push({ content: "" });
          
          // Update the node with the new lines structure
          dispatch(
            EditorActions.updateNode(nodeId, {
            lines: lines,
            content: undefined, // Clear old content field
            children: undefined, // Clear old children field
            })
          );
          
          console.log("📝 CRUD Action: ADD_LINE to list item", {
            nodeId,
            totalLines: lines.length,
          });
          
          // Focus and move cursor to the new line
          setTimeout(() => {
            if (element) {
              element.focus();
              // Move cursor to end
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(element);
              range.collapse(false);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }, 10);
        } else {
          // For non-list items, just insert a line break within the block
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const br = document.createElement("br");
            range.insertNode(br);
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            const element = nodeRefs.current.get(nodeId);
            if (element) {
              handleContentChange(nodeId, element);
            }
          }
        }
        
        return;
      }
      
      e.preventDefault();

      const currentTime = Date.now();
      const timeSinceLastEnter = currentTime - lastEnterTime.current;
      
      // Get cursor position
      const selection = window.getSelection();
      const element = nodeRefs.current.get(nodeId);
      
      if (!element || !selection) return;
      
      // Calculate cursor position in text
      let cursorPosition = 0;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(element);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        cursorPosition = preSelectionRange.toString().length;
      }
      
      // Get the full text content
      const fullText = getNodeTextContent(node);
      
      // Check if this is a list item (ol/li)
      if (node.type === "li") {
        // If the list item is empty, exit the list
        if (!fullText || fullText.trim() === "") {
          // Convert to paragraph and exit list
          const newNode: TextNode = {
            id: "p-" + Date.now(),
            type: "p",
            content: "",
            attributes: {},
          };
          
          dispatch(EditorActions.deleteNode(nodeId));
          dispatch(EditorActions.insertNode(newNode, nodeId, "after"));
          dispatch(EditorActions.setActiveNode(newNode.id));
          
          setTimeout(() => {
            const newElement = nodeRefs.current.get(newNode.id);
            if (newElement) {
              newElement.focus();
            }
          }, 10);
          
          return;
        }
        
        // Create new list item after current one
        const beforeCursor = fullText.substring(0, cursorPosition);
        const afterCursor = fullText.substring(cursorPosition);
        
        // Update current node with content before cursor
        dispatch(
          EditorActions.updateNode(nodeId, {
          content: beforeCursor,
          })
        );
        
        // Create new list item with content after cursor
        const newNode: TextNode = {
          id: "li-" + Date.now(),
          type: "li",
          content: afterCursor,
          attributes: {},
        };
        
        dispatch(EditorActions.insertNode(newNode, nodeId, "after"));
        dispatch(EditorActions.setActiveNode(newNode.id));
        
        lastEnterTime.current = currentTime;
        
        setTimeout(() => {
          const newElement = nodeRefs.current.get(newNode.id);
          if (newElement) {
            newElement.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            if (newElement.childNodes.length > 0) {
              const firstNode = newElement.childNodes[0];
              range.setStart(firstNode, 0);
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        }, 10);
        
        return;
      }
      
      // Regular paragraph/heading - create normal block
      {
        // Split content at cursor position
        const beforeCursor = fullText.substring(0, cursorPosition);
        const afterCursor = fullText.substring(cursorPosition);
        
        // Check if node has inline children (formatted content)
        const nodeHasInlineChildren = hasInlineChildren(node);
        
        if (nodeHasInlineChildren && node.children) {
          // Split inline children at cursor position
          let currentPos = 0;
          const beforeChildren: typeof node.children = [];
          const afterChildren: typeof node.children = [];
          let splitDone = false;
          
          for (const child of node.children) {
            const childLength = (child.content || "").length;
            const childStart = currentPos;
            const childEnd = currentPos + childLength;
            
            if (splitDone) {
              // Everything after the split goes to the new node
              afterChildren.push({ ...child });
            } else if (cursorPosition <= childStart) {
              // Cursor is before this child - entire child goes to new node
              afterChildren.push({ ...child });
              splitDone = true;
            } else if (cursorPosition >= childEnd) {
              // Cursor is after this child - entire child stays in current node
              beforeChildren.push({ ...child });
            } else {
              // Cursor is in the middle of this child - need to split it
              const offsetInChild = cursorPosition - childStart;
              
              // Part before cursor stays in current node
              if (offsetInChild > 0) {
                beforeChildren.push({
                  ...child,
                  content: child.content!.substring(0, offsetInChild),
                });
              }
              
              // Part after cursor goes to new node
              if (offsetInChild < childLength) {
                afterChildren.push({
                  ...child,
                  content: child.content!.substring(offsetInChild),
                });
              }
              
              splitDone = true;
            }
            
            currentPos = childEnd;
          }
          
          // Update current node with children before cursor
          dispatch(
            EditorActions.updateNode(nodeId, {
            children: beforeChildren.length > 0 ? beforeChildren : undefined,
              content:
                beforeChildren.length === 0 ? beforeCursor : node.content,
            })
          );
          
          // Create new node with children after cursor (deep copy with all properties)
          const newNode: TextNode = {
            id: `${node.type}-` + Date.now(),
            type: node.type,
            content: afterChildren.length === 0 ? afterCursor : node.content,
            children: afterChildren.length > 0 ? afterChildren : undefined,
            attributes: { ...node.attributes },
          };
          
          dispatch(EditorActions.insertNode(newNode, nodeId, "after"));
          dispatch(EditorActions.setActiveNode(newNode.id));
        } else {
          // Simple case: no inline children, just plain text
          // Update current node with content before cursor
          dispatch(
            EditorActions.updateNode(nodeId, {
            content: beforeCursor,
            })
          );
          
          // Create new node with content after cursor (deep copy all properties)
          const newNode: TextNode = {
            id: `${node.type}-` + Date.now(),
            type: node.type,
            content: afterCursor,
            attributes: { ...node.attributes },
          };
          
          dispatch(EditorActions.insertNode(newNode, nodeId, "after"));
          dispatch(EditorActions.setActiveNode(newNode.id));
        }
        
        console.log("📝 CRUD Action: INSERT_NODE with split content", {
          nodeType: node.type,
          after: nodeId,
          beforeCursor,
          afterCursor,
        });
        
        lastEnterTime.current = currentTime;
        
        // Focus the new node after a brief delay and place cursor at start
        setTimeout(() => {
          const newElement = nodeRefs.current.get(
            `${node.type}-` + currentTime
          );
          if (newElement) {
            newElement.focus();
            // Place cursor at the start of the new node
            const range = document.createRange();
            const sel = window.getSelection();
            if (newElement.childNodes.length > 0) {
              const firstNode = newElement.childNodes[0];
              range.setStart(firstNode, 0);
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        }, 10);
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      const result = findNodeInTree(nodeId, container);
      if (!result || !isTextNode(result.node)) return;

      const node = result.node as TextNode;
      const { siblings } = result;

      const selection = window.getSelection();
      const cursorAtStart =
        selection && selection.anchorOffset === 0 && selection.isCollapsed;

      // Get the full text content (handles both simple content and inline children)
      const fullTextContent = getNodeTextContent(node);
      const isNodeEmpty = !fullTextContent || fullTextContent.trim() === "";

      // If cursor is at the start and node is empty or BR, delete the node
      if (
        (cursorAtStart && isNodeEmpty) ||
        node.type === "br"
      ) {
        e.preventDefault();
        
        const currentIndex = siblings.findIndex((n) => n.id === nodeId);
        
        // Don't delete if it's the only node in the container
        if (siblings.length === 1) {
          // Just clear the content instead
          if (hasInlineChildren(node)) {
            dispatch(EditorActions.updateNode(node.id, { children: [] }));
          } else if (node.content) {
            dispatch(EditorActions.updateContent(node.id, ""));
          }
          return;
        }

        // Delete the current node
        dispatch(EditorActions.deleteNode(nodeId));
        console.log("📝 CRUD Action: DELETE_NODE", {
          nodeId: nodeId,
          nodeType: node.type,
        });

        // Focus the previous node if it exists, otherwise the next one
        const prevNode = siblings[currentIndex - 1];
        const nextNode = siblings[currentIndex + 1];
          const nodeToFocus = prevNode || nextNode;
          
          if (nodeToFocus) {
            dispatch(EditorActions.setActiveNode(nodeToFocus.id));
        }
      }
    }
  };

  const handleContentChange = (nodeId: string, element: HTMLElement) => {
    const result = findNodeInTree(nodeId, container);
    if (!result || !isTextNode(result.node)) return;
    const node = result.node as TextNode;

    const newContent = element.textContent || "";
    
    // Get the current text content (from plain content or inline children)
    const currentContent = getNodeTextContent(node);
    
    // Only update if content actually changed
    if (newContent !== currentContent) {
      // Clear any existing timer for this node
      const existingTimer = contentUpdateTimers.current.get(nodeId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // Debounce the state update - only update after user stops typing for 150ms
      const timer = setTimeout(() => {
        // Auto-detect ordered list pattern: "1. ", "2. ", etc. (only with space)
        const orderedListMatch = newContent.match(/^(\d+)\.\s(.+)$/);
        
        if (orderedListMatch && node.type === "p") {
          // Convert to list item and remove only the number prefix
          const [_, number, content] = orderedListMatch;
          
          dispatch(
            EditorActions.updateNode(node.id, {
              type: "li",
            content: content,
            })
          );
          
          console.log("📝 CRUD Action: AUTO-CONVERT to ordered list", {
            nodeId: node.id,
            listNumber: number,
            content: content,
          });
        } else if (
          node.type === "li" &&
          (node.lines || newContent.includes("\n"))
        ) {
          // List items with line breaks should always use lines structure
          const textLines = newContent
            .split("\n")
            .filter((line) => line.trim() !== "");
          
          if (textLines.length > 1) {
            // Multiple lines - use lines structure
            const updatedLines = textLines.map((lineText) => {
              // Remove number prefix if present (e.g., "1. text" -> "text")
              const cleanedText = lineText.replace(/^\d+\.\s*/, "");
              return { content: cleanedText };
            });
            
            dispatch(
              EditorActions.updateNode(node.id, {
              lines: updatedLines,
              content: undefined, // Clear simple content
              children: undefined, // Clear children
              })
            );
            
            console.log("📝 CRUD Action: UPDATE_LINES (debounced)", {
              nodeId: node.id,
              lineCount: updatedLines.length,
            });
          } else {
            // Single line - use simple content
            dispatch(EditorActions.updateContent(node.id, newContent));
            
            console.log("📝 CRUD Action: UPDATE_CONTENT (li single line)", {
              nodeId: node.id,
              newContent: newContent,
            });
          }
        } else if (!hasInlineChildren(node)) {
          // Simple content node - just update the text
          dispatch(EditorActions.updateContent(node.id, newContent));
          
          console.log("📝 CRUD Action: UPDATE_CONTENT (debounced)", {
            nodeId: node.id,
            newContent: newContent,
          });
        } else {
          // Node has inline children with formatting - parse DOM to preserve formatting
          const parsedChildren = parseDOMToInlineChildren(element);
          
          dispatch(
            EditorActions.updateNode(node.id, {
            children: parsedChildren,
            })
          );
          
          console.log(
            "📝 CRUD Action: UPDATE_NODE with parsed children (debounced)",
            {
            nodeId: node.id,
            parsedChildren,
            }
          );
        }
        
        // Clean up the timer reference
        contentUpdateTimers.current.delete(nodeId);
      }, 150);
      
      // Store the timer reference
      contentUpdateTimers.current.set(nodeId, timer);
    }
  };

  // Focus on current node when it changes
  useEffect(() => {
    if (!state.activeNodeId) return;

    const activeId = state.activeNodeId; // Capture in a const to satisfy TypeScript

    console.log("🎯 [Focus Effect] Attempting to focus node:", activeId);
    console.log(
      "🎯 [Focus Effect] Available refs:",
      Array.from(nodeRefs.current.keys())
    );

    // Retry logic to handle async rendering of nested blocks
    const attemptFocus = (retries = 0) => {
      const element = nodeRefs.current.get(activeId);
      console.log(
        `🎯 [Focus Attempt ${retries}] Element found:`,
        !!element,
        "for node:",
        activeId
      );

      if (element && document.activeElement !== element) {
        console.log("✅ [Focus Success] Focusing element:", activeId);
        element.focus();
        // Place cursor at the end of the element
        const range = document.createRange();
        const sel = window.getSelection();
        if (element.childNodes.length > 0) {
          const lastNode = element.childNodes[element.childNodes.length - 1];
          const offset = lastNode.textContent?.length || 0;
          range.setStart(lastNode, offset);
        } else {
          range.setStart(element, 0);
        }
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else if (!element && retries < 10) {
        // Element not ready yet, retry
        console.log(`⏳ [Focus Retry] Will retry (${retries + 1}/10) in 50ms`);
        setTimeout(() => attemptFocus(retries + 1), 50);
      } else if (!element) {
        console.error(
          "❌ [Focus Failed] Element not found after 10 retries:",
          activeId
        );
        console.log(
          "❌ [Focus Failed] Available refs:",
          Array.from(nodeRefs.current.keys())
        );
      }
    };

    attemptFocus();
  }, [state.activeNodeId]);

  // Restore focus when history changes (undo/redo)
  useEffect(() => {
    if (state.activeNodeId && !readOnly) {
      const element = nodeRefs.current.get(state.activeNodeId);
      if (element) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          element.focus();
          // Place cursor at the end
          const range = document.createRange();
          const sel = window.getSelection();
          if (element.childNodes.length > 0) {
            const lastNode = element.childNodes[element.childNodes.length - 1];
            const offset = lastNode.textContent?.length || 0;
            range.setStart(lastNode, offset);
          } else {
            range.setStart(element, 0);
          }
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
          console.log("🔄 [History] Restored focus after history change");
        }, 50);
      }
    }
  }, [state.historyIndex, readOnly]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clear all pending content update timers
      contentUpdateTimers.current.forEach((timer) => clearTimeout(timer));
      contentUpdateTimers.current.clear();
    };
  }, []);

  // Handle global keyboard shortcuts (Ctrl+A, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        
        // Check if we're focused inside the editor
        const activeElement = document.activeElement;
      const isInEditor = Array.from(nodeRefs.current.values()).some(
        (el) => el === activeElement || el.contains(activeElement)
      );
        
      // Ctrl+A / Cmd+A - Select all content
      if (isCtrlOrCmd && e.key === "a" && isInEditor) {
          e.preventDefault();

        // Select all content in the editor by creating a range across all blocks
        const selection = window.getSelection();
        if (!selection) return;

        const editorContent = document.querySelector("[data-editor-content]");
        if (editorContent) {
          const range = document.createRange();
          range.selectNodeContents(editorContent);
          selection.removeAllRanges();
          selection.addRange(range);

          console.log("✅ Selected all editor content");
        }
      }

      // Ctrl+Z / Cmd+Z - Undo
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey && isInEditor) {
        e.preventDefault();
        if (state.historyIndex > 0) {
          dispatch(EditorActions.undo());
       
          console.log("⏪ Undo:", state.historyIndex - 1);
        }
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z - Redo
      if (isInEditor && ((isCtrlOrCmd && e.key === "y") || (isCtrlOrCmd && e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        if (state.historyIndex < state.history.length - 1) {
          dispatch(EditorActions.redo());
        
          console.log("⏩ Redo:", state.historyIndex + 1);
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [state.historyIndex, state.history.length, dispatch, toast]);

  // Handle format button clicks - completely state-driven!
  const handleFormat = (format: "bold" | "italic" | "underline") => {
    console.group("🔘 [handleFormat] Button clicked");
    console.log("Format requested:", format);
    console.log("Current state.currentSelection:", state.currentSelection);
    console.log("Current node before toggle:", currentNode);
    
    if (!state.currentSelection) {
      console.warn("❌ No current selection, aborting");
      console.groupEnd();
      return;
    }
    
    // Save selection for restoration
    const { start, end, nodeId, formats } = state.currentSelection;
    
    console.log("Current format state:", formats);
    console.log(
      `Format "${format}" is currently:`,
      formats[format] ? "ACTIVE" : "INACTIVE"
    );
    
    // Dispatch toggle format action - reducer handles everything!
    console.log("🚀 Dispatching toggleFormat action");
    dispatch(EditorActions.toggleFormat(format));
    
    console.log("📝 CRUD Action: TOGGLE_FORMAT dispatched");
    
    // After state updates, check what happened
    setTimeout(() => {
      console.log("⏰ After state update");
      const updatedNode = container.children.find((n) => n.id === nodeId);
      console.log("Updated node after toggle:", updatedNode);
      console.log("Updated node attributes:", updatedNode?.attributes);
    }, 100);
    
    // Restore selection after formatting
    setTimeout(() => {
      console.log("⏰ Restoring selection after timeout");
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
        console.log("✅ Selection restored");
      } else {
        console.warn("❌ Element not found for selection restoration");
      }
      console.groupEnd();
    }, 0);
  };

  // Helper to restore selection after formatting
  const restoreSelection = (
    element: HTMLElement,
    start: number,
    end: number
  ) => {
    console.log("🔄 [restoreSelection] Starting", { start, end });
    const range = document.createRange();
    const sel = window.getSelection();
    
    let currentPos = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;
    let found = false;
    
    // Walk through all text nodes to find the start and end positions
    const walk = (node: Node) => {
      if (found) return;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        
        if (!startNode && currentPos + textLength >= start) {
          startNode = node;
          startOffset = start - currentPos;
        }
        
        if (currentPos + textLength >= end) {
          endNode = node;
          endOffset = end - currentPos;
          found = true;
          return;
        }
        
        currentPos += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
          if (found) return;
        }
      }
    };
    
    walk(element);
    
    console.log("Found nodes:", { startNode, startOffset, endNode, endOffset });
    
    if (startNode && endNode) {
      try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        sel?.removeAllRanges();
        sel?.addRange(range);
        console.log("✅ Selection range set successfully");
        
        // IMPORTANT: After restoring selection, we need to update the format detection
        // This will trigger selectionchange which will re-detect formats correctly
      } catch (e) {
        console.warn("Failed to restore selection:", e);
      }
    } else {
      console.warn(
        "❌ Could not find start/end nodes for selection restoration"
      );
    }
  };

  const handleTypeChange = (type: TextNode["type"]) => {
    if (!currentNode) return;

    // Check if there's a selection
    if (state.currentSelection) {
      // Save selection info before dispatch
      const { start, end, nodeId } = state.currentSelection;
      
      // Apply as inline element type to selected text only
      const elementType =
        type === "p"
          ? null
          : (type as
              | "h1"
              | "h2"
              | "h3"
              | "h4"
              | "h5"
              | "h6"
              | "code"
              | "blockquote");
      dispatch(EditorActions.applyInlineElementType(elementType));
      
      console.log("📝 CRUD Action: APPLY_INLINE_ELEMENT_TYPE", {
        elementType,
        selection: state.currentSelection,
      });
      
      // Restore selection after state update
      setTimeout(() => {
        const element = nodeRefs.current.get(nodeId);
        if (element) {
          restoreSelection(element, start, end);
        }
      }, 0);
    } else {
      // No selection - change entire block type (old behavior)
      dispatch(
        EditorActions.updateNode(currentNode.id, {
          type,
        })
      );

      console.log("📝 CRUD Action: UPDATE_NODE", {
        nodeId: currentNode.id,
        newType: type,
      });
    }
  };

  const handleNodeClick = (nodeId: string) => {
    dispatch(EditorActions.setActiveNode(nodeId));
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageDragStart = (nodeId: string) => {
    console.log("🎯 [SimpleEditor] Image drag started:", nodeId);
    setDraggingNodeId(nodeId);
  };

  const handleDragEnter = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🟡 [DragEnter]", { nodeId, draggingNodeId });
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Allow drop - this is required for drop to work
    e.dataTransfer.dropEffect = "copy";

    // Determine drop position based on mouse Y position relative to element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    const position = e.clientY < midPoint ? "before" : "after";

    console.log("🔵 [DragOver]", {
      nodeId,
      position,
      clientY: e.clientY,
      midPoint,
    });

    setDragOverNodeId(nodeId);
    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear if we're actually leaving the element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    if (!currentTarget.contains(relatedTarget)) {
      console.log("🔴 [DragLeave] Actually leaving");
      setDragOverNodeId(null);
      setDropPosition(null);
    } else {
      console.log("🔴 [DragLeave] Entering child, ignoring");
    }
  };

  const handleDrop = async (e: React.DragEvent, nodeId: string) => {
    console.log("🟢🟢🟢 [Drop] HANDLER CALLED!", { nodeId });
    e.preventDefault();
    e.stopPropagation();

    console.log("🟢 [Drop] Started", {
      nodeId,
      dropPosition,
      draggingNodeId,
      dataTransfer: e.dataTransfer,
      files: e.dataTransfer.files.length,
      items: e.dataTransfer.items?.length,
      types: e.dataTransfer.types,
    });

    // Check if we're moving an existing image block
    const draggedNodeId = e.dataTransfer.getData("text/plain");
    console.log("🟢 [Drop] Dragged node ID from dataTransfer:", draggedNodeId);

    if (draggedNodeId && draggingNodeId) {
      // Moving an existing image
      console.log(
        "🔄 [Drop] Moving existing image node:",
        draggingNodeId,
        "to",
        dropPosition,
        "of",
        nodeId
      );

      // Don't drop on itself
      if (draggingNodeId === nodeId) {
        console.log("⚠️ [Drop] Cannot drop on itself");
        setDragOverNodeId(null);
        setDropPosition(null);
        setDraggingNodeId(null);
        return;
      }

      // Delete from old position
      dispatch(EditorActions.deleteNode(draggingNodeId));

      // Insert at new position
      // We need to find the node by ID first
      const draggingNode = container.children.find(
        (n) => n.id === draggingNodeId
      );
      if (draggingNode) {
        dispatch(
          EditorActions.insertNode(
            draggingNode,
            nodeId,
            dropPosition || "after"
          )
        );
        dispatch(EditorActions.setActiveNode(draggingNodeId));

        toast({
          title: "Image moved!",
          description: `Image repositioned ${dropPosition} the block`,
        });

        console.log("✅ [Drop] Image moved successfully");
      }

      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
      return;
    }

    // Otherwise, handle file upload
    console.log("📁 [Drop] Handling file upload");

    // Try to get files from dataTransfer
    let files: File[] = [];

    if (e.dataTransfer.items) {
      console.log("🟢 [Drop] Using dataTransfer.items");
      // Use DataTransferItemList interface
      const items = Array.from(e.dataTransfer.items);
      files = items
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);
    } else {
      console.log("🟢 [Drop] Using dataTransfer.files");
      // Use DataTransferList interface
      files = Array.from(e.dataTransfer.files);
    }

    console.log(
      "🟢 [Drop] Files:",
      files.map((f) => ({ name: f.name, type: f.type, size: f.size }))
    );

    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (!imageFile) {
      console.log("❌ [Drop] No image file found. Files:", files);
      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
      return;
    }

    console.log("🟢 [Drop] Image file found:", imageFile.name, imageFile.type);
    setIsUploading(true);

    try {
      console.log("🟢 [Drop] Uploading image...");
      const result = await uploadImage(imageFile);
      console.log("🟢 [Drop] Upload result:", result);

      if (result.success && result.url) {
        const imageNode: TextNode = {
          id: "img-" + Date.now(),
          type: "img",
          content: "", // Optional caption
          attributes: {
            src: result.url,
            alt: imageFile.name,
          },
        };

        console.log("✅ [Drop] Creating image node:", imageNode);
        console.log(
          "✅ [Drop] Inserting at position:",
          dropPosition,
          "relative to node:",
          nodeId
        );

        // Insert at the determined position
        dispatch(
          EditorActions.insertNode(imageNode, nodeId, dropPosition || "after")
        );
        dispatch(EditorActions.setActiveNode(imageNode.id));

        console.log("✅ [Drop] Image inserted successfully");

        toast({
          title: "Image uploaded!",
          description: `Image placed ${dropPosition} the block`,
        });

        console.log("📝 CRUD Action: INSERT_NODE (image via drag-drop)", {
          nodeId: imageNode.id,
          url: result.url,
          position: dropPosition,
          targetNodeId: nodeId,
        });
      } else {
        console.log("❌ [Drop] Upload failed:", result.error);
      }
    } catch (error) {
      console.error("❌ [Drop] Error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      console.log("🏁 [Drop] Cleaning up");
      setIsUploading(false);
      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Upload the image
      const result = await uploadImage(file);

      if (result.success && result.url) {
        // Create new image node
        const imageNode: TextNode = {
          id: "img-" + Date.now(),
          type: "img",
          content: "", // Optional caption
          attributes: {
            src: result.url,
            alt: file.name,
          },
        };

        // Insert image after current node or at end
        const targetId =
          state.activeNodeId ||
          container.children[container.children.length - 1]?.id;
        if (targetId) {
          dispatch(EditorActions.insertNode(imageNode, targetId, "after"));
        } else {
          dispatch(
            EditorActions.insertNode(imageNode, container.id, "append")
          );
        }

        toast({
          title: "Image uploaded",
          description: "Your image has been added to the editor.",
        });

        console.log("📝 CRUD Action: INSERT_NODE (image)", {
          nodeId: imageNode.id,
          url: result.url,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.error || "Failed to upload image",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    dispatch(EditorActions.deleteNode(nodeId));
    console.log("📝 CRUD Action: DELETE_NODE (image)", { nodeId });
    
    toast({
      title: "Image removed",
      description: "The image has been deleted.",
    });
  };

  const handleAddBlock = (
    targetId: string,
    position: "before" | "after" = "after"
  ) => {
    // Create new paragraph node
    const newNode: TextNode = {
      id: "p-" + Date.now(),
      type: "p",
      content: "",
      attributes: {},
    };

    dispatch(EditorActions.insertNode(newNode, targetId, position));
    dispatch(EditorActions.setActiveNode(newNode.id));

    console.log("📝 CRUD Action: INSERT_NODE (new paragraph)", {
      nodeId: newNode.id,
      position,
      targetId,
    });

    // Focus the new node after a brief delay
    setTimeout(() => {
      const newElement = nodeRefs.current.get(newNode.id);
      if (newElement) {
        newElement.focus();
      }
    }, 50);
  };

  const handleCreateNested = (nodeId: string) => {
    const result = findNodeInTree(nodeId, container);
    if (!result) return;

    const { node, parentId } = result;

    // If the node is inside a nested container (not root), we need to handle it differently
    // We only allow 1 level of nesting, so if we're already nested, add to the parent container
    const isAlreadyNested = parentId !== container.id;

    if (isAlreadyNested) {
      // We're inside a nested container, so just add a new paragraph to the parent container
      const newParagraph: TextNode = {
        id: "p-" + Date.now(),
        type: "p",
        content: "",
        attributes: {},
      };

      // Insert after the current node within the parent container
      dispatch(EditorActions.insertNode(newParagraph, nodeId, "after"));
      dispatch(EditorActions.setActiveNode(newParagraph.id));

      console.log("📝 CRUD Action: ADD_TO_NESTED_CONTAINER", {
        currentNodeId: nodeId,
        newNodeId: newParagraph.id,
        parentContainerId: parentId,
      });

      // Focus is handled by the useEffect watching state.activeNodeId
      return;
    }

    // Node is at root level, create a nested container
    if (!isTextNode(node)) return;
    const textNode = node as TextNode;

    // Create the new paragraph that will be focused
    const newParagraphId = "p-" + Date.now();
    const newParagraph: TextNode = {
      id: newParagraphId,
      type: "p",
      content: "",
      attributes: {},
    };

    // Create a nested container with the current node inside it
    const nestedContainer: ContainerNode = {
      id: "container-" + Date.now(),
      type: "container",
      children: [
        // Copy the current node
        { ...textNode },
        // Add a new empty paragraph inside the nested container
        newParagraph,
      ],
      attributes: {},
    };

    // Delete the original node
    dispatch(EditorActions.deleteNode(nodeId));

    // Insert the nested container in its place
    // Since we deleted the node, we insert after the previous node or prepend to container
    const nodeIndex = container.children.findIndex(
      (n) => n.id === nodeId
    );
    if (nodeIndex > 0) {
      const previousNode = container.children[nodeIndex - 1];
      dispatch(
        EditorActions.insertNode(nestedContainer, previousNode.id, "after")
      );
    } else {
      dispatch(
        EditorActions.insertNode(nestedContainer, container.id, "prepend")
      );
    }

    // Set the new paragraph as active
    dispatch(EditorActions.setActiveNode(newParagraphId));

    console.log("📝 CRUD Action: CREATE_NESTED_CONTAINER", {
      originalNodeId: nodeId,
      nestedContainerId: nestedContainer.id,
      newParagraphId,
    });

    toast({
      title: "Nested block created",
      description:
        "Press Shift+Enter again to add more blocks in this container",
    });

    // Focus is handled by the useEffect watching state.activeNodeId
  };

  const handleCopyHtml = async () => {
    let html = serializeToHtml(container);

    // Wrap with spacing classes if enhance spaces is enabled
    if (enhanceSpaces) {
      html = `<div class="[&>*]:my-3 [&_*]:my-5">\n${html}\n</div>`;
    }

    try {
      await navigator.clipboard.writeText(html);
      setCopiedHtml(true);
      toast({
        title: "HTML copied!",
        description: "HTML code has been copied to clipboard.",
      });
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy HTML to clipboard.",
      });
    }
  };

  const handleCopyJson = async () => {
    const json = JSON.stringify(container.children, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopiedJson(true);
      toast({
        title: "JSON copied!",
        description: "JSON data has been copied to clipboard.",
      });
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy JSON to clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Editor with integrated toolbar */}
      <div className="mx-auto">
        <Card className="shadow-2xl pt-0 rounded-none border-2 gap-3 transition-all duration-300">
          {/* Toolbar inside card - hidden in readOnly mode */}
          {!readOnly && (
            <CardContent className="p-4 border-b max-w-4xl w-full mx-auto transition-all duration-300">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Type Selector */}
              <div className="flex items-center gap-2">
                <Type className="size-4 text-muted-foreground" />
                <Select
                  value={
                    state.currentSelection?.elementType !== undefined
                        ? state.currentSelection.elementType || "p"
                        : currentNode?.type || "p"
                    }
                    onValueChange={(value) =>
                      handleTypeChange(value as TextNode["type"])
                    }
                    disabled={
                      !currentNode ||
                      currentNode.type === "br" ||
                      currentNode.type === "img"
                    }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select type">
                      {(() => {
                          const type =
                            state.currentSelection?.elementType !== undefined
                              ? state.currentSelection.elementType ||
                                currentNode?.type ||
                                "p"
                              : currentNode?.type || "p";
                        
                        switch (type) {
                            case "h1":
                              return (
                                <span className="font-bold text-base">
                                  Heading 1
                                </span>
                              );
                            case "h2":
                              return (
                                <span className="font-bold text-sm">
                                  Heading 2
                                </span>
                              );
                            case "h3":
                              return (
                                <span className="font-semibold text-sm">
                                  Heading 3
                                </span>
                              );
                            case "h4":
                              return (
                                <span className="font-semibold text-xs">
                                  Heading 4
                                </span>
                              );
                            case "h5":
                              return (
                                <span className="font-semibold text-xs">
                                  Heading 5
                                </span>
                              );
                            case "h6":
                              return (
                                <span className="font-semibold text-xs">
                                  Heading 6
                                </span>
                              );
                            case "li":
                              return <span className="text-sm">List Item</span>;
                            case "blockquote":
                              return (
                                <span className="italic text-sm">Quote</span>
                              );
                            case "code":
                              return (
                                <span className="font-mono text-xs">Code</span>
                              );
                            default:
                              return <span className="text-sm">Paragraph</span>;
                        }
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p">
                      <span className="text-sm">Paragraph</span>
                    </SelectItem>
                    <SelectItem value="h1">
                      <span className="font-bold text-base">Heading 1</span>
                    </SelectItem>
                    <SelectItem value="h2">
                      <span className="font-bold text-sm">Heading 2</span>
                    </SelectItem>
                    <SelectItem value="h3">
                      <span className="font-semibold text-sm">Heading 3</span>
                    </SelectItem>
                    <SelectItem value="h4">
                      <span className="font-semibold text-xs">Heading 4</span>
                    </SelectItem>
                    <SelectItem value="h5">
                      <span className="font-semibold text-xs">Heading 5</span>
                    </SelectItem>
                    <SelectItem value="h6">
                      <span className="font-semibold text-xs">Heading 6</span>
                    </SelectItem>
                    <SelectItem value="li">
                      <span className="text-sm">List Item</span>
                    </SelectItem>
                    <SelectItem value="blockquote">
                      <span className="italic text-sm">Quote</span>
                    </SelectItem>
                    <SelectItem value="code">
                      <span className="font-mono text-xs">Code</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-8" />

              {/* Format Buttons - Now using ToggleGroup! */}
              <ToggleGroup
                type="multiple"
                variant="outline"
                disabled={!state.currentSelection}
                value={[
                    ...(state.currentSelection?.formats.bold ? ["bold"] : []),
                    ...(state.currentSelection?.formats.italic
                      ? ["italic"]
                      : []),
                    ...(state.currentSelection?.formats.underline
                      ? ["underline"]
                      : []),
                ]}
              >
                <ToggleGroupItem
                  value="bold"
                  aria-label="Toggle bold"
                    onClick={() => handleFormat("bold")}
                  disabled={!state.currentSelection}
                >
                  <Bold className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="italic"
                  aria-label="Toggle italic"
                    onClick={() => handleFormat("italic")}
                  disabled={!state.currentSelection}
                >
                  <Italic className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="underline"
                  aria-label="Toggle underline"
                    onClick={() => handleFormat("underline")}
                  disabled={!state.currentSelection}
                >
                  <Underline className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Separator orientation="vertical" className="h-8" />

              {/* Image Upload Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleImageUploadClick}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-4" />
                    Add Image
                  </>
                )}
              </Button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* View Code Button with Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                    <Code className="size-4" />
                    View Code
                  </Button>
                </DialogTrigger>
                  <DialogContent className="max-w-[90vw] min-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Export Code</DialogTitle>
                    <DialogDescription>
                      Copy the HTML or JSON output of your editor content
                    </DialogDescription>
                  </DialogHeader>
                  
                    <Tabs
                      defaultValue="preview"
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="html">HTML Output</TabsTrigger>
                      <TabsTrigger value="json">JSON Data</TabsTrigger>
                    </TabsList>
                    
                      {/* Enhance Spaces Toggle */}
                      <div className="flex items-center justify-between mt-4 px-1">
                        <p className="text-sm text-muted-foreground">
                          Preview Options
                        </p>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="enhance-spaces"
                            className="text-sm cursor-pointer"
                          >
                            Enhance Spaces
                          </Label>
                          <Switch
                            id="enhance-spaces"
                            checked={enhanceSpaces}
                            onCheckedChange={setEnhanceSpaces}
                          />
                        </div>
                      </div>

                      <TabsContent
                        value="preview"
                        className="flex-1 flex flex-col overflow-hidden mt-4"
                      >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          Live preview of rendered HTML
                        </p>
                      </div>
                      <div 
                        className="flex-1 bg-background p-6 rounded-lg overflow-auto border"
                          dangerouslySetInnerHTML={{
                            __html: enhanceSpaces
                              ? `<div class="[&>*]:my-3 [&_*]:my-5">${serializeToHtml(
                                  container
                                )}</div>`
                              : serializeToHtml(container),
                          }}
                      />
                    </TabsContent>
                    
                      <TabsContent
                        value="html"
                        className="flex-1 flex flex-col overflow-hidden mt-4"
                      >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          HTML with Tailwind CSS classes
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyHtml}
                          className="gap-2"
                        >
                          {copiedHtml ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy HTML
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="flex-1 text-xs bg-secondary text-secondary-foreground p-4 rounded-lg overflow-auto border">
                          {enhanceSpaces
                            ? `<div class="[&>*]:my-3 [&_*]:my-5">\n${serializeToHtml(
                                container
                              )}\n</div>`
                            : serializeToHtml(container)}
                      </pre>
                    </TabsContent>
                    
                      <TabsContent
                        value="json"
                        className="flex-1 flex flex-col overflow-hidden mt-4"
                      >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          Editor state as JSON
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyJson}
                          className="gap-2"
                        >
                          {copiedJson ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy JSON
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="flex-1 text-xs bg-secondary text-secondary-foreground p-4 rounded-lg overflow-auto border">
                        {JSON.stringify(container.children, null, 2)}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              {/* Selection indicator */}
              {state.hasSelection && (
                  <Badge
                    variant="secondary"
                    className="ml-auto transition-all duration-300"
                  >
                  <span>Text selected</span>
                </Badge>
              )}
            </div>
          </CardContent>
          )}

          {/* Editor Content */}
          <CardContent
            className={`p-6 min-h-screen transition-all duration-300 max-w-4xl mx-auto ${
              readOnly ? "py-14 md:py-20" : ""
            }`}
          >
            <div ref={animationParent} data-editor-content>
            {container.children.map((node, index) => {
                // Support both TextNode and ContainerNode
                const isText = isTextNode(node);
                const textNode = isText ? (node as TextNode) : null;
              
                const hasChildren =
                  textNode &&
                  Array.isArray(textNode.children) &&
                  textNode.children.length > 0;
              // Use a composite key that changes when structure changes
                const nodeKey = hasChildren
                  ? `${node.id}-children-${textNode?.children?.length}`
                  : `${node.id}-content`;
              
              const isFirstBlock = index === 0;
                const isLastBlock =
                  index === container.children.length - 1;
              
              return (
                <React.Fragment key={nodeKey}>
                  {/* Add block button before first block */}
                    {!readOnly && isFirstBlock && (
                    <AddBlockButton
                        onAdd={() => handleAddBlock(node.id, "before")}
                      position="before"
                    />
                  )}

                  <div
                      onDragEnter={(e) => handleDragEnter(e, node.id)}
                      onDragOver={(e) => handleDragOver(e, node.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, node.id)}
                    className={`
                        relative transition-all
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "before"
                            ? "before:absolute before:inset-x-0 before:-top-1 before:h-1 before:bg-primary/30 before:z-10 before:rounded-full"
                            : ""
                        }
                        ${
                          dragOverNodeId === node.id && dropPosition === "after"
                            ? "after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:bg-primary/30 after:z-10 after:rounded-full"
                            : ""
                        }
                    `}
                  >
                    <Block
                        node={node}
                        isActive={state.activeNodeId === node.id}
                    nodeRef={(el) => {
                      if (el) {
                            // Get the actual node ID from the element's data attribute
                            // This ensures nested blocks register with their own IDs
                            const elementNodeId =
                              el.getAttribute("data-node-id");
                            if (elementNodeId) {
                              nodeRefs.current.set(elementNodeId, el);
                              console.log(
                                "📝 [Ref Registration]",
                                elementNodeId,
                                "contentEditable:",
                                el.contentEditable
                              );
                            }
                        
                        // CRITICAL: Only update DOM if element is NOT focused AND there's no active text selection
                        // This prevents cursor jumping during typing and selection
                            // Only do this for TextNodes, not ContainerNodes
                            if (textNode && elementNodeId === node.id) {
                              const isCurrentlyFocused =
                                document.activeElement === el;
                        const selection = window.getSelection();
                        
                        // Check if there's ANY selection anywhere, not just non-collapsed
                              const hasActiveSelection =
                                selection &&
                                selection.rangeCount > 0 &&
                                !selection.isCollapsed;
                        
                        // Also check if this specific element contains the selection
                        let selectionInThisElement = false;
                              if (
                                hasActiveSelection &&
                                selection.rangeCount > 0
                              ) {
                          const range = selection.getRangeAt(0);
                                selectionInThisElement = el.contains(
                                  range.commonAncestorContainer
                                );
                        }
                        
                        // NEVER update DOM if:
                        // - Element is focused
                        // - Element has inline children (formatted content)
                        // - There's an active selection anywhere
                        // - This element contains the selection
                              if (
                                !isCurrentlyFocused &&
                                !hasChildren &&
                                !hasActiveSelection &&
                                !selectionInThisElement
                              ) {
                                const displayContent = textNode.content || "";
                                const currentContent = el.textContent || "";
                          
                          // Only update if content actually differs
                          if (currentContent !== displayContent) {
                            el.textContent = displayContent;
                                }
                          }
                        }
                      } else {
                            // When element is removed, delete its ref
                            nodeRefs.current.delete(node.id);
                          }
                        }}
                        onInput={(element) =>
                          handleContentChange(node.id, element)
                        }
                        onKeyDown={(e) => handleKeyDown(e, node.id)}
                        onClick={() => handleNodeClick(node.id)}
                        onDelete={
                          textNode && textNode.type === "img"
                            ? () => handleDeleteNode(node.id)
                            : undefined
                        }
                        onCreateNested={handleCreateNested}
                        readOnly={readOnly}
                        onImageDragStart={handleImageDragStart}
                  />
                </div>

                {/* Add block button after each block */}
                    {!readOnly && (
                <AddBlockButton
                        onAdd={() => handleAddBlock(node.id, "after")}
                  position="after"
                />
                    )}
              </React.Fragment>
              );
            })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

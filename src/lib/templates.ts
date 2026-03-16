/**
 * Mina Rich Editor - Document Templates
 *
 * @packageDocumentation
 */

import { EditorNode, TextNode } from "./types";
import { generateId } from "./utils/id-generator";

/**
 * Template metadata for organizing and displaying templates
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: "productivity" | "creative" | "business" | "personal";
  icon: string;
  thumbnail?: string;
}

/**
 * Complete template with metadata and content
 */
export interface Template {
  metadata: TemplateMetadata;
  content: EditorNode[];
  coverImage?: {
    url: string;
    alt: string;
    position: number;
  };
}

/**
 * Generate unique IDs for template nodes
 */
function id(templateId: string, suffix: string): string {
  return generateId(`${templateId}-${suffix}`);
}

// ========================================
// BLANK TEMPLATE
// ========================================

export function createBlankTemplate(): Template {
  const tid = "blank";
  return {
    metadata: {
      id: tid,
      name: "Blank Document",
      description: "Start with a clean slate",
      category: "productivity",
      icon: "📄",
    },
    content: [
      {
        id: id(tid, "1"),
        type: "p",
        content: "Start writing...",
        attributes: {},
      } as TextNode,
    ],
  };
}

// ========================================
// TEMPLATE REGISTRY
// ========================================

export const TEMPLATES: Record<string, () => Template> = {
  blank: createBlankTemplate,
};

/**
 * Get all template metadata for displaying in a template chooser
 */
export function getAllTemplateMetadata(): TemplateMetadata[] {
  return Object.values(TEMPLATES).map((createTemplate) => createTemplate().metadata);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): Template | null {
  const createTemplate = TEMPLATES[id];
  return createTemplate ? createTemplate() : null;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: TemplateMetadata["category"]
): TemplateMetadata[] {
  return getAllTemplateMetadata().filter((t) => t.category === category);
}

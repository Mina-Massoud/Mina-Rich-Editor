/**
 * Mina Rich Editor - Document Templates
 *
 * Pre-built templates showcasing various use cases:
 * - Meeting Notes Template
 * - Product Requirements Document (PRD)
 * - Photo Gallery Template
 * - Project Planning Template
 * - Financial Report Template
 * - Blog Post Template
 * - Resume/CV Template
 * - Recipe Template
 * - And more...
 *
 * Each template demonstrates different editor features including:
 * - Tables for structured data
 * - Lists for organization
 * - Image grids for galleries
 * - Custom styling with Tailwind classes
 * - Rich text formatting
 * - Nested containers
 *
 * @packageDocumentation
 */

import { EditorNode, TextNode, ContainerNode, StructuralNode } from "./types";

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
}

/**
 * Generate unique IDs for template nodes
 */
function id(templateId: string, suffix: string): string {
  return `${templateId}-${Date.now()}-${suffix}`;
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
// MEETING NOTES TEMPLATE
// ========================================

export function createMeetingNotesTemplate(): Template {
  const tid = "meeting-notes";
  return {
    metadata: {
      id: tid,
      name: "Meeting Notes",
      description: "Structured template for meeting documentation",
      category: "productivity",
      icon: "📝",
    },
    content: [
      {
        id: id(tid, "title"),
        type: "h1",
        content: "Meeting Notes - [Date]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "meta-section"),
        type: "blockquote",
        children: [
          { content: "📅 Date: ", bold: true },
          { content: "[Insert Date]", italic: true },
          { content: " | ", bold: false },
          { content: "⏰ Time: ", bold: true },
          { content: "[Insert Time]", italic: true },
          { content: " | ", bold: false },
          { content: "📍 Location: ", bold: true },
          { content: "[Insert Location]", italic: true },
        ],
        attributes: {
          className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
        },
      } as TextNode,

      {
        id: id(tid, "attendees-heading"),
        type: "h2",
        content: "👥 Attendees",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "attendees-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "attendee-1"),
            type: "li",
            content: "[Name 1] - [Role]",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "attendee-2"),
            type: "li",
            content: "[Name 2] - [Role]",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "attendee-3"),
            type: "li",
            content: "[Name 3] - [Role]",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "agenda-heading"),
        type: "h2",
        content: "📋 Agenda",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "agenda-list"),
        type: "container",
        attributes: { listType: "ol" },
        children: [
          {
            id: id(tid, "agenda-1"),
            type: "li",
            content: "Introduction and welcome",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "agenda-2"),
            type: "li",
            content: "Review previous action items",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "agenda-3"),
            type: "li",
            content: "Main discussion topics",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "agenda-4"),
            type: "li",
            content: "Action items and next steps",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "discussion-heading"),
        type: "h2",
        content: "💬 Discussion Points",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "discussion-1-title"),
        type: "h3",
        content: "Topic 1: [Title]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "discussion-1-content"),
        type: "p",
        content: "[Discussion notes and key points go here...]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "discussion-2-title"),
        type: "h3",
        content: "Topic 2: [Title]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "discussion-2-content"),
        type: "p",
        content: "[Discussion notes and key points go here...]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "decisions-heading"),
        type: "h2",
        content: "✅ Decisions Made",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "decisions-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "decision-1"),
            type: "li",
            content: "[Decision 1]",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "decision-2"),
            type: "li",
            content: "[Decision 2]",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "actions-heading"),
        type: "h2",
        content: "🎯 Action Items",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "actions-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "actions-table"),
            type: "table",
            children: [
              {
                id: id(tid, "actions-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "actions-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-action"),
                        type: "th",
                        content: "Action Item",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-owner"),
                        type: "th",
                        content: "Owner",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-deadline"),
                        type: "th",
                        content: "Deadline",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-status"),
                        type: "th",
                        content: "Status",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "actions-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "actions-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-action-1"),
                        type: "td",
                        content: "[Action description]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-owner-1"),
                        type: "td",
                        content: "[Person name]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-deadline-1"),
                        type: "td",
                        content: "[Date]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-status-1"),
                        type: "td",
                        content: "🔄 In Progress",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "actions-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-action-2"),
                        type: "td",
                        content: "[Action description]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-owner-2"),
                        type: "td",
                        content: "[Person name]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-deadline-2"),
                        type: "td",
                        content: "[Date]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-status-2"),
                        type: "td",
                        content: "⏳ Pending",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "next-meeting"),
        type: "h2",
        content: "📅 Next Meeting",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "next-meeting-info"),
        type: "blockquote",
        children: [
          { content: "📅 Date: ", bold: true },
          { content: "[Insert Date]", italic: true },
          { content: " | ", bold: false },
          { content: "⏰ Time: ", bold: true },
          { content: "[Insert Time]", italic: true },
          { content: " | ", bold: false },
          { content: "📍 Location: ", bold: true },
          { content: "[Insert Location]", italic: true },
        ],
        attributes: {
          className: "bg-green-50 dark:bg-green-900/20 border-green-500",
        },
      } as TextNode,
    ],
  };
}

// ========================================
// PRODUCT REQUIREMENTS DOCUMENT (PRD)
// ========================================

export function createPRDTemplate(): Template {
  const tid = "prd";
  return {
    metadata: {
      id: tid,
      name: "Product Requirements Document",
      description: "Professional PRD template for product development",
      category: "business",
      icon: "📊",
    },
    content: [
      {
        id: id(tid, "title"),
        type: "h1",
        content: "[Product Name] - Requirements Document",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "version-info"),
        type: "blockquote",
        children: [
          { content: "📄 Version: ", bold: true },
          { content: "1.0", italic: true },
          { content: " | ", bold: false },
          { content: "📅 Date: ", bold: true },
          { content: "[Current Date]", italic: true },
          { content: " | ", bold: false },
          { content: "✍️ Author: ", bold: true },
          { content: "[Your Name]", italic: true },
        ],
        attributes: {
          className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
        },
      } as TextNode,

      {
        id: id(tid, "overview-heading"),
        type: "h2",
        content: "🎯 Product Overview",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "overview-desc"),
        type: "p",
        content:
          "[Brief description of the product, its purpose, and the problem it solves. Include the vision and strategic goals.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "objectives-heading"),
        type: "h2",
        content: "🚀 Objectives & Success Metrics",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "objectives-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "objectives-table"),
            type: "table",
            children: [
              {
                id: id(tid, "objectives-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "objectives-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-objective"),
                        type: "th",
                        content: "Objective",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-metric"),
                        type: "th",
                        content: "Success Metric",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-target"),
                        type: "th",
                        content: "Target",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "objectives-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "objectives-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-objective-1"),
                        type: "td",
                        content: "Increase user engagement",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-metric-1"),
                        type: "td",
                        content: "Daily Active Users (DAU)",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-target-1"),
                        type: "td",
                        content: "+25%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "objectives-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-objective-2"),
                        type: "td",
                        content: "Improve conversion rate",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-metric-2"),
                        type: "td",
                        content: "Signup to paid conversion",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-target-2"),
                        type: "td",
                        content: "+15%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "user-stories-heading"),
        type: "h2",
        content: "👥 User Stories",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "user-story-1"),
        type: "blockquote",
        children: [
          { content: "As a ", italic: true },
          { content: "[user type]", bold: true, italic: true },
          { content: ", I want to ", italic: true },
          { content: "[action]", bold: true, italic: true },
          { content: " so that ", italic: true },
          { content: "[benefit]", bold: true, italic: true },
          { content: ".", italic: true },
        ],
        attributes: {
          className: "bg-purple-50 dark:bg-purple-900/20 border-purple-500",
        },
      } as TextNode,

      {
        id: id(tid, "features-heading"),
        type: "h2",
        content: "✨ Feature Requirements",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "feature-1-title"),
        type: "h3",
        content: "Feature 1: [Feature Name]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "feature-1-desc"),
        type: "p",
        content: "[Detailed description of the feature and its purpose]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "feature-1-requirements"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "feature-1-req-1"),
            type: "li",
            children: [
              { content: "Must have: ", bold: true },
              { content: "[Core requirement]", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "feature-1-req-2"),
            type: "li",
            children: [
              { content: "Should have: ", bold: true },
              { content: "[Important requirement]", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "feature-1-req-3"),
            type: "li",
            children: [
              { content: "Could have: ", bold: true },
              { content: "[Nice to have]", bold: false },
            ],
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "technical-heading"),
        type: "h2",
        content: "⚙️ Technical Requirements",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "technical-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "tech-1"),
            type: "li",
            children: [
              { content: "Performance: ", bold: true },
              { content: "Load time < 2 seconds", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "tech-2"),
            type: "li",
            children: [
              { content: "Scalability: ", bold: true },
              { content: "Support 100,000+ concurrent users", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "tech-3"),
            type: "li",
            children: [
              { content: "Security: ", bold: true },
              { content: "GDPR compliant, encrypted data at rest", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "tech-4"),
            type: "li",
            children: [
              { content: "Compatibility: ", bold: true },
              {
                content: "Support modern browsers (Chrome, Firefox, Safari, Edge)",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "timeline-heading"),
        type: "h2",
        content: "📅 Timeline & Milestones",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "timeline-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "timeline-table"),
            type: "table",
            children: [
              {
                id: id(tid, "timeline-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "timeline-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-milestone"),
                        type: "th",
                        content: "Milestone",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-deliverables"),
                        type: "th",
                        content: "Deliverables",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-date"),
                        type: "th",
                        content: "Target Date",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "timeline-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "timeline-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-milestone-1"),
                        type: "td",
                        content: "Design Phase",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-deliverables-1"),
                        type: "td",
                        content: "Wireframes, mockups, prototype",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-date-1"),
                        type: "td",
                        content: "Week 1-2",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "timeline-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-milestone-2"),
                        type: "td",
                        content: "Development Sprint 1",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-deliverables-2"),
                        type: "td",
                        content: "Core features implementation",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-date-2"),
                        type: "td",
                        content: "Week 3-6",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "timeline-tr-3"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-milestone-3"),
                        type: "td",
                        content: "Beta Release",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-deliverables-3"),
                        type: "td",
                        content: "Feature complete, testing",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-date-3"),
                        type: "td",
                        content: "Week 7-8",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "risks-heading"),
        type: "h2",
        content: "⚠️ Risks & Mitigation",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "risk-1"),
        type: "blockquote",
        children: [
          { content: "Risk: ", bold: true },
          { content: "[Potential risk description]", italic: true },
          { content: " | ", bold: false },
          { content: "Mitigation: ", bold: true },
          { content: "[How to address this risk]", italic: true },
        ],
        attributes: {
          className: "bg-red-50 dark:bg-red-900/20 border-red-500",
        },
      } as TextNode,
    ],
  };
}

// ========================================
// PHOTO GALLERY TEMPLATE
// ========================================

export function createGalleryTemplate(): Template {
  const tid = "gallery";
  return {
    metadata: {
      id: tid,
      name: "Photo Gallery",
      description: "Showcase images in beautiful gallery layouts",
      category: "creative",
      icon: "🖼️",
    },
    content: [
      {
        id: id(tid, "title"),
        type: "h1",
        content: "My Photo Gallery",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "intro"),
        type: "p",
        children: [
          { content: "Welcome to my ", bold: false },
          {
            content: "photo gallery",
            bold: true,
            className: "text-purple-600 dark:text-purple-400",
          },
          {
            content:
              "! This collection showcases various moments and memories. Click on any image to view it larger, or use Ctrl+Click to select multiple images.",
            bold: false,
          },
        ],
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "collection-1-title"),
        type: "h2",
        content: "🌅 Landscape Collection",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "collection-1-desc"),
        type: "p",
        content:
          "Beautiful landscapes captured during travels around the world.",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "tip-1"),
        type: "blockquote",
        children: [
          { content: "💡 Tip: ", bold: true },
          { content: "Hold ", italic: true },
          { content: "Ctrl", bold: true, italic: true, elementType: "code" },
          { content: " (", italic: true },
          { content: "⌘", bold: true, italic: true, elementType: "code" },
          {
            content:
              " on Mac) and click multiple images to select them, then group them or reverse their order!",
            italic: true,
          },
        ],
        attributes: {
          className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
        },
      } as TextNode,

      {
        id: id(tid, "placeholder-note"),
        type: "p",
        children: [
          {
            content: "📸 Click the ",
            bold: false,
          },
          {
            content: "Upload Image",
            bold: true,
            className: "text-blue-600 dark:text-blue-400",
          },
          {
            content:
              " button or drag images here to add your photos to the gallery.",
            bold: false,
          },
        ],
        attributes: {
          className:
            "border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900/30",
        },
      } as TextNode,

      {
        id: id(tid, "collection-2-title"),
        type: "h2",
        content: "🏙️ Urban Photography",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "collection-2-desc"),
        type: "p",
        content:
          "City streets, architecture, and urban life captured in stunning detail.",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "placeholder-note-2"),
        type: "p",
        children: [
          {
            content: "📸 Add your urban photography here",
            bold: true,
            className: "text-center block",
          },
        ],
        attributes: {
          className:
            "border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900/30",
        },
      } as TextNode,

      {
        id: id(tid, "collection-3-title"),
        type: "h2",
        content: "👨‍👩‍👧‍👦 Portrait Gallery",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "collection-3-desc"),
        type: "p",
        content: "Portraits capturing emotions, personalities, and moments.",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "placeholder-note-3"),
        type: "p",
        children: [
          {
            content: "📸 Upload portrait photos here",
            bold: true,
            className: "text-center block",
          },
        ],
        attributes: {
          className:
            "border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900/30",
        },
      } as TextNode,

      {
        id: id(tid, "features"),
        type: "h2",
        content: "✨ Gallery Features",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "features-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "feature-1"),
            type: "li",
            children: [
              { content: "📷 Multi-select images", bold: true },
              { content: " with Ctrl+Click to group or rearrange", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "feature-2"),
            type: "li",
            children: [
              { content: "🎨 Flexible layouts", bold: true },
              {
                content: " - single images or grid arrangements",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "feature-3"),
            type: "li",
            children: [
              { content: "🖱️ Drag & drop", bold: true },
              { content: " to reorder images within grids", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "feature-4"),
            type: "li",
            children: [
              { content: "📝 Add captions", bold: true },
              {
                content: " to describe each photo and provide context",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "footer"),
        type: "blockquote",
        children: [
          {
            content: "📸 ",
            bold: false,
          },
          {
            content: "Pro Tip: ",
            bold: true,
          },
          {
            content:
              "Upload multiple images at once, then select them with Ctrl+Click and use the ",
            italic: true,
          },
          {
            content: "Group Images",
            bold: true,
            italic: true,
          },
          {
            content: " button to create beautiful side-by-side layouts!",
            italic: true,
          },
        ],
        attributes: {
          className: "bg-purple-50 dark:bg-purple-900/20 border-purple-500",
        },
      } as TextNode,
    ],
  };
}

// ========================================
// PROJECT PLANNING TEMPLATE
// ========================================

export function createProjectPlanTemplate(): Template {
  const tid = "project-plan";
  return {
    metadata: {
      id: tid,
      name: "Project Plan",
      description: "Comprehensive project planning and tracking",
      category: "productivity",
      icon: "🗓️",
    },
    content: [
      {
        id: id(tid, "title"),
        type: "h1",
        content: "[Project Name] - Project Plan",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "summary"),
        type: "blockquote",
        children: [
          { content: "📋 Project ID: ", bold: true },
          { content: "[PRJ-001]", italic: true },
          { content: " | ", bold: false },
          { content: "📅 Start Date: ", bold: true },
          { content: "[Date]", italic: true },
          { content: " | ", bold: false },
          { content: "🎯 Target Date: ", bold: true },
          { content: "[Date]", italic: true },
          { content: " | ", bold: false },
          { content: "👤 PM: ", bold: true },
          { content: "[Name]", italic: true },
        ],
        attributes: {
          className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
        },
      } as TextNode,

      {
        id: id(tid, "executive-heading"),
        type: "h2",
        content: "📄 Executive Summary",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "executive-content"),
        type: "p",
        content:
          "[High-level overview of the project, its goals, and expected outcomes. Keep it concise - 2-3 sentences.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "team-heading"),
        type: "h2",
        content: "👥 Team Structure",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "team-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "team-table"),
            type: "table",
            children: [
              {
                id: id(tid, "team-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "team-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-name"),
                        type: "th",
                        content: "Name",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-role"),
                        type: "th",
                        content: "Role",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-responsibilities"),
                        type: "th",
                        content: "Key Responsibilities",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "team-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "team-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-name-1"),
                        type: "td",
                        content: "[Name]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-role-1"),
                        type: "td",
                        content: "Project Manager",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-resp-1"),
                        type: "td",
                        content: "Overall coordination, stakeholder communication",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "team-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-name-2"),
                        type: "td",
                        content: "[Name]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-role-2"),
                        type: "td",
                        content: "Lead Developer",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-resp-2"),
                        type: "td",
                        content: "Technical architecture, code review",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "team-tr-3"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-name-3"),
                        type: "td",
                        content: "[Name]",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-role-3"),
                        type: "td",
                        content: "UX Designer",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-resp-3"),
                        type: "td",
                        content: "User research, wireframes, prototypes",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "phases-heading"),
        type: "h2",
        content: "🔄 Project Phases",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "phase-1-title"),
        type: "h3",
        content: "Phase 1: Discovery & Planning",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "phase-1-duration"),
        type: "p",
        children: [
          { content: "⏱️ Duration: ", bold: true },
          { content: "2 weeks", bold: false },
          { content: " | ", bold: false },
          { content: "📅 Dates: ", bold: true },
          { content: "[Start] - [End]", bold: false },
        ],
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "phase-1-tasks"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "phase-1-task-1"),
            type: "li",
            content: "Stakeholder interviews and requirements gathering",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "phase-1-task-2"),
            type: "li",
            content: "Technical feasibility assessment",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "phase-1-task-3"),
            type: "li",
            content: "Create project charter and communication plan",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "phase-2-title"),
        type: "h3",
        content: "Phase 2: Design & Architecture",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "phase-2-duration"),
        type: "p",
        children: [
          { content: "⏱️ Duration: ", bold: true },
          { content: "3 weeks", bold: false },
          { content: " | ", bold: false },
          { content: "📅 Dates: ", bold: true },
          { content: "[Start] - [End]", bold: false },
        ],
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "phase-2-tasks"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "phase-2-task-1"),
            type: "li",
            content: "Create wireframes and mockups",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "phase-2-task-2"),
            type: "li",
            content: "Design system architecture",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "phase-2-task-3"),
            type: "li",
            content: "Set up development environment",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "phase-3-title"),
        type: "h3",
        content: "Phase 3: Development",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "phase-3-duration"),
        type: "p",
        children: [
          { content: "⏱️ Duration: ", bold: true },
          { content: "6 weeks", bold: false },
          { content: " | ", bold: false },
          { content: "📅 Dates: ", bold: true },
          { content: "[Start] - [End]", bold: false },
        ],
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "phase-3-tasks"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "phase-3-task-1"),
            type: "li",
            content: "Sprint 1: Core functionality",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "phase-3-task-2"),
            type: "li",
            content: "Sprint 2: User interface implementation",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "phase-3-task-3"),
            type: "li",
            content: "Sprint 3: Integration and testing",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "risks-heading"),
        type: "h2",
        content: "⚠️ Risk Management",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "risks-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "risks-table"),
            type: "table",
            children: [
              {
                id: id(tid, "risks-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "risks-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-risk"),
                        type: "th",
                        content: "Risk",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-impact"),
                        type: "th",
                        content: "Impact",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-probability"),
                        type: "th",
                        content: "Probability",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-mitigation"),
                        type: "th",
                        content: "Mitigation Strategy",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "risks-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "risks-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-risk-1"),
                        type: "td",
                        content: "Scope creep",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-impact-1"),
                        type: "td",
                        content: "High",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-prob-1"),
                        type: "td",
                        content: "Medium",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-mit-1"),
                        type: "td",
                        content: "Strict change control process",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "risks-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-risk-2"),
                        type: "td",
                        content: "Resource availability",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-impact-2"),
                        type: "td",
                        content: "High",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-prob-2"),
                        type: "td",
                        content: "Low",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-mit-2"),
                        type: "td",
                        content: "Cross-train team members",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "budget-heading"),
        type: "h2",
        content: "💰 Budget Overview",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "budget-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "budget-table"),
            type: "table",
            children: [
              {
                id: id(tid, "budget-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "budget-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-category"),
                        type: "th",
                        content: "Category",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-allocated"),
                        type: "th",
                        content: "Allocated",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-spent"),
                        type: "th",
                        content: "Spent",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-remaining"),
                        type: "th",
                        content: "Remaining",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "budget-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "budget-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-category-1"),
                        type: "td",
                        content: "Personnel",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-allocated-1"),
                        type: "td",
                        content: "$50,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-spent-1"),
                        type: "td",
                        content: "$12,500",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-remaining-1"),
                        type: "td",
                        content: "$37,500",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "budget-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-category-2"),
                        type: "td",
                        content: "Software/Tools",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-allocated-2"),
                        type: "td",
                        content: "$10,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-spent-2"),
                        type: "td",
                        content: "$5,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-remaining-2"),
                        type: "td",
                        content: "$5,000",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "budget-tr-3"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-category-3"),
                        type: "td",
                        content: "Infrastructure",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-allocated-3"),
                        type: "td",
                        content: "$15,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-spent-3"),
                        type: "td",
                        content: "$2,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-remaining-3"),
                        type: "td",
                        content: "$13,000",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,
    ],
  };
}

// ========================================
// FINANCIAL REPORT TEMPLATE
// ========================================

export function createFinancialReportTemplate(): Template {
  const tid = "financial";
  return {
    metadata: {
      id: tid,
      name: "Financial Report",
      description: "Professional financial reporting with tables",
      category: "business",
      icon: "💰",
    },
    content: [
      {
        id: id(tid, "title"),
        type: "h1",
        content: "Financial Report - Q4 2024",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "summary"),
        type: "blockquote",
        children: [
          { content: "📊 Reporting Period: ", bold: true },
          { content: "Q4 2024", italic: true },
          { content: " | ", bold: false },
          { content: "📅 Report Date: ", bold: true },
          { content: "[Current Date]", italic: true },
          { content: " | ", bold: false },
          { content: "✍️ Prepared by: ", bold: true },
          { content: "[Your Name]", italic: true },
        ],
        attributes: {
          className: "bg-green-50 dark:bg-green-900/20 border-green-500",
        },
      } as TextNode,

      {
        id: id(tid, "executive-heading"),
        type: "h2",
        content: "📈 Executive Summary",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "executive-content"),
        type: "p",
        content:
          "[Brief overview of financial performance, key highlights, and major trends for the period.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "revenue-heading"),
        type: "h2",
        content: "💵 Revenue Analysis",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "revenue-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "revenue-table"),
            type: "table",
            children: [
              {
                id: id(tid, "revenue-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "revenue-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-source"),
                        type: "th",
                        content: "Revenue Source",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-q3"),
                        type: "th",
                        content: "Q3 2024",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-q4"),
                        type: "th",
                        content: "Q4 2024",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-change"),
                        type: "th",
                        content: "Change %",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "revenue-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "revenue-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-source-1"),
                        type: "td",
                        content: "Product Sales",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-q3-1"),
                        type: "td",
                        content: "$125,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-q4-1"),
                        type: "td",
                        content: "$145,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-change-1"),
                        type: "td",
                        content: "+16%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "revenue-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-source-2"),
                        type: "td",
                        content: "Services",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-q3-2"),
                        type: "td",
                        content: "$75,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-q4-2"),
                        type: "td",
                        content: "$82,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-change-2"),
                        type: "td",
                        content: "+9.3%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "revenue-tr-3"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-source-3"),
                        type: "td",
                        content: "Subscriptions",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-q3-3"),
                        type: "td",
                        content: "$50,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-q4-3"),
                        type: "td",
                        content: "$65,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-change-3"),
                        type: "td",
                        content: "+30%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "revenue-tr-total"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-source-total"),
                        type: "td",
                        content: "Total Revenue",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                      {
                        id: id(tid, "td-q3-total"),
                        type: "td",
                        content: "$250,000",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                      {
                        id: id(tid, "td-q4-total"),
                        type: "td",
                        content: "$292,000",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                      {
                        id: id(tid, "td-change-total"),
                        type: "td",
                        content: "+16.8%",
                        attributes: { className: "font-bold text-green-600" },
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "expenses-heading"),
        type: "h2",
        content: "💸 Expense Breakdown",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "expenses-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "expenses-table"),
            type: "table",
            children: [
              {
                id: id(tid, "expenses-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "expenses-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-expense-category"),
                        type: "th",
                        content: "Category",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-amount"),
                        type: "th",
                        content: "Amount",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-percentage"),
                        type: "th",
                        content: "% of Total",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "expenses-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "expenses-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-exp-cat-1"),
                        type: "td",
                        content: "Salaries & Wages",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-1"),
                        type: "td",
                        content: "$120,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-percentage-1"),
                        type: "td",
                        content: "60%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "expenses-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-exp-cat-2"),
                        type: "td",
                        content: "Marketing",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-2"),
                        type: "td",
                        content: "$30,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-percentage-2"),
                        type: "td",
                        content: "15%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "expenses-tr-3"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-exp-cat-3"),
                        type: "td",
                        content: "Operations",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-3"),
                        type: "td",
                        content: "$25,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-percentage-3"),
                        type: "td",
                        content: "12.5%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "expenses-tr-4"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-exp-cat-4"),
                        type: "td",
                        content: "Technology & Tools",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-4"),
                        type: "td",
                        content: "$15,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-percentage-4"),
                        type: "td",
                        content: "7.5%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "expenses-tr-5"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-exp-cat-5"),
                        type: "td",
                        content: "Other",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-5"),
                        type: "td",
                        content: "$10,000",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-percentage-5"),
                        type: "td",
                        content: "5%",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "expenses-tr-total"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-exp-cat-total"),
                        type: "td",
                        content: "Total Expenses",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-total"),
                        type: "td",
                        content: "$200,000",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                      {
                        id: id(tid, "td-percentage-total"),
                        type: "td",
                        content: "100%",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "profit-heading"),
        type: "h2",
        content: "📊 Profit & Loss Summary",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "profit-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "profit-table"),
            type: "table",
            children: [
              {
                id: id(tid, "profit-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "profit-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-metric"),
                        type: "th",
                        content: "Metric",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-value"),
                        type: "th",
                        content: "Value",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "profit-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "profit-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-metric-1"),
                        type: "td",
                        content: "Total Revenue",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-value-1"),
                        type: "td",
                        content: "$292,000",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "profit-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-metric-2"),
                        type: "td",
                        content: "Total Expenses",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-value-2"),
                        type: "td",
                        content: "$200,000",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "profit-tr-3"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-metric-3"),
                        type: "td",
                        content: "Net Profit",
                        attributes: {
                          className:
                            "font-bold text-green-600 dark:text-green-400",
                        },
                      } as TextNode,
                      {
                        id: id(tid, "td-value-3"),
                        type: "td",
                        content: "$92,000",
                        attributes: {
                          className:
                            "font-bold text-green-600 dark:text-green-400",
                        },
                      } as TextNode,
                    ],
                    attributes: {
                      className: "bg-green-50 dark:bg-green-900/20",
                    },
                  },
                  {
                    id: id(tid, "profit-tr-4"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-metric-4"),
                        type: "td",
                        content: "Profit Margin",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                      {
                        id: id(tid, "td-value-4"),
                        type: "td",
                        content: "31.5%",
                        attributes: { className: "font-bold" },
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,

      {
        id: id(tid, "insights-heading"),
        type: "h2",
        content: "💡 Key Insights",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "insights-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "insight-1"),
            type: "li",
            children: [
              { content: "Strong Revenue Growth: ", bold: true },
              {
                content:
                  "16.8% increase quarter-over-quarter driven by subscription model",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "insight-2"),
            type: "li",
            children: [
              { content: "Healthy Profit Margin: ", bold: true },
              {
                content: "31.5% profit margin indicates sustainable business model",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "insight-3"),
            type: "li",
            children: [
              { content: "Subscription Success: ", bold: true },
              {
                content:
                  "30% growth in subscription revenue - highest performing segment",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "recommendations-heading"),
        type: "h2",
        content: "🎯 Recommendations",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "recommendations-list"),
        type: "container",
        attributes: { listType: "ol" },
        children: [
          {
            id: id(tid, "rec-1"),
            type: "li",
            content:
              "Continue investing in subscription model - highest growth potential",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "rec-2"),
            type: "li",
            content:
              "Optimize marketing spend - track ROI more closely for better efficiency",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "rec-3"),
            type: "li",
            content:
              "Explore cost reduction in operations while maintaining quality",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,
    ],
  };
}

// ========================================
// BLOG POST TEMPLATE
// ========================================

export function createBlogPostTemplate(): Template {
  const tid = "blog";
  return {
    metadata: {
      id: tid,
      name: "Blog Post",
      description: "Professional blog post with rich formatting",
      category: "creative",
      icon: "✍️",
    },
    content: [
      {
        id: id(tid, "title"),
        type: "h1",
        content: "[Your Blog Post Title Goes Here]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "meta"),
        type: "blockquote",
        children: [
          { content: "✍️ By: ", bold: true },
          { content: "[Your Name]", italic: true },
          { content: " | ", bold: false },
          { content: "📅 Published: ", bold: true },
          { content: "[Date]", italic: true },
          { content: " | ", bold: false },
          { content: "⏱️ ", bold: true },
          { content: "[5 min read]", italic: true },
        ],
        attributes: {
          className: "bg-purple-50 dark:bg-purple-900/20 border-purple-500",
        },
      } as TextNode,

      {
        id: id(tid, "intro-heading"),
        type: "h2",
        content: "Introduction",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "intro-content"),
        type: "p",
        content:
          "[Start with a hook! Grab your reader's attention with an interesting question, statistic, or story. The introduction should clearly state what the blog post is about and why readers should care.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "main-heading"),
        type: "h2",
        content: "[Main Topic 1]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "main-content-1"),
        type: "p",
        content:
          "[Develop your first main point. Use clear, concise language and support your arguments with evidence, examples, or data.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "quote"),
        type: "blockquote",
        children: [
          { content: '"', bold: false },
          {
            content:
              "Add a relevant quote here to emphasize your point and add credibility to your argument.",
            italic: true,
          },
          { content: '"', bold: false },
        ],
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "section-2-heading"),
        type: "h2",
        content: "[Main Topic 2]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "section-2-content"),
        type: "p",
        content:
          "[Develop your second main point. Use examples, case studies, or personal anecdotes to make your content more engaging and relatable.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "subsection-1-heading"),
        type: "h3",
        content: "[Subsection: Specific Detail]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "subsection-1-content"),
        type: "p",
        content:
          "[Dive deeper into a specific aspect. Break down complex ideas into digestible parts.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "tips-heading"),
        type: "h2",
        content: "Key Takeaways",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "tips-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "tip-1"),
            type: "li",
            children: [
              { content: "💡 ", bold: false },
              { content: "Takeaway #1: ", bold: true },
              { content: "[Brief description]", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "tip-2"),
            type: "li",
            children: [
              { content: "💡 ", bold: false },
              { content: "Takeaway #2: ", bold: true },
              { content: "[Brief description]", bold: false },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "tip-3"),
            type: "li",
            children: [
              { content: "💡 ", bold: false },
              { content: "Takeaway #3: ", bold: true },
              { content: "[Brief description]", bold: false },
            ],
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "code-example-heading"),
        type: "h2",
        content: "Code Example (if applicable)",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "code-example"),
        type: "code",
        content: `// Example code snippet
function example() {
  console.log("Add relevant code examples to technical posts");
  return true;
}`,
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "conclusion-heading"),
        type: "h2",
        content: "Conclusion",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "conclusion-content"),
        type: "p",
        content:
          "[Wrap up your main points and restate the key message. End with a call-to-action or thought-provoking question to encourage reader engagement.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "cta"),
        type: "blockquote",
        children: [
          {
            content: "💬 What are your thoughts on this topic? ",
            bold: true,
          },
          {
            content: "Share your experiences in the comments below!",
            italic: true,
          },
        ],
        attributes: {
          className: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
        },
      } as TextNode,
    ],
  };
}

// ========================================
// RECIPE TEMPLATE
// ========================================

export function createRecipeTemplate(): Template {
  const tid = "recipe";
  return {
    metadata: {
      id: tid,
      name: "Recipe",
      description: "Beautiful recipe layout for cooking and baking",
      category: "personal",
      icon: "🍳",
    },
    content: [
      {
        id: id(tid, "title"),
        type: "h1",
        content: "[Recipe Name]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "meta"),
        type: "blockquote",
        children: [
          { content: "⏱️ Prep: ", bold: true },
          { content: "15 mins", italic: true },
          { content: " | ", bold: false },
          { content: "🔥 Cook: ", bold: true },
          { content: "30 mins", italic: true },
          { content: " | ", bold: false },
          { content: "🍽️ Serves: ", bold: true },
          { content: "4 people", italic: true },
          { content: " | ", bold: false },
          { content: "😋 Difficulty: ", bold: true },
          { content: "Easy", italic: true },
        ],
        attributes: {
          className: "bg-orange-50 dark:bg-orange-900/20 border-orange-500",
        },
      } as TextNode,

      {
        id: id(tid, "description-heading"),
        type: "h2",
        content: "📖 Description",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "description"),
        type: "p",
        content:
          "[Brief description of the dish - what it is, why it's special, and any interesting background or serving suggestions.]",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "ingredients-heading"),
        type: "h2",
        content: "🛒 Ingredients",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "ingredients-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "ingredient-1"),
            type: "li",
            content: "2 cups all-purpose flour",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "ingredient-2"),
            type: "li",
            content: "1 cup sugar",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "ingredient-3"),
            type: "li",
            content: "1/2 cup butter (softened)",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "ingredient-4"),
            type: "li",
            content: "3 eggs",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "ingredient-5"),
            type: "li",
            content: "1 tsp vanilla extract",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "ingredient-6"),
            type: "li",
            content: "1 tsp baking powder",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "ingredient-7"),
            type: "li",
            content: "1/2 tsp salt",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "instructions-heading"),
        type: "h2",
        content: "👨‍🍳 Instructions",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "instructions-list"),
        type: "container",
        attributes: { listType: "ol" },
        children: [
          {
            id: id(tid, "step-1"),
            type: "li",
            children: [
              { content: "Preheat & Prepare: ", bold: true },
              {
                content:
                  "Preheat your oven to 350°F (175°C). Grease and flour a 9-inch baking pan.",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "step-2"),
            type: "li",
            children: [
              { content: "Mix Dry Ingredients: ", bold: true },
              {
                content:
                  "In a large bowl, whisk together flour, baking powder, and salt. Set aside.",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "step-3"),
            type: "li",
            children: [
              { content: "Cream Butter & Sugar: ", bold: true },
              {
                content:
                  "In another bowl, beat butter and sugar until light and fluffy (about 3-4 minutes).",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "step-4"),
            type: "li",
            children: [
              { content: "Add Eggs: ", bold: true },
              {
                content:
                  "Beat in eggs one at a time, then stir in vanilla extract.",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "step-5"),
            type: "li",
            children: [
              { content: "Combine: ", bold: true },
              {
                content:
                  "Gradually mix in the dry ingredients until just combined. Do not overmix.",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "step-6"),
            type: "li",
            children: [
              { content: "Bake: ", bold: true },
              {
                content:
                  "Pour batter into prepared pan and bake for 25-30 minutes, or until a toothpick inserted comes out clean.",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "step-7"),
            type: "li",
            children: [
              { content: "Cool & Serve: ", bold: true },
              {
                content:
                  "Let cool in pan for 10 minutes, then transfer to a wire rack to cool completely.",
                bold: false,
              },
            ],
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "tips-heading"),
        type: "h2",
        content: "💡 Chef's Tips",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "tips-list"),
        type: "container",
        attributes: { listType: "ul" },
        children: [
          {
            id: id(tid, "tip-1"),
            type: "li",
            content:
              "For best results, make sure all ingredients are at room temperature",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "tip-2"),
            type: "li",
            content:
              "Don't overmix the batter - this keeps the texture light and tender",
            attributes: {},
          } as TextNode,
          {
            id: id(tid, "tip-3"),
            type: "li",
            content:
              "Store leftovers in an airtight container at room temperature for up to 3 days",
            attributes: {},
          } as TextNode,
        ],
      } as ContainerNode,

      {
        id: id(tid, "nutrition-heading"),
        type: "h2",
        content: "📊 Nutrition Information (per serving)",
        attributes: {},
      } as TextNode,

      {
        id: id(tid, "nutrition-table-wrapper"),
        type: "container",
        children: [
          {
            id: id(tid, "nutrition-table"),
            type: "table",
            children: [
              {
                id: id(tid, "nutrition-thead"),
                type: "thead",
                children: [
                  {
                    id: id(tid, "nutrition-tr-header"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "th-nutrient"),
                        type: "th",
                        content: "Nutrient",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "th-amount"),
                        type: "th",
                        content: "Amount",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
              {
                id: id(tid, "nutrition-tbody"),
                type: "tbody",
                children: [
                  {
                    id: id(tid, "nutrition-tr-1"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-nutrient-1"),
                        type: "td",
                        content: "Calories",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-1"),
                        type: "td",
                        content: "250 kcal",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "nutrition-tr-2"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-nutrient-2"),
                        type: "td",
                        content: "Protein",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-2"),
                        type: "td",
                        content: "4g",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "nutrition-tr-3"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-nutrient-3"),
                        type: "td",
                        content: "Carbohydrates",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-3"),
                        type: "td",
                        content: "35g",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                  {
                    id: id(tid, "nutrition-tr-4"),
                    type: "tr",
                    children: [
                      {
                        id: id(tid, "td-nutrient-4"),
                        type: "td",
                        content: "Fat",
                        attributes: {},
                      } as TextNode,
                      {
                        id: id(tid, "td-amount-4"),
                        type: "td",
                        content: "12g",
                        attributes: {},
                      } as TextNode,
                    ],
                    attributes: {},
                  },
                ],
                attributes: {},
              },
            ],
            attributes: {},
          },
        ],
        attributes: {},
      } as ContainerNode,
    ],
  };
}

// ========================================
// TEMPLATE REGISTRY
// ========================================

/**
 * All available templates
 */
export const TEMPLATES: Record<string, () => Template> = {
  blank: createBlankTemplate,
  "meeting-notes": createMeetingNotesTemplate,
  prd: createPRDTemplate,
  gallery: createGalleryTemplate,
  "project-plan": createProjectPlanTemplate,
  financial: createFinancialReportTemplate,
  blog: createBlogPostTemplate,
  recipe: createRecipeTemplate,
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


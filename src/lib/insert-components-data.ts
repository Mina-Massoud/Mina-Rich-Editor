/**
 * Insert Components Data
 * 
 * Definitions for insertable components/use cases in the editor
 */

export interface InsertComponent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "media" | "layout" | "interactive" | "decoration";
  action: "free-image" | "video" | "table" | "custom";
}

export const INSERT_COMPONENTS: InsertComponent[] = [
  {
    id: "free-image",
    name: "Free Movement Image",
    description: "Add an image that can be positioned anywhere and resized freely",
    icon: "",
    category: "media",
    action: "free-image",
  },
  // Future components can be added here:
  // {
  //   id: "sticky-note",
  //   name: "Sticky Note",
  //   description: "Add a movable sticky note for annotations",
  //   icon: "📝",
  //   category: "decoration",
  //   action: "custom",
  // },
  // {
  //   id: "floating-text",
  //   name: "Floating Text Box",
  //   description: "Add a text box that can be positioned freely",
  //   icon: "💬",
  //   category: "layout",
  //   action: "custom",
  // },
];

export function getInsertComponentById(id: string): InsertComponent | undefined {
  return INSERT_COMPONENTS.find((component) => component.id === id);
}

export function getInsertComponentsByCategory(category: InsertComponent["category"]): InsertComponent[] {
  return INSERT_COMPONENTS.filter((component) => component.category === category);
}


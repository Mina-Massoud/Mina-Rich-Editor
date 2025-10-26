/**
 * ElementSelector Component
 *
 * A reusable dropdown selector for changing text block types (p, h1, h2, h3, etc.)
 * Can be used in toolbars, floating menus, and other UI elements
 */

"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ELEMENT_OPTIONS, type ElementType, type ElementOption } from "@/lib/elements";

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  Type: <Type className="h-4 w-4" />,
  Heading1: <Heading1 className="h-4 w-4" />,
  Heading2: <Heading2 className="h-4 w-4" />,
  Heading3: <Heading3 className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Quote: <Quote className="h-4 w-4" />,
  List: <List className="h-4 w-4" />,
  ListOrdered: <ListOrdered className="h-4 w-4" />,
};

// Helper to get icon with custom size
const getIcon = (iconName?: string, iconSize?: string) => {
  if (!iconName) return null;
  const IconComponent = iconMap[iconName];
  if (!IconComponent) return null;
  
  // Clone the icon with custom size if provided
  if (iconSize && React.isValidElement(IconComponent)) {
    return React.cloneElement(IconComponent, { className: iconSize } as any);
  }
  return IconComponent;
};

interface ElementSelectorProps {
  value: ElementType | null;
  onValueChange: (value: ElementType) => void;
  elements?: ElementOption[];
  variant?: "default" | "compact" | "icon-only";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showDescription?: boolean;
  showIcon?: boolean;
}

export function ElementSelector({
  value,
  onValueChange,
  elements = ELEMENT_OPTIONS,
  variant = "default",
  placeholder = "Select element",
  className,
  disabled = false,
  showDescription = true,
  showIcon = true,
}: ElementSelectorProps) {
  // Get the current element option
  const currentElement = elements.find((el) => el.value === value) || elements[0];

  // Variant-specific styling
  const triggerClassName = cn(
    "transition-colors",
    variant === "compact" &&
      "h-8 min-w-[90px] border-0 bg-transparent hover:bg-accent/50 focus:ring-0 text-xs rounded-md px-2 gap-1.5",
    variant === "icon-only" &&
      "h-9 w-9 border-0 bg-transparent hover:bg-accent/50 focus:ring-0 p-0",
    variant === "default" && "min-w-[140px]",
    className
  );

  return (
    <Select
      value={value || "p"}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue>
          {variant === "icon-only" ? (
            <div className="flex items-center justify-center">
              {getIcon(currentElement.icon, currentElement.iconSize)}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {showIcon && getIcon(currentElement.icon, currentElement.iconSize)}
              <span
                className={cn(
                  "font-normal",
                  variant === "compact" ? "text-xs" : "text-sm"
                )}
              >
                {currentElement.label}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {elements.map((element) => (
          <SelectItem
            key={element.value}
            value={element.value}
            className={cn(
              "cursor-pointer",
              showDescription && "py-2"
            )}
          >
            <div className="flex items-start gap-2 w-full">
              {showIcon && (
                <div className="mt-0.5 text-muted-foreground">
                  {getIcon(element.icon, element.iconSize)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{element.label}</span>
                  {element.shortcut && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {element.shortcut}
                    </span>
                  )}
                </div>
                {showDescription && element.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {element.description}
                  </p>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Re-export for convenience
export { ELEMENT_OPTIONS };
export type { ElementType, ElementOption };


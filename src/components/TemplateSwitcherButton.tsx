"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "@/lib/utils";
import {
  FileText,
  Sparkles,
  BookOpen,
  Briefcase,
  User,
  Zap,
} from "lucide-react";
import { getAllTemplateMetadata, getTemplateById, type TemplateMetadata } from "../lib/templates";
import type { EditorState } from "../lib/types";

interface TemplateSwitcherButtonProps {
  onTemplateChange: (state: EditorState) => void;
}

// Category icons
const categoryIcons: Record<TemplateMetadata["category"], React.ComponentType<{ className?: string }>> = {
  productivity: Zap,
  creative: Sparkles,
  business: Briefcase,
  personal: User,
};

// Category colors (solid colors for cleaner look)
const categoryColors: Record<TemplateMetadata["category"], string> = {
  productivity: "bg-blue-500 hover:bg-blue-600",
  creative: "bg-purple-500 hover:bg-purple-600",
  business: "bg-green-500 hover:bg-green-600",
  personal: "bg-orange-500 hover:bg-orange-600",
};

export function TemplateSwitcherButton({
  onTemplateChange,
}: TemplateSwitcherButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateMetadata["category"] | "all">("all");

  const allTemplates = getAllTemplateMetadata();
  
  const filteredTemplates = selectedCategory === "all" 
    ? allTemplates 
    : allTemplates.filter(t => t.category === selectedCategory);

  const categories: Array<{ value: "all" | TemplateMetadata["category"]; label: string }> = [
    { value: "all", label: "All Templates" },
    { value: "productivity", label: "Productivity" },
    { value: "creative", label: "Creative" },
    { value: "business", label: "Business" },
    { value: "personal", label: "Personal" },
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) return;

    // Create new state with template content
    const newState: EditorState = {
      version: "1.0.0",
      history: [
        {
          id: "root",
          type: "container",
          children: template.content,
          attributes: {},
        },
      ],
      historyIndex: 0,
      activeNodeId: null,
      hasSelection: false,
      selectionKey: 0,
      currentSelection: null,
      selectedBlocks: new Set(),
      coverImage: null,
    };

    onTemplateChange(newState);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
            "bg-primary hover:bg-primary/90",
            "hover:shadow-xl hover:scale-105",
            "group"
          )}
          size="icon"
          title="Switch Template"
        >
          <FileText className={cn(
            "h-5 w-5 transition-transform duration-200",
            isHovered && "scale-110"
          )} />
        </Button>
      </div>

      {/* Template Selector Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Choose a Template
            </DialogTitle>
            <DialogDescription>
              Select a template to get started quickly with pre-built layouts and content
            </DialogDescription>
          </DialogHeader>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            {categories.map((category) => {
              const Icon = category.value === "all" ? BookOpen : categoryIcons[category.value as TemplateMetadata["category"]];
              const isActive = selectedCategory === category.value;
              
              return (
                <Button
                  key={category.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </Button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {filteredTemplates.map((template) => {
                const CategoryIcon = categoryIcons[template.category];
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      "group relative p-5 rounded-lg border border-border",
                      "hover:border-primary/50 hover:shadow-md hover:bg-accent/50",
                      "transition-all duration-200",
                      "text-left"
                    )}
                  >
                    {/* Category badge */}
                    <div className="absolute top-3 right-3">
                      <div className="p-1.5 rounded-md bg-muted">
                        <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="text-4xl mb-3">
                      {template.icon}
                    </div>

                    {/* Template Info */}
                    <h3 className="font-semibold text-base mb-1.5 pr-10 group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-3 opacity-50" />
                <p>No templates found in this category</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


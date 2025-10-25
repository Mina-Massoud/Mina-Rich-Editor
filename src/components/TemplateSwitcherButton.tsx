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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
  currentState: EditorState;
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
  currentState,
}: TemplateSwitcherButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateMetadata["category"] | "all">("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

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

  // Check if there's existing content
  const hasExistingContent = () => {
    const container = currentState.history[currentState.historyIndex];
    if (!container || !container.children || container.children.length === 0) {
      return false;
    }
    
    // Check if there's any non-empty content
    return container.children.some((child) => {
      if ('content' in child && child.content && child.content.trim() !== '') {
        return true;
      }
      if ('children' in child && child.children && child.children.length > 0) {
        return true;
      }
      return false;
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    // Check if there's existing content
    if (hasExistingContent()) {
      setPendingTemplateId(templateId);
      setShowConfirmDialog(true);
      return;
    }

    // No existing content, proceed directly
    applyTemplate(templateId);
  };

  const applyTemplate = (templateId: string) => {
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
      coverImage: template.coverImage || null,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    onTemplateChange(newState);
    setIsOpen(false);
    setShowConfirmDialog(false);
    setPendingTemplateId(null);
  };

  const handleConfirmReplace = () => {
    if (pendingTemplateId) {
      applyTemplate(pendingTemplateId);
    }
  };

  const handleCancelReplace = () => {
    setShowConfirmDialog(false);
    setPendingTemplateId(null);
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
        <DialogContent className="max-w-6xl min-w-fit max-h-[85vh] overflow-hidden flex flex-col backdrop-blur-xl bg-background/95 border-border/50 shadow-2xl">
          <DialogHeader className="space-y-3 pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              Choose a Template
            </DialogTitle>
            <DialogDescription className="text-base">
              Select a template to get started quickly with pre-built layouts and content
            </DialogDescription>
          </DialogHeader>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 pb-6 border-b border-border/50">
            {categories.map((category) => {
              const Icon = category.value === "all" ? BookOpen : categoryIcons[category.value as TemplateMetadata["category"]];
              const isActive = selectedCategory === category.value;
              
              return (
                <Button
                  key={category.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "gap-2 transition-all duration-200",
                    isActive && "shadow-md scale-105"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </Button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 px-1 pb-2">
              {filteredTemplates.map((template) => {
                const CategoryIcon = categoryIcons[template.category];
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={cn(
                      "group relative p-6 rounded-xl border border-border/60",
                      "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10",
                      "hover:bg-accent/30 hover:scale-[1.02]",
                      "transition-all duration-300 ease-out",
                      "backdrop-blur-sm bg-background/50",
                      "text-left"
                    )}
                  >
                    {/* Category badge */}
                    <div className="absolute top-4 right-4">
                      <div className="p-2 rounded-lg bg-muted/80 backdrop-blur-sm border border-border/40">
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="text-5xl mb-4 transition-transform duration-200 group-hover:scale-110">
                      {template.icon}
                    </div>

                    {/* Template Info */}
                    <h3 className="font-semibold text-base mb-2 pr-10 group-hover:text-primary transition-colors duration-200">
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
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <BookOpen className="h-12 w-12 opacity-50" />
                </div>
                <p className="text-base">No templates found in this category</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="backdrop-blur-xl bg-background/95 border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              Replace Existing Content?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              You have existing content in the editor. Applying this template will replace all current content. 
              <br />
              <span className="font-semibold text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReplace}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReplace}
              className="bg-destructive hover:bg-destructive/90"
            >
              Replace Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


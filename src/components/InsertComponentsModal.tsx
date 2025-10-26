"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { INSERT_COMPONENTS, type InsertComponent } from "@/lib/insert-components-data";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsertComponentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (componentId: string) => void;
}

// Icon mapping for components
const componentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "free-image": ImagePlus,
};

export function InsertComponentsModal({
  open,
  onOpenChange,
  onSelect,
}: InsertComponentsModalProps) {
  const handleSelect = (componentId: string) => {
    onSelect(componentId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <ImagePlus className="h-6 w-6 text-primary" />
            </div>
            Insert Component
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose a component to insert into your document
          </DialogDescription>
        </DialogHeader>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {INSERT_COMPONENTS.map((component) => {
            const Icon = componentIcons[component.id] || ImagePlus;
            
            return (
              <button
                key={component.id}
                onClick={() => handleSelect(component.id)}
                className={cn(
                  "group relative p-6 rounded-xl border border-border/60",
                  "hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10",
                  "hover:bg-accent/30 hover:scale-[1.02]",
                  "transition-all duration-300 ease-out",
                  "backdrop-blur-sm bg-background/50",
                  "text-left"
                )}
              >
                {/* Icon */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl">{component.icon}</div>
                </div>

                {/* Component Info */}
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors duration-200">
                  {component.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {component.description}
                </p>

                {/* Category badge */}
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground">
                    {component.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty state for future */}
        {INSERT_COMPONENTS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImagePlus className="h-12 w-12 opacity-50 mb-4" />
            <p className="text-base">No components available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


/**
 * CustomClassPopoverContent Component
 * 
 * Reusable custom class picker content for toolbar popovers
 */

"use client";

import React from "react";
import { Search, Code2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Switch } from "../ui/switch";

interface CustomClassPopoverContentProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  devMode: boolean;
  setDevMode: (value: boolean) => void;
  filteredClasses: any[];
  onApplyClass: (className: string) => void;
}

export function CustomClassPopoverContent({
  searchQuery,
  setSearchQuery,
  devMode,
  setDevMode,
  filteredClasses,
  onApplyClass,
}: CustomClassPopoverContentProps) {
  return (
    <div className="space-y-3">
      {/* Dev Mode Toggle */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Dev Mode</span>
        </div>
        <Switch
          checked={devMode}
          onCheckedChange={setDevMode}
          aria-label="Toggle dev mode"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder={
            devMode
              ? "Search classes... (e.g., 'text', 'bg', 'flex')"
              : "Search styles... (e.g., 'red', 'bold', 'shadow')"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {devMode ? (
            // Dev Mode: Show Tailwind classes
            <>
              {filteredClasses.map((group) => (
                <div key={group.category}>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                    {group.category}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(group as any).classes.map((cls: string) => (
                      <Button
                        key={cls}
                        variant="outline"
                        size="sm"
                        onClick={() => onApplyClass(cls)}
                        className="text-xs h-6 px-2"
                      >
                        {cls}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            // User Mode: Show user-friendly names
            <>
              {filteredClasses.map((group) => (
                <div key={group.category}>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                    {group.category}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(group as any).items.map(
                      (item: { label: string; value: string }) => (
                        <Button
                          key={item.value}
                          variant="outline"
                          size="sm"
                          onClick={() => onApplyClass(item.value)}
                          className="text-xs h-6 px-2"
                          title={`Applies: ${item.value}`}
                        >
                          {item.label}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          {filteredClasses.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No classes found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


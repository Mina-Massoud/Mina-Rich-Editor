"use client";

import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface ToolbarProps {
  readOnly: boolean;
  onReadOnlyChange: (readOnly: boolean) => void;
}

export function Toolbar({ readOnly, onReadOnlyChange }: ToolbarProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <div className="fixed top-17 right-4 z-[105] flex items-center gap-1 bg-background border rounded-lg shadow-lg p-1.5">
        {/* Read-only toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={readOnly ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9"
              onClick={() => onReadOnlyChange(!readOnly)}
            >
              {readOnly ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              <span className="sr-only">
                {readOnly ? "View Only Mode" : "Edit Mode"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{readOnly ? "View Only Mode" : "Edit Mode"}</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Theme</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}


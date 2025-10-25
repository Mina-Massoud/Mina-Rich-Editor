"use client";

import { Eye, EyeOff, Sun, Moon, FileText } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
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
  notionBased?: boolean;
  onNotionBasedChange?: (notionBased: boolean) => void;
}

export function QuickModeToggle({ 
  readOnly, 
  onReadOnlyChange,
  notionBased,
  onNotionBasedChange 
}: ToolbarProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <div className="fixed top-[4.5rem] md:top-20 lg:top-17 right-2 md:right-4 z-[105] flex items-center gap-1 bg-background border rounded-lg shadow-lg p-1 md:p-1.5">
        {/* Editor Mode Toggle - Only show if handler is provided */}
        {onNotionBasedChange && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={notionBased ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8 md:h-9 md:w-9 relative"
                  onClick={() => onNotionBasedChange(!notionBased)}
                >
                  <Image 
                    src="/notion-logo.png" 
                    alt="Notion Logo"
                    width={16}
                    height={16}
                    className={`h-3.5 w-3.5 md:h-4 md:w-4 invert-0 dark:invert  ${notionBased ? '!invert dark:!invert-0' : ''}`}
                  />
                  <span className="sr-only">
                    {notionBased ? "Notion Mode" : "Rich Editor Mode"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {notionBased ? (
                    <>
                      <strong>Notion Mode</strong>
                      <br />
                      With cover & header
                    </>
                  ) : (
                    <>
                      <strong>Rich Editor Mode</strong>
                      <br />
                      Clean blocks
                    </>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 md:h-6" />
          </>
        )}

        {/* Read-only toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={readOnly ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={() => onReadOnlyChange(!readOnly)}
            >
              {readOnly ? (
                <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
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

        <Separator orientation="vertical" className="h-5 md:h-6" />

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9"
              onClick={toggleTheme}
            >
              <Sun className="h-3.5 w-3.5 md:h-4 md:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 md:h-4 md:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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


"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Minus, Plus } from "lucide-react";

interface FontSizePickerProps {
  disabled?: boolean;
  onFontSizeSelect: (fontSize: string) => void;
  currentFontSize?: string;
}

// Extract numeric value from inline style fontSize value
const extractFontSize = (fontSizeValue?: string): number => {
  if (!fontSizeValue) return 16; // default

  // Check if it's a pixel value
  if (fontSizeValue.includes("px")) {
    return parseInt(fontSizeValue.replace("px", "")) || 16;
  }

  // If it's just a number
  const parsed = parseInt(fontSizeValue);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return 16;
};

export function FontSizePicker({
  disabled = false,
  onFontSizeSelect,
  currentFontSize,
}: FontSizePickerProps) {
  const [fontSize, setFontSize] = useState<number>(
    extractFontSize(currentFontSize)
  );

  // Update fontSize when currentFontSize changes (selection changes)
  useEffect(() => {
    const extractedSize = extractFontSize(currentFontSize);
    setFontSize(extractedSize);
  }, [currentFontSize]);

  const handleIncrement = () => {
    const newSize = Math.min(fontSize + 2, 128);
    setFontSize(newSize);
    onFontSizeSelect(`${newSize}px`);
  };

  const handleDecrement = () => {
    const newSize = Math.max(fontSize - 2, 8);
    setFontSize(newSize);
    onFontSizeSelect(`${newSize}px`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 16;
    const clampedValue = Math.max(8, Math.min(value, 128));
    setFontSize(clampedValue);
  };

  const handleInputBlur = () => {
    onFontSizeSelect(`${fontSize}px`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onFontSizeSelect(`${fontSize}px`);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center gap-0.5 bg-muted/50 rounded-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || fontSize <= 8}
        type="button"
        className="h-7 w-6 md:h-8 md:w-7 rounded-r-none hover:bg-muted"
        title="Decrease font size"
      >
        <Minus className="size-3 md:size-3.5" />
      </Button>

      <Input
        type="number"
        value={fontSize}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        min={8}
        max={128}
        className="h-7 w-10 md:h-8 md:w-14 text-center text-xs md:text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0.5 md:px-1 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        title="Font size in pixels"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrement}
        type="button"
        disabled={disabled || fontSize >= 128}
        className="h-7 w-6 md:h-8 md:w-7 rounded-l-none hover:bg-muted"
        title="Increase font size"
      >
        <Plus className="size-3 md:size-3.5" />
      </Button>
    </div>
  );
}


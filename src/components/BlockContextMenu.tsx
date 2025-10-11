'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ColorPicker as ShadcnColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from '@/components/ui/shadcn-io/color-picker';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaintBucket } from 'lucide-react';

interface BlockContextMenuProps {
  children: React.ReactNode;
  onBackgroundColorChange: (color: string) => void;
  currentBackgroundColor?: string;
}

// Light mode colors - subtle, light backgrounds
const lightModeColors = [
  { name: 'None', hex: 'transparent' },
  { name: 'Red', hex: '#fef2f2' },
  { name: 'Orange', hex: '#fff7ed' },
  { name: 'Yellow', hex: '#fefce8' },
  { name: 'Green', hex: '#f0fdf4' },
  { name: 'Blue', hex: '#eff6ff' },
  { name: 'Indigo', hex: '#eef2ff' },
  { name: 'Purple', hex: '#faf5ff' },
  { name: 'Pink', hex: '#fdf2f8' },
  { name: 'Teal', hex: '#f0fdfa' },
  { name: 'Cyan', hex: '#ecfeff' },
  { name: 'Gray', hex: '#f9fafb' },
];

// Dark mode colors - darker, more saturated backgrounds
const darkModeColors = [
  { name: 'None', hex: 'transparent' },
  { name: 'Red', hex: '#450a0a' },
  { name: 'Orange', hex: '#431407' },
  { name: 'Yellow', hex: '#422006' },
  { name: 'Green', hex: '#052e16' },
  { name: 'Blue', hex: '#172554' },
  { name: 'Indigo', hex: '#1e1b4b' },
  { name: 'Purple', hex: '#2e1065' },
  { name: 'Pink', hex: '#500724' },
  { name: 'Teal', hex: '#042f2e' },
  { name: 'Cyan', hex: '#164e63' },
  { name: 'Gray', hex: '#1f2937' },
];

export function BlockContextMenu({
  children,
  onBackgroundColorChange,
  currentBackgroundColor,
}: BlockContextMenuProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#ffffff');
  const [displayColor, setDisplayColor] = useState('#ffffff');
  
  // Get current theme
  const { theme, resolvedTheme } = useTheme();
  
  // Determine which color preset to use based on theme
  // resolvedTheme is 'light' or 'dark' (resolves 'system' to actual theme)
  const presetColors = useMemo(() => {
    const currentTheme = resolvedTheme || theme;
    return currentTheme === 'dark' ? darkModeColors : lightModeColors;
  }, [theme, resolvedTheme]);

  const handleCustomColorChange = (value: any) => {
    let hexColor = '#ffffff';
    
    if (typeof value === 'string') {
      hexColor = value;
    } else if (Array.isArray(value)) {
      // Extract RGB values (ignore alpha - it's the 4th element)
      const [r, g, b] = value;
      
      // Ensure RGB values are valid numbers, clamp to 0-255 range
      const rValue = Math.max(0, Math.min(255, Math.round(r || 0)));
      const gValue = Math.max(0, Math.min(255, Math.round(g || 0)));
      const bValue = Math.max(0, Math.min(255, Math.round(b || 0)));
      
      hexColor = `#${rValue.toString(16).padStart(2, '0')}${gValue.toString(16).padStart(2, '0')}${bValue.toString(16).padStart(2, '0')}`;
    }
    
    setCustomColor(hexColor);
    setDisplayColor(hexColor);
  };

  const handlePresetColorSelect = (color: string) => {
    onBackgroundColorChange(color);
    setIsDialogOpen(false);
  };

  const handleApplyCustomColor = () => {
    onBackgroundColorChange(customColor);
    setIsDialogOpen(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="gap-2"
          >
            <PaintBucket className="size-4" />
            <span>Change Background Color</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Block Background Color</DialogTitle>
            <DialogDescription>
              Choose a background color for this block
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="preset" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">Preset Colors</TabsTrigger>
              <TabsTrigger value="custom">Custom Color</TabsTrigger>
            </TabsList>

            <TabsContent value="preset" className="space-y-3 pt-4">
              <h4 className="font-medium text-sm">Background Colors</h4>
              <div className="grid grid-cols-4 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => handlePresetColorSelect(color.hex)}
                    className={`h-16 rounded-md border-2 transition-all hover:scale-105 hover:shadow-md ${
                      currentBackgroundColor === color.hex
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border'
                    }`}
                    title={color.name}
                    style={{ 
                      backgroundColor: color.hex,
                      backgroundImage: color.hex === 'transparent' 
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                        : 'none',
                      backgroundSize: color.hex === 'transparent' ? '10px 10px' : 'auto',
                      backgroundPosition: color.hex === 'transparent' ? '0 0, 5px 5px' : 'initial'
                    }}
                  >
                    <span className="text-xs font-medium text-foreground/60">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-3 pt-4">
              <ShadcnColorPicker
                defaultValue="#ffffff"
                onChange={handleCustomColorChange}
                className="w-full rounded-md border bg-background p-3 shadow-sm"
              >
                <ColorPickerSelection className="" />
                <div className="flex items-center gap-2 mt-2">
                  <ColorPickerEyeDropper />
                  <div className="grid w-full gap-1">
                    <ColorPickerHue />
                    <ColorPickerAlpha />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <ColorPickerOutput className="flex-1" />
                  <ColorPickerFormat />
                </div>
              </ShadcnColorPicker>
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="h-8 w-8 rounded border shrink-0"
                    style={{ backgroundColor: displayColor }}
                  />
                  <span className="font-mono text-xs font-medium truncate">{displayColor}</span>
                </div>
                <Button
                  onClick={handleApplyCustomColor}
                  size="sm"
                  className="shrink-0"
                >
                  Apply
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}


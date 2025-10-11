'use client';

import { useRef, useState } from 'react';
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
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColorPickerComponentProps {
  disabled?: boolean;
  onColorSelect: (color: string) => void;
  selectedColor?: string;
}

const presetColors = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
];

export function ColorPickerComponent({
  disabled,
  onColorSelect,
  selectedColor,
}: ColorPickerComponentProps) {
  // Start with a vibrant blue so it's clearly not white
  const [displayColor, setDisplayColor] = useState('rgb(59, 130, 246)');
  const customColorRef = useRef<string>('#3b82f6');

  const handleCustomColorChange = (value: any) => {
    let hexColor = '#000000';
    
    if (typeof value === 'string') {
      hexColor = value;
    } else if (Array.isArray(value)) {
      // Extract RGB values (ignore alpha - it's the 4th element and can be NaN)
      const [r, g, b] = value;
      
      // Ensure RGB values are valid numbers, clamp to 0-255 range
      const rValue = Math.max(0, Math.min(255, Math.round(r || 0)));
      const gValue = Math.max(0, Math.min(255, Math.round(g || 0)));
      const bValue = Math.max(0, Math.min(255, Math.round(b || 0)));
      
      hexColor = `#${rValue.toString(16).padStart(2, '0')}${gValue.toString(16).padStart(2, '0')}${bValue.toString(16).padStart(2, '0')}`;
    }
    
    // Update ref with the current color
    customColorRef.current = hexColor;
    // Update display
    setDisplayColor(hexColor);
  };

  const handleApplyCustomColor = () => {
    // Send the hex color directly (we'll handle it as inline style)
    const hexColor = customColorRef.current;
    onColorSelect(hexColor);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Palette className="size-4" />
          Color
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <Tabs defaultValue="preset" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">Preset Colors</TabsTrigger>
            <TabsTrigger value="custom">Custom Color</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-3">
            <h4 className="font-medium text-sm">Text Colors</h4>
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => onColorSelect(color.hex)}
                  className={`h-10 rounded-md border-2 transition-all hover:scale-110 ${
                    selectedColor === color.hex
                      ? 'border-foreground'
                      : 'border-border'
                  }`}
                  title={color.name}
                  style={{ color: color.hex }}
                >
                  <span className="font-bold text-2xl">A</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-3">
            <h4 className="font-medium text-sm">Custom Color Picker</h4>
            <ShadcnColorPicker
              defaultValue="#3b82f6"
              onChange={handleCustomColorChange}
              className="w-full rounded-md border bg-background p-4 shadow-sm"
            >
              <ColorPickerSelection className="h-32" />
              <div className="flex items-center gap-4">
                <ColorPickerEyeDropper />
                <div className="grid w-full gap-1">
                  <ColorPickerHue />
                  <ColorPickerAlpha />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ColorPickerOutput />
                <ColorPickerFormat />
              </div>
            </ShadcnColorPicker>
            <Button
              onClick={handleApplyCustomColor}
              className="w-full"
              size="sm"
            >
              Apply Custom Color
            </Button>
            <div className="flex items-center gap-2 rounded-md border p-2">
              <div
                className="h-8 w-8 rounded border"
                style={{ backgroundColor: displayColor }}
              />
              <span className="font-mono text-xs">{displayColor}</span>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}


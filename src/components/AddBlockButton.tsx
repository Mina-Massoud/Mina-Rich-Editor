/**
 * AddBlockButton Component
 * 
 * Shows a button between blocks to add new content
 * Appears on hover for better UX
 */

'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

interface AddBlockButtonProps {
  onAdd: () => void;
  position?: 'before' | 'after';
}

export function AddBlockButton({ onAdd, position = 'after' }: AddBlockButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative h-3 flex items-center justify-center transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover area - full width */}
      <div className="absolute inset-0 w-full" />

      {/* Divider line - shows on hover */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center transition-opacity
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="w-full h-px bg-border" />
      </div>

      {/* Add button - shows on hover */}
      <Button
        variant="outline"
        type="button" // Prevent form submission if inside a form
        size="sm"
        className={`
          relative z-10 gap-1 h-6 px-2 transition-all shadow-sm
          ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
      >
        <Plus className="h-3 w-3" />
        <span className="text-xs">Add block</span>
      </Button>
    </div>
  );
}


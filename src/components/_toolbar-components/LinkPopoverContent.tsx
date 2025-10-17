/**
 * LinkPopoverContent Component
 * 
 * Reusable link editor content for toolbar popovers
 */

"use client";

import React from "react";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface LinkPopoverContentProps {
  hrefInput: string;
  setHrefInput: (value: string) => void;
  hasExistingLink: boolean;
  selectedText: string;
  onApply: () => void;
  onRemove: () => void;
}

export function LinkPopoverContent({
  hrefInput,
  setHrefInput,
  hasExistingLink,
  selectedText,
  onApply,
  onRemove,
}: LinkPopoverContentProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-sm mb-1">
          {hasExistingLink ? 'Edit Link' : 'Add Link'}
        </h4>
        <p className="text-xs text-muted-foreground">
          Selected text: "{selectedText}"
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="href-input" className="text-xs">
          Link URL
        </Label>
        <Input
          id="href-input"
          placeholder="https://example.com"
          value={hrefInput}
          onChange={(e) => setHrefInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onApply();
            }
          }}
          className="flex-1"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onApply}
          disabled={!hrefInput.trim()}
          size="sm"
          className="flex-1"
        >
          <LinkIcon className="size-3.5 mr-1.5" />
          {hasExistingLink ? 'Update' : 'Add Link'}
        </Button>
        {hasExistingLink && (
          <Button
            onClick={onRemove}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}


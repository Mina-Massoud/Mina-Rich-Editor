/**
 * Group Images Button Component
 *
 * Floating button that appears when multiple images are selected
 * Allows grouping selected images into a flex container
 */

"use client";

import React from "react";
import { Button } from "./ui/button";
import { Images, X, ArrowLeftRight, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GroupImagesButtonProps {
  selectedCount: number;
  inSameFlex: boolean;
  onGroup: () => void;
  onReverse?: () => void;
  onExtract?: () => void;
  onClear: () => void;
}

export function GroupImagesButton({
  selectedCount,
  inSameFlex,
  onGroup,
  onReverse,
  onExtract,
  onClear,
}: GroupImagesButtonProps) {
  if (selectedCount < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg shadow-2xl p-2">
          {/* Selection count */}
          <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
            {selectedCount} {selectedCount === 1 ? "image" : "images"} selected
          </div>

          {/* Show different actions based on whether in flex */}
          {inSameFlex ? (
            <>
              {/* Reverse button */}
              {onReverse && (
                <Button
                  onClick={onReverse}
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Reverse Order
                </Button>
              )}

              {/* Extract button */}
              {onExtract && (
                <Button
                  onClick={onExtract}
                  size="sm"
                  variant="secondary"
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Extract from Flex
                </Button>
              )}
            </>
          ) : (
            /* Group button */
            <Button
              onClick={onGroup}
              size="sm"
              className="gap-2"
            >
              <Images className="h-4 w-4" />
              Group into Flex
            </Button>
          )}

          {/* Clear button */}
          <Button
            onClick={onClear}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


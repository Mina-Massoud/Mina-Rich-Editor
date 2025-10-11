/**
 * Block Component
 * 
 * Represents a single editable block (paragraph, heading, etc.)
 * Handles its own rendering, editing, and event handling.
 * Supports recursive rendering of nested blocks via ContainerNode.
 */

'use client';

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { TextNode, EditorNode, isContainerNode, ContainerNode } from '../lib';
import { ImageBlock } from './ImageBlock';

interface BlockProps {
  node: EditorNode;
  isActive: boolean;
  nodeRef: (el: HTMLDivElement | null) => void;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick: () => void;
  onDelete?: () => void;
  onCreateNested?: (nodeId: string) => void; // Callback to create a nested block
  depth?: number; // Track nesting depth for styling
  readOnly?: boolean; // View-only mode - prevents editing
  onImageDragStart?: (nodeId: string) => void; // Callback when image starts being dragged
}

export function Block({
  node,
  isActive,
  nodeRef,
  onInput,
  onKeyDown,
  onClick,
  onDelete,
  onCreateNested,
  depth = 0,
  readOnly = false,
  onImageDragStart,
}: BlockProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false); // Track IME composition
  const shouldPreserveSelectionRef = useRef(false);
  
  // Handle container nodes (recursive rendering)
  if (isContainerNode(node)) {
    const containerNode = node as ContainerNode;
    return (
      <div
        key={node.id}
        data-node-id={node.id}
        data-node-type="container"
        className={`
          border-l-2 border-border/50 pl-2 ml-6
          transition-all
          ${isActive ? 'border-primary' : 'hover:border-border'}
        `}
        onClick={onClick}
      >
        {containerNode.children.map((childNode) => (
          <Block
            key={childNode.id}
            node={childNode}
            isActive={isActive}
            nodeRef={nodeRef}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onClick={onClick}
            onDelete={onDelete}
            onCreateNested={onCreateNested}
            depth={depth + 1}
            readOnly={readOnly}
            onImageDragStart={onImageDragStart}
          />
        ))}
      </div>
    );
  }
  
  // Cast to TextNode for remaining cases
  const textNode = node as TextNode;
  
  // BR elements render as empty space
  if (textNode.type === 'br') {
    return (
      <div
        key={textNode.id}
        data-node-id={textNode.id}
        className="h-6"
        onClick={onClick}
      />
    );
  }

  // Image nodes render as ImageBlock
  if (textNode.type === 'img') {
    return (
      <ImageBlock
        node={textNode}
        isActive={isActive}
        onClick={onClick}
        onDelete={onDelete}
        onDragStart={onImageDragStart}
      />
    );
  }

  // Check if node has inline children with formatting
  const hasChildren = Array.isArray(textNode.children) && textNode.children.length > 0;
  // Check if node has multiple lines
  const hasLines = Array.isArray(textNode.lines) && textNode.lines.length > 0;

  // Build HTML content from children or lines
  const buildHTML = useCallback(() => {
    // If node has multiple lines (e.g., ordered list with multiple items)
    if (hasLines) {
      return textNode.lines!.map((line, index) => {
        let lineContent = '';
        
        // If line has inline children with formatting
        if (line.children && line.children.length > 0) {
          lineContent = line.children.map(child => {
            const classes = [
              child.bold ? 'font-bold' : '',
              child.italic ? 'italic' : '',
              child.underline ? 'underline' : '',
              child.className || '', // Include custom className
            ].filter(Boolean).join(' ');
            
            // If it's a link
            if (child.href) {
              const linkClasses = ['text-primary hover:underline cursor-pointer', classes].filter(Boolean).join(' ');
              const italicSpacing = child.italic ? 'inline-block pr-1' : '';
              const combinedClasses = [linkClasses, italicSpacing].filter(Boolean).join(' ');
              return `<a href="${child.href}" target="_blank" rel="noopener noreferrer" class="${combinedClasses}">${child.content || ''}</a>`;
            }
            
            if (child.elementType) {
              const elementClasses = getTypeClassName(child.elementType);
              const italicSpacing = child.italic ? 'inline-block pr-1' : '';
              const combinedClasses = [elementClasses, classes, italicSpacing].filter(Boolean).join(' ');
              return `<span class="${combinedClasses}">${child.content || ''}</span>`;
            }
            
            if (classes) {
              const italicSpacing = child.italic ? 'inline-block pr-1' : '';
              const combinedClasses = [classes, italicSpacing].filter(Boolean).join(' ');
              return `<span class="${combinedClasses}">${child.content || ''}</span>`;
            }
            return child.content || '';
          }).join('');
        } else {
          lineContent = line.content || '';
        }
        
        // Add line number for list items
        if (textNode.type === 'li') {
          return `${index + 1}. ${lineContent}`;
        }
        
        return lineContent;
      }).join('<br>');
    }
    
    // If node has inline children with formatting (single line)
    if (hasChildren) {
      return textNode.children!.map(child => {
        const classes = [
          child.bold ? 'font-bold' : '',
          child.italic ? 'italic' : '',
          child.underline ? 'underline' : '',
          child.className || '', // Include custom className
        ].filter(Boolean).join(' ');
        
        // If it's a link
        if (child.href) {
          const linkClasses = ['text-primary hover:underline cursor-pointer', classes].filter(Boolean).join(' ');
          const italicSpacing = child.italic ? 'inline-block pr-1' : '';
          const combinedClasses = [linkClasses, italicSpacing].filter(Boolean).join(' ');
          return `<a href="${child.href}" target="_blank" rel="noopener noreferrer" class="${combinedClasses}">${child.content || ''}</a>`;
        }
        
        // If child has an elementType, wrap in appropriate element
        if (child.elementType) {
          const elementClasses = getTypeClassName(child.elementType);
          // Add extra spacing for italic text to prevent overlapping
          const italicSpacing = child.italic ? 'inline-block pr-1' : '';
          const combinedClasses = [elementClasses, classes, italicSpacing].filter(Boolean).join(' ');
          return `<span class="${combinedClasses}">${child.content || ''}</span>`;
        }
        
        if (classes) {
          // Add extra spacing for italic text to prevent overlapping
          const italicSpacing = child.italic ? 'inline-block pr-1' : '';
          const combinedClasses = [classes, italicSpacing].filter(Boolean).join(' ');
          return `<span class="${combinedClasses}">${child.content || ''}</span>`;
        }
        return child.content || '';
      }).join('');
    }
    
    // Simple content (single line, no formatting)
    return textNode.content || '';
  }, [hasChildren, hasLines, textNode.children, textNode.lines, textNode.content, textNode.type]);

  // Save and restore selection
  const saveSelection = useCallback(() => {
    if (!localRef.current) return null;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    if (!localRef.current.contains(range.commonAncestorContainer)) return null;
    
    // Create a simplified representation of the selection
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(localRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    
    return {
      start: preCaretRange.toString().length,
      end: preCaretRange.toString().length + range.toString().length,
      collapsed: range.collapsed
    };
  }, []);

  const restoreSelection = useCallback((savedSelection: { start: number; end: number; collapsed: boolean } | null) => {
    if (!savedSelection || !localRef.current) return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    let charIndex = 0;
    let startNode: Node | undefined = undefined;
    let startOffset = 0;
    let endNode: Node | undefined = undefined;
    let endOffset = 0;
    
    const walk = (node: Node): void => {
      if (startNode && endNode) return;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        
        // Find start position
        if (!startNode && charIndex + textLength >= savedSelection.start) {
          startNode = node;
          startOffset = savedSelection.start - charIndex;
        }
        
        // Find end position
        if (!endNode && charIndex + textLength >= savedSelection.end) {
          endNode = node;
          endOffset = savedSelection.end - charIndex;
        }
        
        charIndex += textLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
          if (startNode && endNode) break;
        }
      }
    };
    
    walk(localRef.current);
    
    try {
      const range = document.createRange();
      
      if (startNode && endNode) {
        const start = startNode as Node;
        const end = endNode as Node;
        range.setStart(start, Math.min(startOffset, start.textContent?.length || 0));
        
        if (savedSelection.collapsed) {
          range.collapse(true);
        } else {
          range.setEnd(end, Math.min(endOffset, end.textContent?.length || 0));
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      console.warn('Failed to restore selection:', e);
    }
  }, []);

  // Update content when needed
  useEffect(() => {
    if (!localRef.current) return;
    
    // Skip updates during IME composition or when we should preserve selection
    if (isComposingRef.current || shouldPreserveSelectionRef.current) {
      return;
    }
    
    const element = localRef.current;
    const newHTML = buildHTML();
    
    // Only update if content actually changed
    if (element.innerHTML !== newHTML) {
      const hadFocus = document.activeElement === element;
      const savedSelection = hadFocus ? saveSelection() : null;
      
      element.innerHTML = newHTML;
      
      // Restore selection if the element had focus
      if (hadFocus && savedSelection) {
        restoreSelection(savedSelection);
      }
    }
  }, [buildHTML, saveSelection, restoreSelection]);

  // Handle composition events for IME input
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
  }, []);

  // Handle input with selection preservation
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    // Set flag to prevent content updates until next render
    shouldPreserveSelectionRef.current = true;
    
    // Call the parent onInput handler
    onInput(e.currentTarget);
    
    // Reset the flag after a short delay to allow React to process
    setTimeout(() => {
      shouldPreserveSelectionRef.current = false;
    }, 0);
  }, [onInput]);

  // Handle keydown - intercept Shift+Enter for nested blocks
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && e.shiftKey && onCreateNested) {
      e.preventDefault();
      onCreateNested(textNode.id);
      return;
    }
    
    // Pass to parent handler for other keys
    onKeyDown(e);
  }, [onKeyDown, onCreateNested, textNode.id]);

  // Handle clicks on links in read-only mode
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click target is a link
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.hasAttribute('href')) {
      // In read-only mode, let links work naturally
      if (readOnly) {
        return; // Let the browser handle the link
      } else {
        // In edit mode, prevent link navigation
        e.preventDefault();
      }
    }
    
    // Call the parent onClick handler
    onClick();
  }, [readOnly, onClick]);

  return (
    <div
      key={textNode.id}
      ref={(el) => {
        localRef.current = el;
        nodeRef(el);
      }}
      data-node-id={textNode.id}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={readOnly ? undefined : handleInput}
      onKeyDown={readOnly ? undefined : handleKeyDown}
      onClick={handleClick}
      onCompositionStart={readOnly ? undefined : handleCompositionStart}
      onCompositionEnd={readOnly ? undefined : handleCompositionEnd}
      className={`
        ${getTypeClassName(textNode.type)}
        ${readOnly ? '' : 'outline-none focus:ring-1 focus:ring-border/50'}
        rounded-lg px-3 py-2 mb-2
        transition-all
        ${!readOnly && isActive ? 'ring-1 ring-border/50 bg-accent/5' : ''}
        ${!readOnly ? 'hover:bg-accent/5' : ''}
        ${readOnly ? 'cursor-default' : ''}
      `}
      style={{ marginLeft: `${depth * 0.5}rem` }}
      spellCheck={false}
    />
  );
}

/**
 * Get CSS classes for each node type
 */
function getTypeClassName(type: string): string {
  switch (type) {
    case 'h1':
      return 'text-4xl font-extrabold text-foreground leading-[1.2]';
    case 'h2':
      return 'text-3xl font-bold text-foreground leading-[1.2]';
    case 'h3':
      return 'text-2xl font-semibold text-foreground leading-[1.3]';
    case 'h4':
      return 'text-xl font-semibold text-foreground leading-[1.3]';
    case 'h5':
      return 'text-lg font-semibold text-foreground leading-[1.4]';
    case 'h6':
      return 'text-base font-semibold text-foreground leading-[1.4]';
    case 'p':
      return 'text-base text-foreground leading-relaxed';
    case 'li':
      return 'text-base text-foreground leading-relaxed list-decimal list-inside';
    case 'blockquote':
      return 'text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-2';
    case 'code':
      return 'font-mono text-sm bg-secondary text-secondary-foreground px-4 py-3 rounded-lg whitespace-pre-wrap break-words';
    default:
      return 'text-lg text-foreground leading-relaxed';
  }
}
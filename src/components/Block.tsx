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
import { CommandMenu } from './CommandMenu';

interface BlockProps {
  node: EditorNode;
  isActive: boolean;
  nodeRef: (el: HTMLElement | null) => void;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onClick: () => void;
  onDelete?: () => void;
  onCreateNested?: (nodeId: string) => void; // Callback to create a nested block
  depth?: number; // Track nesting depth for styling
  readOnly?: boolean; // View-only mode - prevents editing
  onImageDragStart?: (nodeId: string) => void; // Callback when image starts being dragged
  onChangeBlockType?: (nodeId: string, newType: string) => void; // Callback to change block type
  onInsertImage?: (nodeId: string) => void; // Callback to insert image
  onCreateList?: (nodeId: string, listType: string) => void; // Callback to create a list container (ol or ul)
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
  onChangeBlockType,
  onInsertImage,
  onCreateList,
}: BlockProps) {
  const localRef = useRef<HTMLElement>(null);
  const isComposingRef = useRef(false); // Track IME composition
  const shouldPreserveSelectionRef = useRef(false);
  
  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuAnchor, setCommandMenuAnchor] = useState<HTMLElement | null>(null);
  
  // Handle container nodes (recursive rendering)
  if (isContainerNode(node)) {
    const containerNode = node as ContainerNode;
    
    // Determine if this container holds list items
    // Check for listType attribute first (new method), then fall back to checking first child type (old method for backwards compatibility)
    const firstChild = containerNode.children[0];
    const listTypeFromAttribute = containerNode.attributes?.listType as string | undefined;
    const listTypeFromChild = firstChild && (firstChild.type === 'ul' || firstChild.type === 'ol' || firstChild.type === 'li') ? 
      (firstChild.type === 'li' ? 'ul' : firstChild.type) : null; // Default to 'ul' if we detect 'li' children
    
    const listType = listTypeFromAttribute || listTypeFromChild;
    const isListContainer = !!listType;
    
    // Use ul/ol for list containers, div for regular nested containers
    const ContainerElement = listType === 'ul' ? 'ul' : listType === 'ol' ? 'ol' : 'div';
    
    const containerClasses = isListContainer
      ? `list-none pl-0 ml-6` // No default bullets/numbers, we'll style via children
      : `border-l-2 border-border/50 pl-2 ml-6 transition-all ${isActive ? 'border-primary' : 'hover:border-border'}`;
    
    return (
      <ContainerElement
        key={node.id}
        data-node-id={node.id}
        data-node-type="container"
        data-list-type={listType || undefined}
        className={containerClasses}
      >
        {containerNode.children.map((childNode) => (
          <Block
            key={childNode.id}
            node={childNode}
            isActive={isActive}
            nodeRef={nodeRef}
            onInput={onInput}
            onKeyDown={(e) => {
              // When Block handles keyboard events for children, we need to ensure
              // the event reaches SimpleEditor's handleKeyDown with the CHILD's ID,
              // not the container's ID. Block's handleKeyDown will call this with
              // the child's textNode.id already in scope.
              onKeyDown(e);
            }}
            onClick={onClick}
            onDelete={onDelete}
            onCreateNested={onCreateNested}
            depth={depth + 1}
            readOnly={readOnly}
            onImageDragStart={onImageDragStart}
            onChangeBlockType={onChangeBlockType}
            onInsertImage={onInsertImage}
            onCreateList={onCreateList}
          />
        ))}
      </ContainerElement>
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
    const element = e.currentTarget;
    const text = element.textContent || '';
    
    // Check if the block is empty and user typed "/"
    if (text === '/' && !readOnly && onChangeBlockType) {
      setShowCommandMenu(true);
      setCommandMenuAnchor(element);
    } else if (showCommandMenu && text !== '/') {
      // Close menu if user continues typing
      setShowCommandMenu(false);
    }
    
    // Set flag to prevent content updates until next render
    shouldPreserveSelectionRef.current = true;
    
    // Call the parent onInput handler
    onInput(element);
    
    // Reset the flag after a short delay to allow React to process
    setTimeout(() => {
      shouldPreserveSelectionRef.current = false;
    }, 0);
  }, [onInput, readOnly, onChangeBlockType, showCommandMenu]);

  // Handle command selection
  const handleCommandSelect = useCallback((commandValue: string) => {
    if (!localRef.current) return;
    
    // Clear the "/" character
    localRef.current.textContent = '';
    
    // Close the menu immediately
    setShowCommandMenu(false);
    setCommandMenuAnchor(null);
    
    // Handle image insertion specially
    if (commandValue === 'img' && onInsertImage) {
      onInsertImage(textNode.id);
      return;
    }
    
    // Handle list creation (both ordered and unordered) - create a container with multiple list items
    if ((commandValue === 'ol' || commandValue === 'ul') && onCreateList) {
      // Small delay to ensure menu is closed before creating the list
      setTimeout(() => {
        onCreateList(textNode.id, commandValue);
      }, 50);
      return;
    }
    
    // For other block types, just change the type
    if (onChangeBlockType) {
      onChangeBlockType(textNode.id, commandValue);
      
      // Focus back on the block
      setTimeout(() => {
        localRef.current?.focus();
      }, 0);
    }
  }, [onChangeBlockType, onInsertImage, onCreateList, textNode.id]);

  // Handle keydown - intercept Shift+Enter for nested blocks
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Close command menu on Escape
    if (e.key === 'Escape' && showCommandMenu) {
      e.preventDefault();
      setShowCommandMenu(false);
      setCommandMenuAnchor(null);
      return;
    }
    
    // If command menu is open, let it handle the keyboard events
    if (showCommandMenu && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      // Don't prevent default - let CommandMenu handle it
      return;
    }
    
    // For list items (ul/ol), handle Enter and Shift+Enter specially
    // For non-list items, Shift+Enter creates nested blocks
    const isListItem = textNode.type === 'ul' || textNode.type === 'ol' || textNode.type === 'li';
    
    // Handle Shift+Enter
    if (e.key === 'Enter' && e.shiftKey) {
      console.log('🔷 [Block.tsx] Shift+Enter detected', {
        nodeId: textNode.id,
        nodeType: textNode.type,
        isListItem,
      });
      
      if (isListItem) {
        // For list items, pass to SimpleEditor to add line break within item
        // Prevent default to stop browser from adding a line break
        // Stop propagation to prevent container from receiving this event
        e.preventDefault();
        e.stopPropagation();
        console.log('🔷 [Block.tsx] Passing to SimpleEditor for list item line break');
        onKeyDown(e);
        return;
      } else if (onCreateNested) {
        // For non-list items, create nested block
        console.log('🔷 [Block.tsx] Creating nested block');
        e.preventDefault();
        onCreateNested(textNode.id);
        return;
      }
    }
    
    // Handle regular Enter for list items
    if (e.key === 'Enter' && !e.shiftKey && isListItem) {
      console.log('🔷 [Block.tsx] Regular Enter in list item', {
        nodeId: textNode.id,
        nodeType: textNode.type,
      });
      // Stop propagation to prevent container from receiving this event
      // SimpleEditor will handle creating a new list item at the same level
      e.stopPropagation();
      console.log('🔷 [Block.tsx] Passing to SimpleEditor to create new list item');
      onKeyDown(e);
      return;
    }
    
    // Pass to parent handler for other keys
    onKeyDown(e);
  }, [onKeyDown, onCreateNested, textNode.id, showCommandMenu]);

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

  // Check if block is empty
  const isEmpty = !textNode.content || textNode.content.trim() === '';
  const showPlaceholder = isEmpty && isActive && !readOnly && onChangeBlockType;
  
  // Use li for list items, div for everything else
  const isListItem = textNode.type === 'li';
  
  // Get custom class from attributes if it exists
  const customClassName = textNode.attributes?.className || '';
  
  // Common props for both div and li elements
  const commonProps = {
    key: textNode.id,
    'data-node-id': textNode.id,
    'data-node-type': textNode.type,
    contentEditable: !readOnly,
    suppressContentEditableWarning: true,
    className: `
      ${isListItem ? 'relative' : ''} 
      ${getTypeClassName(textNode.type)}
      ${customClassName}
      ${readOnly ? '' : 'outline-none focus:ring-1 focus:ring-border/50'}
      rounded-lg px-3 py-2 mb-2
      transition-all
      ${!readOnly && isActive ? 'ring-1 ring-border/50 bg-accent/5' : ''}
      ${!readOnly ? 'hover:bg-accent/5' : ''}
      ${readOnly ? 'cursor-default' : ''}
    `,
    style: { marginLeft: `${depth * 0.5}rem` },
    spellCheck: false,
  };

  return (
    <>
      {isListItem ? (
        // For list items, render li directly without wrapper div
        <li
          {...commonProps}
          ref={(el: HTMLLIElement | null) => {
            localRef.current = el;
            nodeRef(el);
          }}
          onInput={readOnly ? undefined : (e) => handleInput(e as any)}
          onKeyDown={readOnly ? undefined : (e) => handleKeyDown(e as any)}
          onClick={(e) => handleClick(e as any)}
          onCompositionStart={readOnly ? undefined : handleCompositionStart}
          onCompositionEnd={readOnly ? undefined : handleCompositionEnd}
        >
          {/* Placeholder text for list items */}
          {showPlaceholder && (
            <div
              className="absolute left-3 top-2 pointer-events-none text-muted-foreground/50 select-none"
              style={{ marginLeft: `${depth * 0.5}rem` }}
            >
              Type / for commands...
            </div>
          )}
        </li>
      ) : (
        // For non-list items, use wrapper div for positioning
        <div className="relative">
          <div
            {...commonProps}
            ref={(el: HTMLDivElement | null) => {
              localRef.current = el;
              nodeRef(el);
            }}
            onInput={readOnly ? undefined : handleInput}
            onKeyDown={readOnly ? undefined : handleKeyDown}
            onClick={handleClick}
            onCompositionStart={readOnly ? undefined : handleCompositionStart}
            onCompositionEnd={readOnly ? undefined : handleCompositionEnd}
          />
          
          {/* Placeholder text */}
          {showPlaceholder && (
            <div
              className="absolute left-3 top-2 pointer-events-none text-muted-foreground/50 select-none"
              style={{ marginLeft: `${depth * 0.5}rem` }}
            >
              Type / for commands...
            </div>
          )}
        </div>
      )}
      
      {/* Command Menu */}
      {!readOnly && (
        <CommandMenu
          isOpen={showCommandMenu}
          onClose={() => setShowCommandMenu(false)}
          onSelect={handleCommandSelect}
          anchorElement={commandMenuAnchor}
        />
      )}
    </>
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
    case 'ul':
      return 'text-base text-foreground leading-relaxed';
    case 'ol':
      return 'text-base text-foreground leading-relaxed';
    case 'li':
      return 'text-base text-foreground leading-relaxed';
    case 'blockquote':
      return 'text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-2';
    case 'code':
      return 'font-mono text-sm bg-secondary text-secondary-foreground px-4 py-3 rounded-lg whitespace-pre-wrap break-words';
    default:
      return 'text-lg text-foreground leading-relaxed';
  }
}
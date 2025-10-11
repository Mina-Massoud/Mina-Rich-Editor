/**
 * CommandMenu Component
 * 
 * A Notion-style command menu that appears when typing "/" in an empty block.
 * Provides searchable commands for changing block types (H1, H2, P, etc.)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from './ui/command';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from './ui/popover';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Type,
  Code,
  Quote,
  List,
  ListOrdered,
  Image,
} from 'lucide-react';
import { useEditor } from '@/lib';

export interface CommandOption {
  label: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  keywords?: string[];
}

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  anchorElement: HTMLElement | null;
}

const commands: CommandOption[] = [
  {
    label: 'Heading 1',
    value: 'h1',
    icon: <Heading1 className="w-4 h-4" />,
    description: 'Big section heading',
    keywords: ['h1', 'heading', 'title', 'large'],
  },
  {
    label: 'Heading 2',
    value: 'h2',
    icon: <Heading2 className="w-4 h-4" />,
    description: 'Medium section heading',
    keywords: ['h2', 'heading', 'subtitle'],
  },
  {
    label: 'Heading 3',
    value: 'h3',
    icon: <Heading3 className="w-4 h-4" />,
    description: 'Small section heading',
    keywords: ['h3', 'heading', 'subheading'],
  },
  {
    label: 'Heading 4',
    value: 'h4',
    icon: <Heading4 className="w-4 h-4" />,
    description: 'Tiny section heading',
    keywords: ['h4', 'heading'],
  },
  {
    label: 'Heading 5',
    value: 'h5',
    icon: <Heading5 className="w-4 h-4" />,
    description: 'Smaller heading',
    keywords: ['h5', 'heading'],
  },
  {
    label: 'Heading 6',
    value: 'h6',
    icon: <Heading6 className="w-4 h-4" />,
    description: 'Smallest heading',
    keywords: ['h6', 'heading'],
  },
  {
    label: 'Paragraph',
    value: 'p',
    icon: <Type className="w-4 h-4" />,
    description: 'Regular text paragraph',
    keywords: ['p', 'paragraph', 'text', 'normal'],
  },
  {
    label: 'Code Block',
    value: 'code',
    icon: <Code className="w-4 h-4" />,
    description: 'Code snippet',
    keywords: ['code', 'codeblock', 'snippet', 'pre'],
  },
  {
    label: 'Quote',
    value: 'blockquote',
    icon: <Quote className="w-4 h-4" />,
    description: 'Block quote',
    keywords: ['quote', 'blockquote', 'citation'],
  },
  {
    label: 'Bulleted List',
    value: 'ul',
    icon: <List className="w-4 h-4" />,
    description: 'Unordered list with bullets',
    keywords: ['list', 'bullet', 'unordered', 'ul', 'li'],
  },
  {
    label: 'Numbered List',
    value: 'ol',
    icon: <ListOrdered className="w-4 h-4" />,
    description: 'Ordered list with numbers',
    keywords: ['list', 'numbered', 'ordered', 'ol', 'li'],
  },
  {
    label: 'Image',
    value: 'img',
    icon: <Image className="w-4 h-4" />,
    description: 'Upload or embed an image',
    keywords: ['image', 'img', 'picture', 'photo', 'upload'],
  },
];

export function CommandMenu({ 
  isOpen, 
  onClose, 
  onSelect, 
  anchorElement 
}: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);

  const [state] = useEditor();


  // Filter commands based on search
  const filteredCommands = search
    ? commands.filter(cmd => {
        const searchLower = search.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.value.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
        );
      })
    : commands;

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].value);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

  // Reset search when menu closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Don't render if there's no anchor element
  if (!anchorElement) return null;

  return (
    <Popover 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only close if explicitly requested
        if (!open) {
          onClose();
        }
      }}
    >
      <PopoverAnchor virtualRef={{ current: anchorElement }} />
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[320px] p-0"
        onOpenAutoFocus={(e) => {
          // Prevent stealing focus from the editor
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Let Block component handle Escape
          e.preventDefault();
        }}
        onFocusOutside={(e) => {
          // Prevent closing when focus moves
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on the editor block
          const target = e.target as HTMLElement;
          if (target.closest('[contenteditable="true"]') || target === anchorElement) {
            e.preventDefault();
          }
        }}
      >
        <Command ref={commandRef} shouldFilter={false}>
          <CommandInput 
            placeholder="Search commands..." 
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            <CommandGroup heading="Turn into">
              {filteredCommands.map((command, index) => (
                <CommandItem
                  key={command.value}
                  value={command.value}
                  onSelect={() => onSelect(command.value)}
                  className={`
                    flex items-start gap-3 px-3 py-2 cursor-pointer
                    ${index === selectedIndex ? 'bg-accent' : ''}
                  `}
                >
                  <div className="mt-0.5">{command.icon}</div>
                  <div className="flex flex-col">
                    <span className="font-medium">{command.label}</span>
                    {command.description && (
                      <span className="text-xs text-muted-foreground">
                        {command.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


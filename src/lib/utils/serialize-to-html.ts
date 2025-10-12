/**
 * Serialize Editor State to HTML
 * 
 * Converts the editor's state container to HTML with Tailwind classes
 * Output matches exactly what the editor displays visually
 * Supports recursive rendering of nested containers
 */

import { ContainerNode, StructuralNode, TextNode, EditorNode, isTextNode, isContainerNode, isStructuralNode, hasInlineChildren } from '../types';

/**
 * Get Tailwind CSS classes for block-level element types
 */
function getBlockTypeClasses(type: string): string {
  switch (type) {
    case 'h1':
      return 'text-5xl font-extrabold text-foreground leading-[1.2]';
    case 'h2':
      return 'text-4xl font-bold text-foreground leading-[1.2]';
    case 'h3':
      return 'text-3xl font-semibold text-foreground leading-[1.3]';
    case 'h4':
      return 'text-2xl font-semibold text-foreground leading-[1.3]';
    case 'h5':
      return 'text-xl font-semibold text-foreground leading-[1.4]';
    case 'h6':
      return 'text-lg font-semibold text-foreground leading-[1.4]';
    case 'p':
      return 'text-lg text-foreground leading-relaxed';
    case 'li':
      return 'text-lg text-foreground leading-relaxed';
    case 'blockquote':
      return 'text-xl text-muted-foreground italic border-l-4 border-primary pl-6 py-2';
    case 'code':
      return 'font-mono text-base bg-secondary text-secondary-foreground px-2 py-0.5 rounded';
    case 'br':
      return '';
    default:
      return 'text-lg text-foreground leading-relaxed';
  }
}

/**
 * Get Tailwind CSS classes for inline element types (when used within text)
 */
function getInlineElementTypeClasses(elementType: string): string {
  switch (elementType) {
    case 'h1':
      return 'text-5xl font-extrabold text-foreground leading-[1.2]';
    case 'h2':
      return 'text-4xl font-bold text-foreground leading-[1.2]';
    case 'h3':
      return 'text-3xl font-semibold text-foreground leading-[1.3]';
    case 'h4':
      return 'text-2xl font-semibold text-foreground leading-[1.3]';
    case 'h5':
      return 'text-xl font-semibold text-foreground leading-[1.4]';
    case 'h6':
      return 'text-lg font-semibold text-foreground leading-[1.4]';
    case 'code':
      return 'font-mono text-base bg-secondary text-secondary-foreground px-2 py-0.5 rounded';
    case 'blockquote':
      return 'text-xl text-muted-foreground italic border-l-4 border-primary pl-6 py-2';
    default:
      return '';
  }
}

/**
 * Build inline formatting classes (bold, italic, underline)
 */
function getInlineFormattingClasses(
  bold?: boolean,
  italic?: boolean,
  underline?: boolean
): string {
  const classes: string[] = [];
  
  if (bold) classes.push('font-bold');
  if (italic) classes.push('italic');
  if (underline) classes.push('underline');
  
  return classes.join(' ');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Serialize a text node with inline children (formatted content)
 */
function serializeInlineChildren(node: TextNode): string {
  if (!hasInlineChildren(node)) {
    return escapeHtml(node.content || '');
  }

  return node.children!.map(child => {
    const formattingClasses = getInlineFormattingClasses(
      child.bold,
      child.italic,
      child.underline
    );
    
    const elementTypeClasses = child.elementType 
      ? getInlineElementTypeClasses(child.elementType)
      : '';
    
    // Build inline styles from the styles object
    let inlineStyles = '';
    if (child.styles) {
      inlineStyles = Object.entries(child.styles)
        .map(([key, value]) => {
          // Convert camelCase to kebab-case (fontSize -> font-size)
          const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `${kebabKey}: ${value}`;
        })
        .join('; ') + ';';
    }
    
    const allClasses = [elementTypeClasses, formattingClasses, child.className]
      .filter(Boolean)
      .join(' ');
    
    const content = escapeHtml(child.content || '');
    
    // If it's a link
    if (child.href) {
      const linkClasses = ['text-primary hover:underline cursor-pointer', allClasses]
        .filter(Boolean)
        .join(' ');
      const italicSpacing = child.italic ? 'inline-block pr-1' : '';
      const finalClasses = [linkClasses, italicSpacing].filter(Boolean).join(' ');
      const styleAttr = inlineStyles ? ` style="${inlineStyles}"` : '';
      return `<a href="${escapeHtml(child.href)}" target="_blank" rel="noopener noreferrer" class="${finalClasses}"${styleAttr}>${content}</a>`;
    }
    
    if (allClasses || inlineStyles) {
      // Add inline-block pr-1 for italic text to prevent overlapping
      const italicSpacing = child.italic ? 'inline-block pr-1' : '';
      const finalClasses = [allClasses, italicSpacing].filter(Boolean).join(' ');
      const classAttr = finalClasses ? ` class="${finalClasses}"` : '';
      const styleAttr = inlineStyles ? ` style="${inlineStyles}"` : '';
      return `<span${classAttr}${styleAttr}>${content}</span>`;
    }
    
    return content;
  }).join('');
}

/**
 * Serialize a single text node to HTML
 */
function serializeTextNode(node: TextNode, indent: string = ''): string {
  const { type, attributes } = node;
  
  // Handle BR elements
  if (type === 'br') {
    return `${indent}<br />\n`;
  }
  
  // Handle image nodes
  if (type === 'img') {
    const src = attributes?.src as string || '';
    const alt = attributes?.alt as string || '';
    const caption = node.content || '';
    
    let html = `${indent}<figure class="mb-4">\n`;
    html += `${indent}  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="h-auto rounded-lg object-cover max-h-[600px]" style="width: auto; margin: auto;" />\n`;
    
    if (caption) {
      html += `${indent}  <figcaption class="text-sm text-muted-foreground text-center mt-3 italic">${escapeHtml(caption)}</figcaption>\n`;
    }
    
    html += `${indent}</figure>\n`;
    return html;
  }
  
  // Get block-level classes
  const blockClasses = getBlockTypeClasses(type);
  
  // Get custom className from attributes
  const customClassName = attributes?.className as string || '';
  
  // Check if className is a hex color (starts with #)
  const isHexColor = typeof customClassName === 'string' && customClassName.startsWith('#');
  const textColor = isHexColor ? customClassName : '';
  const className = isHexColor ? '' : customClassName;
  
  // Combine all classes
  const allClasses = [blockClasses, className]
    .filter(Boolean)
    .join(' ');
  
  // Get backgroundColor from attributes
  const backgroundColor = attributes?.backgroundColor as string | undefined;
  
  // Build inline styles
  const styles: string[] = [];
  if (backgroundColor) {
    styles.push(`background-color: ${backgroundColor}`);
  }
  if (textColor) {
    styles.push(`color: ${textColor}`);
  }
  
  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')};"` : '';
  
  // Get content (with inline formatting if present)
  const content = serializeInlineChildren(node);
  
  // Check if the block is empty (no content and no inline children with content)
  const isEmpty = !content || content.trim() === '';
  
  // If empty, render as <br/> tag
  if (isEmpty) {
    return `${indent}<br />\n`;
  }
  
  // Build the HTML element
  const classAttr = allClasses ? ` class="${allClasses}"` : '';
  
  // Use appropriate HTML tag
  const tag = type === 'code' ? 'code' : type;
  
  return `${indent}<${tag}${classAttr}${styleAttr}>${content}</${tag}>\n`;
}

/**
 * Serialize a table node to HTML
 */
function serializeTableNode(node: StructuralNode | ContainerNode, indent: string = ''): string {
  // This function handles table, thead, tbody, tr, th, td nodes
  const tag = node.type;
  
  if (tag === 'table') {
    let html = `${indent}<table class="border-collapse border border-border w-full">\n`;
    
    // Serialize children (thead, tbody)
    for (const child of node.children) {
      if (isStructuralNode(child)) {
        html += serializeTableNode(child, indent + '  ');
      }
    }
    
    html += `${indent}</table>\n`;
    return html;
  } else if (tag === 'thead') {
    let html = `${indent}<thead>\n`;
    
    // Serialize children (tr)
    for (const child of node.children) {
      if (isStructuralNode(child)) {
        html += serializeTableNode(child, indent + '  ');
      }
    }
    
    html += `${indent}</thead>\n`;
    return html;
  } else if (tag === 'tbody') {
    let html = `${indent}<tbody>\n`;
    
    // Serialize children (tr)
    for (const child of node.children) {
      if (isStructuralNode(child)) {
        html += serializeTableNode(child, indent + '  ');
      }
    }
    
    html += `${indent}</tbody>\n`;
    return html;
  } else if (tag === 'tr') {
    let html = `${indent}<tr>\n`;
    
    // Serialize children (th, td)
    for (const child of node.children) {
      if (isTextNode(child)) {
        const cellNode = child as TextNode;
        const cellTag = cellNode.type; // 'th' or 'td'
        const content = escapeHtml(cellNode.content || '');
        const cellClass = cellTag === 'th' 
          ? 'border border-border bg-muted/50 p-2 font-semibold text-left min-w-[100px]'
          : 'border border-border p-2';
        html += `${indent}  <${cellTag} class="${cellClass}">${content}</${cellTag}>\n`;
      }
    }
    
    html += `${indent}</tr>\n`;
    return html;
  }
  
  return '';
}

/**
 * Serialize a container node to HTML (recursive)
 */
function serializeContainerNode(node: ContainerNode, indent: string = ''): string {
  // Check if this is a table wrapper container
  const firstChild = node.children[0];
  const isTableWrapper = firstChild?.type === 'table';
  
  if (isTableWrapper && isStructuralNode(firstChild)) {
    // Serialize the table directly
    return serializeTableNode(firstChild, indent);
  }

  // Check if this is a flex container for images
  const layoutType = node.attributes?.layoutType as string | undefined;
  const isFlexContainer = layoutType === 'flex';
  const gap = node.attributes?.gap as string | undefined;
  const flexWrap = node.attributes?.flexWrap as string | undefined;
  
  // Determine container type and classes
  const listTypeFromAttribute = node.attributes?.listType as string | undefined;
  const listType = listTypeFromAttribute || 
    (isTextNode(firstChild) && (firstChild as TextNode).type === 'li' ? 'ol' : undefined);
  const isListContainer = !!listType;
  
  // Get custom className from attributes
  const customClassName = node.attributes?.className as string || '';
  
  // Build container classes matching the preview
  let containerClasses = isFlexContainer
    ? `flex flex-row gap-${gap || '4'} items-start ${flexWrap === 'wrap' ? 'flex-wrap items-center' : ''}`
    : isListContainer
    ? `list-none pl-0 ml-6`
    : `nested-container border-l-2 border-border/50 pl-4 ml-2`;
  
  // Add custom classes
  if (customClassName) {
    containerClasses = `${containerClasses} ${customClassName}`.trim();
  }
  
  // Get backgroundColor from attributes
  const backgroundColor = node.attributes?.backgroundColor as string | undefined;
  
  // Build inline styles
  const styles: string[] = [];
  if (backgroundColor) {
    styles.push(`background-color: ${backgroundColor}`);
  }
  
  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')};"` : '';
  
  // Use ul/ol for list containers, div for regular/flex containers
  const containerTag = listType === 'ul' ? 'ul' : listType === 'ol' ? 'ol' : 'div';
  
  let html = `${indent}<${containerTag} class="${containerClasses}"${styleAttr}>\n`;
  
  // Recursively serialize children
  let i = 0;
  while (i < node.children.length) {
    const child = node.children[i];
    
    if (isTextNode(child)) {
      const textNode = child as TextNode;
      
      // For flex containers, wrap each child in a flex item div
      if (isFlexContainer) {
        html += `${indent}  <div class="flex-1 min-w-[280px] max-w-full">\n`;
        html += serializeTextNode(textNode, indent + '    ');
        html += `${indent}  </div>\n`;
        i++;
      }
      // Check if this is the start of a list (and not already in a list container)
      else if (textNode.type === 'li' && !isListContainer) {
        // Start ordered list
        html += `${indent}  <ol class="list-decimal list-inside space-y-1">\n`;
        
        // Add all consecutive list items
        while (i < node.children.length) {
          const listItem = node.children[i];
          if (isTextNode(listItem) && (listItem as TextNode).type === 'li') {
            const content = serializeInlineChildren(listItem as TextNode);
            const isEmpty = !content || content.trim() === '';
            
            if (!isEmpty) {
              const liIndent = indent + '    ';
              const liClasses = getBlockTypeClasses('li');
              html += `${liIndent}<li class="${liClasses}">${content}</li>\n`;
            }
            i++;
          } else {
            break;
          }
        }
        
        // Close ordered list
        html += `${indent}  </ol>\n`;
      } else {
        // Regular text node
        html += serializeTextNode(textNode, indent + '  ');
        i++;
      }
    } else if (isContainerNode(child)) {
      // For flex containers, wrap nested containers in flex items
      if (isFlexContainer) {
        html += `${indent}  <div class="flex-1 min-w-[280px] max-w-full">\n`;
        html += serializeContainerNode(child as ContainerNode, indent + '    ');
        html += `${indent}  </div>\n`;
        i++;
      } else {
        // Nested container - recurse!
        html += serializeContainerNode(child as ContainerNode, indent + '  ');
        i++;
      }
    } else {
      i++;
    }
  }
  
  html += `${indent}</${containerTag}>\n`;
  return html;
}

/**
 * Serialize any editor node (TextNode or ContainerNode) to HTML
 */
function serializeEditorNode(node: EditorNode, indent: string = ''): string {
  if (isContainerNode(node)) {
    return serializeContainerNode(node as ContainerNode, indent);
  }
  return serializeTextNode(node as TextNode, indent);
}

/**
 * Serialize the entire container to HTML
 * 
 * @param container - The root container node from editor state
 * @param options - Serialization options
 * @returns HTML string with Tailwind classes
 * 
 * @example
 * ```typescript
 * const html = serializeToHtml(state.container);
 *
 * // Output:
 * // <div class="editor-content">
 * //   <h1 class="text-5xl font-extrabold">Title</h1>
 * //   <p class="text-lg"><span class="font-bold">Bold text</span></p>
 * // </div>
 * ```
 */
export function serializeToHtml(
  container: ContainerNode,
  options: {
    wrapperClass?: string;
    includeWrapper?: boolean;
    indent?: string;
  } = {}
): string {
  const {
    wrapperClass = 'editor-content',
    includeWrapper = true,
    indent = '  ',
  } = options;
  
  let html = '';
  
  // Add wrapper div if requested
  if (includeWrapper) {
    html += `<div class="${wrapperClass}">\n`;
  }
  
  // Serialize each child node, grouping consecutive list items and handling containers
  let i = 0;
  while (i < container.children.length) {
    const child = container.children[i];
    
    if (isTextNode(child)) {
      const textNode = child as TextNode;
      
      // Check if this is the start of a list
      if (textNode.type === 'li') {
        // Start ordered list
        html += `${includeWrapper ? indent : ''}<ol class="list-decimal list-inside space-y-1">\n`;
        
        // Add all consecutive list items
        while (i < container.children.length) {
          const listItem = container.children[i];
          if (isTextNode(listItem) && (listItem as TextNode).type === 'li') {
            const content = serializeInlineChildren(listItem as TextNode);
            const isEmpty = !content || content.trim() === '';
            
            if (!isEmpty) {
              const liIndent = includeWrapper ? indent + '  ' : '  ';
              const liClasses = getBlockTypeClasses('li');
              html += `${liIndent}<li class="${liClasses}">${content}</li>\n`;
            }
            i++;
          } else {
            break;
          }
        }
        
        // Close ordered list
        html += `${includeWrapper ? indent : ''}</ol>\n`;
      } else {
        // Regular text node (not a list item)
        html += serializeTextNode(textNode, includeWrapper ? indent : '');
        i++;
      }
    } else if (isContainerNode(child)) {
      // Nested container - recurse!
      html += serializeContainerNode(child as ContainerNode, includeWrapper ? indent : '');
      i++;
    } else {
      i++;
    }
  }
  
  // Close wrapper div
  if (includeWrapper) {
    html += `</div>\n`;
  }
  
  return html;
}

/**
 * Serialize to HTML without wrapper div
 */
export function serializeToHtmlFragment(container: ContainerNode): string {
  return serializeToHtml(container, { includeWrapper: false, indent: '' });
}

/**
 * Serialize to HTML with custom wrapper class
 */
export function serializeToHtmlWithClass(
  container: ContainerNode,
  wrapperClass: string
): string {
  return serializeToHtml(container, { wrapperClass });
}


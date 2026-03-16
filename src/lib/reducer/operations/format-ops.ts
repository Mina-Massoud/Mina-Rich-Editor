/**
 * Mina Rich Editor - Formatting Operations
 *
 * Handlers for inline formatting actions extracted from the main reducer.
 *
 * @packageDocumentation
 */

import { EditorState, TextNode, isTextNode, hasInlineChildren } from '../../types';
import { findNodeById, updateNodeById } from '../../utils/tree-operations';
import { mergeAdjacentTextNodes } from '../../utils/inline-formatting';
import { applyToSelectionRange, getInlineChildren } from '../selection-range';
import { addToHistory, getCurrentContainer } from './shared';

export function handleApplyInlineElementType(
  state: EditorState,
  payload: { elementType: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li' | 'blockquote' }
): EditorState {
  const { elementType } = payload;

  if (!state.currentSelection) {
    return state;
  }

  const { nodeId, start, end } = state.currentSelection;
  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, undefined);
  const newChildren = mergeAdjacentTextNodes(applyToSelectionRange(children, start, end, (child) => ({
    ...child,
    elementType,
  })));

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

export function handleToggleFormat(
  state: EditorState,
  payload: { format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' }
): EditorState {
  const { format } = payload;

  if (!state.currentSelection) {
    return state;
  }

  const { nodeId, start, end, formats } = state.currentSelection;
  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const isActive = formats[format];
  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, state.currentSelection.text);

  const newChildren = mergeAdjacentTextNodes(applyToSelectionRange(children, start, end, (child) => ({
    ...child,
    bold: format === 'bold' ? !isActive : child.bold,
    italic: format === 'italic' ? !isActive : child.italic,
    underline: format === 'underline' ? !isActive : child.underline,
    strikethrough: format === 'strikethrough' ? !isActive : child.strikethrough,
    code: format === 'code' ? !isActive : child.code,
  })));

  // Ensure there's always a text node at the end to allow cursor escape
  const lastChild = newChildren[newChildren.length - 1];
  if (lastChild && (lastChild.bold || lastChild.italic || lastChild.underline || lastChild.strikethrough || lastChild.code || lastChild.elementType)) {
    newChildren.push({ content: '\u00A0' });
  }

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      currentSelection: {
        ...state.currentSelection,
        formats: { ...state.currentSelection.formats, [format]: !isActive },
      },
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

export function handleApplyCustomClass(
  state: EditorState,
  payload: { className: string }
): EditorState {
  const { className } = payload;

  if (!state.currentSelection) {
    return state;
  }

  const { nodeId, start, end } = state.currentSelection;
  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, state.currentSelection.text);
  const newChildren = mergeAdjacentTextNodes(applyToSelectionRange(children, start, end, (child) => {
    const existingClasses = (child.className || '').split(' ').filter(Boolean);
    const newClasses = className.split(' ').filter(Boolean);
    const mergedClassName = [...new Set([...existingClasses, ...newClasses])].join(' ').trim();
    return { ...child, className: mergedClassName || undefined };
  }));

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

export function handleApplyInlineStyle(
  state: EditorState,
  payload: { property: string; value: string }
): EditorState {
  const { property, value } = payload;

  if (!state.currentSelection) {
    return state;
  }

  const { nodeId, start, end } = state.currentSelection;
  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, state.currentSelection.text);
  const newChildren = mergeAdjacentTextNodes(applyToSelectionRange(children, start, end, (child) => ({
    ...child,
    styles: { ...child.styles, [property]: value },
  })));

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

export function handleApplyLink(
  state: EditorState,
  payload: { href: string }
): EditorState {
  const { href } = payload;

  if (!state.currentSelection) {
    return state;
  }

  const { nodeId, start, end } = state.currentSelection;
  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, state.currentSelection.text);
  const newChildren = mergeAdjacentTextNodes(applyToSelectionRange(children, start, end, (child) => ({
    ...child,
    href,
  })));

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

export function handleReplaceSelectionText(
  state: EditorState,
  payload: { nodeId: string; start: number; end: number; newText: string }
): EditorState {
  const { nodeId, start, end, newText } = payload;

  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, undefined);

  // Replace the selected range with newText.
  // Walk the children to find overlapping segments, replace them with the new text.
  const result: import('../../types').InlineText[] = [];
  let currentPos = 0;
  let replaced = false;

  for (const child of children) {
    const childLength = (child.content || '').length;
    const childStart = currentPos;
    const childEnd = currentPos + childLength;

    if (childEnd <= start || childStart >= end) {
      // No overlap — keep as is
      result.push({ ...child });
    } else {
      // There's overlap
      const overlapStart = Math.max(childStart, start);
      const overlapEnd = Math.min(childEnd, end);

      // Before overlap
      if (childStart < overlapStart) {
        result.push({
          ...child,
          content: child.content!.substring(0, overlapStart - childStart),
        });
      }

      // Insert replacement text only once (at first overlap)
      if (!replaced) {
        result.push({ content: newText });
        replaced = true;
      }

      // After overlap
      if (childEnd > overlapEnd) {
        result.push({
          ...child,
          content: child.content!.substring(overlapEnd - childStart),
        });
      }
    }

    currentPos = childEnd;
  }

  const newChildren = mergeAdjacentTextNodes(result);

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      currentSelection: null,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

export function handleReplaceSelectionWithInlines(
  state: EditorState,
  payload: { nodeId: string; start: number; end: number; children: import('../../types').InlineText[] }
): EditorState {
  const { nodeId, start, end, children: newInlines } = payload;

  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, undefined);

  // Replace the selected range with the InlineText[] array.
  // Same algorithm as handleReplaceSelectionText but splices in full InlineText[] instead of plain text.
  const result: import('../../types').InlineText[] = [];
  let currentPos = 0;
  let replaced = false;

  for (const child of children) {
    const childLength = (child.content || '').length;
    const childStart = currentPos;
    const childEnd = currentPos + childLength;

    if (childEnd <= start || childStart >= end) {
      // No overlap — keep as is
      result.push({ ...child });
    } else {
      // There's overlap
      const overlapStart = Math.max(childStart, start);
      const overlapEnd = Math.min(childEnd, end);

      // Before overlap
      if (childStart < overlapStart) {
        result.push({
          ...child,
          content: child.content!.substring(0, overlapStart - childStart),
        });
      }

      // Insert replacement inlines only once (at first overlap)
      if (!replaced) {
        result.push(...newInlines);
        replaced = true;
      }

      // After overlap
      if (childEnd > overlapEnd) {
        result.push({
          ...child,
          content: child.content!.substring(overlapEnd - childStart),
        });
      }
    }

    currentPos = childEnd;
  }

  const newChildren = mergeAdjacentTextNodes(result);

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      currentSelection: null,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

export function handleRemoveLink(
  state: EditorState,
  payload: Record<string, never>
): EditorState {
  void payload;

  if (!state.currentSelection) {
    return state;
  }

  const { nodeId, start, end } = state.currentSelection;
  const currentContainer = getCurrentContainer(state);
  const node = findNodeById(currentContainer, nodeId) as TextNode | undefined;

  if (!node || !isTextNode(node)) {
    return state;
  }

  const children = getInlineChildren(node.children, hasInlineChildren(node), node.content, state.currentSelection.text);
  const newChildren = mergeAdjacentTextNodes(applyToSelectionRange(children, start, end, (child) => ({
    ...child,
    href: undefined,
  })));

  const newContainer = updateNodeById(currentContainer, nodeId, () => ({
    content: undefined,
    children: newChildren,
  })) as import('../../types').ContainerNode;

  return addToHistory(
    {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
    },
    newContainer
  );
}

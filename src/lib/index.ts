/**
 * Mina Rich Editor
 * 
 * A flexible, TypeScript-first rich text editor library built with React.
 * Features a JSON-based document model, immutable state management,
 * and extensible plugin architecture.
 * 
 * @packageDocumentation
 * 
 * @example Basic Usage
 * ```tsx
 * import { EditorProvider, useEditor, EditorActions } from 'mina-rich-editor';
 * 
 * function App() {
 *   return (
 *     <EditorProvider>
 *       <MyEditor />
 *     </EditorProvider>
 *   );
 * }
 * 
 * function MyEditor() {
 *   const [state, dispatch] = useEditor();
 *   
 *   const addParagraph = () => {
 *     dispatch(EditorActions.insertNode(
 *       { id: 'p-new', type: 'p', content: 'Hello!' },
 *       state.container.id,
 *       'append'
 *     ));
 *   };
 *   
 *   return <button onClick={addParagraph}>Add Paragraph</button>;
 * }
 * ```
 */

// ============================================================================
// Types and Interfaces
// ============================================================================
export type {
  NodeType,
  NodeAttributes,
  BaseNode,
  TextNode,
  ContainerNode,
  StructuralNode,
  EditorNode,
  EditorState,
  SelectionInfo,
  InlineText,
  BlockLine,
  CoverImage,
} from './types';

export { isContainerNode, isStructuralNode, isTextNode, hasInlineChildren, getNodeTextContent } from './types';

// ============================================================================
// Actions
// ============================================================================
export type {
  UpdateNodeAction,
  UpdateAttributesAction,
  UpdateContentAction,
  DeleteNodeAction,
  InsertNodeAction,
  MoveNodeAction,
  DuplicateNodeAction,
  ReplaceContainerAction,
  ResetAction,
  BatchAction,
  EditorAction,
} from './reducer/actions';

export { EditorActions } from './reducer/actions';

// ============================================================================
// Reducer
// ============================================================================
export { editorReducer, createInitialState } from './reducer/editor-reducer';

// ============================================================================
// Context and Hooks (Legacy - for gradual migration)
// ============================================================================
export {
  EditorProvider,
  useEditorState,
  useEditorDispatch,
  useEditor,
  useEditorSelector,
  useNode,
  useIsNodeActive,
  useActiveNodeId,
  useContainerChildrenIds,
  useSelectionManager,
  useSelection,
} from './context/EditorContext';

export type { EditorProviderProps } from './context/EditorContext';

// ============================================================================
// Zustand Store (New - Optimized for Performance)
// ============================================================================
export {
  useEditorStore,
  useZustandNode,
  useZustandIsNodeActive,
  useZustandActiveNodeId,
  useZustandContainerChildrenIds,
  useZustandContainerChildren,
  useZustandDispatch,
  useZustandCoverImage,
  useZustandCanUndo,
  useZustandCanRedo,
  useZustandEditorState,
} from './store/editor-store';

export type { EditorStore } from './store/editor-store';

// ============================================================================
// Utilities
// ============================================================================
export {
  findNodeById,
  findParentById,
  updateNodeById,
  deleteNodeById,
  insertNode,
  moveNode,
  cloneNode,
  traverseTree,
  validateTree,
} from './utils/tree-operations';

export type { InsertPosition } from './utils/tree-operations';

export {
  splitTextAtSelection,
  convertToInlineFormat,
  applyFormatting,
  removeFormatting,
  mergeAdjacentTextNodes,
  getFormattingAtPosition,
} from './utils/inline-formatting';

export {
  serializeToHtml,
  serializeToHtmlFragment,
  serializeToHtmlWithClass,
} from './utils/serialize-to-html';

export {
  parseMarkdownTable,
  isMarkdownTable,
} from './utils/markdown-table-parser';

export {
  setupDragAutoScroll,
  useDragAutoScroll,
} from './utils/drag-auto-scroll';

export type { AutoScrollConfig } from './utils/drag-auto-scroll';

// ============================================================================
// Tailwind Classes Utilities
// ============================================================================
export {
  tailwindClasses,
  popularClasses,
  searchTailwindClasses,
  getAllClasses,
} from './tailwind-classes';

export type { TailwindClassGroup } from './tailwind-classes';

// ============================================================================
// Demo Content
// ============================================================================
export { createDemoContent } from './demo-content';
export { createEmptyContent } from './empty-content';

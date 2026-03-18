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
// CSS Theming Layer
// ============================================================================
// Base styles and theme presets are auto-imported when using the Editor
// component installed via the shadcn registry. No manual CSS import needed.
//
// Every visual token is a CSS variable that can be overridden per-scope
// without touching Tailwind or forking the library:
//
//   .mina-editor {
//     --mina-font-body: 'Inter', sans-serif;
//     --mina-color-primary: #7c3aed;
//     --mina-blockquote-border-color: #7c3aed;
//   }
//
// Dark mode is handled automatically when a `.dark` class is on an ancestor
// or when `data-theme="dark"` is set on the editor wrapper element.
//
// Theme presets — add the theme class to your editor wrapper:
//   <div className="mina-editor theme-notion">
//   <div className="mina-editor theme-minimal">
//   <div className="mina-editor theme-github">

// ============================================================================
// Types and Interfaces
// ============================================================================
export type {
  NodeType,
  BuiltInNodeType,
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
  TextDirection,
  HistoryOperation,
  HistoryEntry,
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
  ReplaceSelectionWithInlinesAction,
} from './reducer/actions';

export { EditorActions } from './reducer/actions';

// ============================================================================
// Reducer
// ============================================================================
export { editorReducer, createInitialState } from './reducer/editor-reducer';

// ============================================================================
// Zustand Store and Hooks
// ============================================================================
export {
  EditorProvider,
  useEditorState,
  useEditorDispatch,
  useBlockNode,
  useIsNodeActive,
  useActiveNodeId,
  useContainerChildrenIds,
  useContainer,
  useSelectionManager,
  useSelection,
  useEditorStoreInstance,
  useExtensionManager,
} from './store/editor-store';

export type { EditorProviderProps } from './store/editor-store';

// ============================================================================
// CMS Integration API
// ============================================================================
export { useEditorAPI, type EditorAPI } from '../hooks/useEditorAPI';


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
  buildNodeMap,
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
  generateId,
  resetIdCounter,
} from './utils/id-generator';

export {
  serializeToHtml,
  serializeToHtmlFragment,
  serializeToHtmlWithClass,
} from './utils/serialize-to-html';

export {
  serializeToSemanticHtml,
  type SemanticHtmlOptions,
} from './utils/serialize-semantic-html';

export {
  parseMarkdownTable,
  isMarkdownTable,
} from './utils/markdown-table-parser';

export {
  serializeToMarkdown,
} from './utils/serialize-markdown';

export {
  parseMarkdownToNodes,
} from './utils/parse-markdown';

export {
  parseHtmlToNodes,
  parsePlainTextToNodes,
} from './utils/html-to-nodes';

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
// Editor Components
// ============================================================================
export { Editor } from '../components/Editor';
export { CompactEditor } from '../components/CompactEditor';
export type { CompactEditorProps } from '../components/CompactEditor';
export { CompactToolbar } from '../components/CompactToolbar';
export type { CompactToolbarProps } from '../components/CompactToolbar';

// ============================================================================
// AI Integration
// ============================================================================
export type {
  AIProvider,
  AIStreamOptions,
  AIConfig,
} from './ai/types';

export { createOpenAIProvider } from './ai/openai-provider';
export type { OpenAIProviderOptions } from './ai/openai-provider';

export { createAnthropicProvider } from './ai/anthropic-provider';
export type { AnthropicProviderOptions } from './ai/anthropic-provider';

export { createGeminiProvider } from './ai/gemini-provider';
export type { GeminiProviderOptions } from './ai/gemini-provider';

export { streamToBlocks, parseInlineMarkdown, hasInlineFormatting } from './ai/stream-to-blocks';

export { useEditorAI } from '../hooks/useEditorAI';
export type { UseEditorAIOptions, UseEditorAIReturn } from '../hooks/useEditorAI';

export { AICommandMenu } from '../components/AICommandMenu';
export type { AICommandMenuProps } from '../components/AICommandMenu';

// ============================================================================
// Demo Content
// ============================================================================
export { createDemoContent } from './demo-content';
export { createEmptyContent } from './empty-content';

// ============================================================================
// Collaboration (opt-in — requires yjs + y-websocket peer deps)
// ============================================================================
export type {
  CollabOptions,
  CollabState,
  CollabUser,
} from './collaboration/types';
export { REMOTE_ORIGIN } from './collaboration/types';
export type { AwarenessManager } from './collaboration/awareness';
export { createAwarenessManager } from './collaboration/awareness';
export {
  applyOperationToYDoc,
  syncYDocToStore,
  initYDocFromContainer,
} from './collaboration/y-binding';
export { useCollaboration } from '../hooks/useCollaboration';
export { CollaborationProvider, useCollaborationState } from '../components/CollaborationProvider';
export type { CollaborationProviderProps } from '../components/CollaborationProvider';
export { RemoteCursor } from '../components/RemoteCursor';
export type { RemoteCursorProps } from '../components/RemoteCursor';

// ============================================================================
// Extension System
// ============================================================================
export {
  Extension, Node, Mark, ExtensionManager, CommandManager, CommandChain, StarterKit,
  // Built-in nodes
  Paragraph, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Blockquote, CodeBlock, BulletList, OrderedList,
  HorizontalRule, Image as ImageExtension, Video as VideoExtension, Table as TableExtension, Divider,
  // Built-in marks
  Bold, Italic, Underline, Strikethrough, InlineCode, Link as LinkExtension,
} from './extensions';
export type {
  ExtensionConfig,
  NodeExtensionConfig,
  MarkExtensionConfig,
  ResolvedExtension,
  ResolvedNodeExtension,
  ResolvedMarkExtension,
  AnyResolvedExtension,
  ExtensionContext,
  CommandContext,
  CommandFunction,
  ShortcutHandler,
  InputRule,
  SlashCommand,
  ParseRule,
  AttributeSpec,
  BlockRenderProps,
} from './extensions';

import { createInitialState } from '@/lib/reducer/editor-reducer';
import { editorReducer } from '@/lib/reducer/editor-reducer';
import { EditorActions } from '@/lib/reducer/actions';
import { EditorState, EditorNode, TextNode, ContainerNode } from '@/lib/types';

/** Build EditorState with optional children */
export function createTestState(children?: EditorNode[]): EditorState {
  if (children) {
    return createInitialState({
      id: 'root',
      type: 'container',
      children,
    });
  }
  return createInitialState();
}

/** Build a ContainerNode with defaults */
export function createTestContainer(children?: EditorNode[]): ContainerNode {
  return {
    id: 'root',
    type: 'container',
    children: children || [
      { id: 'p-1', type: 'p', content: 'Hello world', attributes: {} } as TextNode,
    ],
  };
}

/** Build state with currentSelection set */
export function stateWithSelection(
  text: string,
  start: number,
  end: number,
  nodeId = 'p-1',
): EditorState {
  const state = createInitialState({
    id: 'root',
    type: 'container',
    children: [
      { id: 'h1-1', type: 'h1', content: 'Title' },
      { id: nodeId, type: 'p', content: text },
    ],
  });

  return editorReducer(
    state,
    EditorActions.setCurrentSelection({
      text: text.substring(start, end),
      start,
      end,
      nodeId,
      formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
    }),
  );
}

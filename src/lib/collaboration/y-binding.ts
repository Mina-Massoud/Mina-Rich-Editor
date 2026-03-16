/**
 * Mina Rich Editor - Y.js Binding
 *
 * Bridges Mina's operation-based state model and Y.js CRDTs.
 *
 * ## Data model inside the Y.Doc
 *
 * ```
 * yDoc.getMap('root')          // Y.Map  — mirrors ContainerNode
 *   .get('id')                 // string
 *   .get('type')               // 'container'
 *   .get('attributes')         // Y.Map (optional)
 *   .get('children')           // Y.Array<Y.Map>  — each child is a node
 * ```
 *
 * Every node (text, container, structural) is stored as a `Y.Map` with the
 * keys `id`, `type`, `attributes`, `content`, `children`, `lines`.
 * Only keys that carry a value are set, keeping the document lean.
 *
 * All `yjs` / `y-websocket` imports are **dynamic** so the base editor
 * bundle is never bloated when collaboration is unused.
 *
 * @packageDocumentation
 */

import type {
  ContainerNode,
  EditorNode,
  HistoryOperation,
  InlineText,
  BlockLine,
  NodeAttributes,
} from '../types';
import { REMOTE_ORIGIN } from './types';

// ─── Lazy Y.js loader ────────────────────────────────────────────────────────

/**
 * The Y.js module type. Typed as `any` to avoid hard-dependency on yjs
 * type declarations at compile time (yjs is an optional peer dep).
 */
type YModule = any;
let _Y: YModule | null = null;

/**
 * Lazily load the `yjs` module. Throws a clear message when the peer
 * dependency is not installed.
 */
async function getY(): Promise<YModule> {
  if (_Y) return _Y;
  try {
    _Y = await import('yjs');
    return _Y;
  } catch {
    throw new Error(
      '[mina-editor] Collaboration requires "yjs" as a peer dependency. ' +
        'Install it with: npm install yjs y-websocket'
    );
  }
}

// Re-export the loader so other modules can get Y without duplicating logic.
export { getY };

// ─── Type aliases for readability ─────────────────────────────────────────────

/** Y.Doc instance (typed as `any` to avoid hard dep on yjs declarations). */
type YDoc = any;
/** Y.Map instance. */
type YMap = any;
/** Y.Array instance. */
type YArray = any;

// ─── EditorNode -> Y.Map ──────────────────────────────────────────────────────

/**
 * Convert an `InlineText` segment to a plain JS object suitable for
 * storing inside a Y.Array.
 */
function inlineTextToPlain(inline: InlineText): Record<string, unknown> {
  const obj: Record<string, unknown> = { content: inline.content };
  if (inline.id) obj.id = inline.id;
  if (inline.bold) obj.bold = true;
  if (inline.italic) obj.italic = true;
  if (inline.underline) obj.underline = true;
  if (inline.strikethrough) obj.strikethrough = true;
  if (inline.code) obj.code = true;
  if (inline.elementType) obj.elementType = inline.elementType;
  if (inline.href) obj.href = inline.href;
  if (inline.className) obj.className = inline.className;
  if (inline.styles) obj.styles = inline.styles;
  return obj;
}

/**
 * Serialise a `BlockLine` to a plain object.
 */
function blockLineToPlain(line: BlockLine): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (line.content !== undefined) obj.content = line.content;
  if (line.children) obj.children = line.children.map(inlineTextToPlain);
  return obj;
}

/**
 * Populate a Y.Map (that is already integrated into a Y.Doc) with node data.
 * Y.js requires types to be part of a document before reading — so we must
 * first insert child Y.Map/Y.Array into the parent, THEN set their values.
 */
function populateYMap(Y: YModule, yMap: YMap, node: EditorNode): void {
  yMap.set('id', node.id);
  yMap.set('type', node.type);

  if (node.attributes) {
    const yAttrs = new Y.Map() as YMap;
    yMap.set('attributes', yAttrs); // integrate first
    for (const [k, v] of Object.entries(node.attributes)) {
      if (v !== undefined) yAttrs.set(k, v);
    }
  }

  const isStructural = ['container', 'table', 'thead', 'tbody', 'tr'].includes(node.type as string);

  // Container / structural nodes have children
  if (isStructural && 'children' in node && Array.isArray((node as ContainerNode).children)) {
    const yChildren = new Y.Array() as YArray;
    yMap.set('children', yChildren); // integrate first
    for (const child of (node as ContainerNode).children) {
      const yChild = new Y.Map() as YMap;
      yChildren.push([yChild]); // integrate child into array
      populateYMap(Y, yChild, child); // now populate it
    }
  }

  // TextNode fields
  if ('content' in node && (node as any).content !== undefined) {
    yMap.set('content', (node as any).content);
  }
  if (!isStructural && 'children' in node && Array.isArray((node as any).children)) {
    // Inline children for text nodes
    yMap.set('inlineChildren', (node as any).children.map(inlineTextToPlain));
  }
  if ('lines' in node && (node as any).lines) {
    yMap.set('lines', (node as any).lines.map(blockLineToPlain));
  }
}

/**
 * Convert a `Y.Map` node back into a plain Mina `EditorNode`.
 */
function yMapToNode(yMap: YMap): EditorNode {
  const type = yMap.get('type') as string;
  const id = yMap.get('id') as string;

  const yAttrs = yMap.get('attributes') as YMap | undefined;
  const attributes: NodeAttributes | undefined = yAttrs
    ? Object.fromEntries(yAttrs.entries())
    : undefined;

  // Container / structural types
  if (type === 'container' || type === 'table' || type === 'thead' || type === 'tbody' || type === 'tr') {
    const yChildren = yMap.get('children') as YArray | undefined;
    const children: EditorNode[] = [];
    if (yChildren) {
      yChildren.forEach((child: YMap) => {
        children.push(yMapToNode(child));
      });
    }
    return { id, type: type as any, children, ...(attributes ? { attributes } : {}) } as EditorNode;
  }

  // Text node
  const node: Record<string, unknown> = { id, type };
  if (attributes) node.attributes = attributes;

  const content = yMap.get('content');
  if (content !== undefined) node.content = content;

  const inlineChildren = yMap.get('inlineChildren');
  if (inlineChildren) node.children = inlineChildren;

  const lines = yMap.get('lines');
  if (lines) node.lines = lines;

  return node as unknown as EditorNode;
}

// ─── Apply local HistoryOperation -> Y.Doc ────────────────────────────────────

/**
 * Apply a Mina `HistoryOperation` to the Y.Doc, translating it into Y.js
 * mutations. All mutations are wrapped in a single `yDoc.transact()` so
 * they arrive at remote peers as one atomic update.
 *
 * @param yDoc  - The shared Y.Doc instance.
 * @param op    - The operation produced by the local reducer.
 */
export async function applyOperationToYDoc(
  yDoc: YDoc,
  op: HistoryOperation
): Promise<void> {
  const Y = await getY();
  const yRoot = yDoc.getMap('root') as YMap;

  yDoc.transact(() => {
    applyOpRecursive(Y, yRoot, op);
  }, REMOTE_ORIGIN);
}

/**
 * Internal recursive helper that performs the actual Y.js mutations.
 */
function applyOpRecursive(
  Y: YModule,
  yRoot: YMap,
  op: HistoryOperation
): void {
  switch (op.type) {
    case 'update_node': {
      const target = findYMapById(yRoot, op.id);
      if (!target) return;

      const changes = op.changes as Record<string, unknown>;
      for (const [key, value] of Object.entries(changes)) {
        if (key === 'attributes' && typeof value === 'object' && value !== null) {
          let yAttrs = target.get('attributes') as YMap | undefined;
          if (!yAttrs) {
            yAttrs = new Y.Map() as YMap;
            target.set('attributes', yAttrs);
          }
          for (const [ak, av] of Object.entries(value as Record<string, unknown>)) {
            if (av === undefined) {
              yAttrs.delete(ak);
            } else {
              yAttrs.set(ak, av);
            }
          }
        } else if (key === 'children' && Array.isArray(value)) {
          // Could be container children or inline children
          const nodeType = target.get('type') as string;
          if (nodeType === 'container' || nodeType === 'table' || nodeType === 'thead' || nodeType === 'tbody' || nodeType === 'tr') {
            const yChildren = new Y.Array() as YArray;
            target.set('children', yChildren); // integrate first
            for (const child of value) {
              const yChild = new Y.Map() as YMap;
              yChildren.push([yChild]); // integrate child
              populateYMap(Y, yChild, child as EditorNode); // then populate
            }
          } else {
            // Inline children
            target.set('inlineChildren', value.map((c: InlineText) => inlineTextToPlain(c)));
          }
        } else if (key === 'lines' && Array.isArray(value)) {
          target.set('lines', value.map((l: BlockLine) => blockLineToPlain(l)));
        } else {
          target.set(key, value);
        }
      }
      break;
    }

    case 'delete_node': {
      deleteYMapById(yRoot, op.nodeId);
      break;
    }

    case 'insert_at_index': {
      const parent = findYMapById(yRoot, op.parentId);
      if (!parent) return;
      let yChildren = parent.get('children') as YArray | undefined;
      if (!yChildren) {
        yChildren = new Y.Array() as YArray;
        parent.set('children', yChildren);
      }
      const yNode = new Y.Map() as YMap;
      yChildren.insert(op.index, [yNode]); // integrate first
      populateYMap(Y, yNode, op.node);      // then populate
      break;
    }

    case 'replace_container': {
      // Clear existing keys from yRoot
      const keysToDelete: string[] = [];
      yRoot.forEach((_: unknown, key: string) => keysToDelete.push(key));
      for (const k of keysToDelete) yRoot.delete(k);
      // Populate yRoot directly from the container (yRoot is integrated)
      populateYMap(Y, yRoot, op.container);
      break;
    }

    case 'batch': {
      for (const subOp of op.operations) {
        applyOpRecursive(Y, yRoot, subOp);
      }
      break;
    }
  }
}

// ─── Y.Doc change -> Mina store ──────────────────────────────────────────────

/**
 * Reconstruct the full `ContainerNode` from the Y.Doc root and dispatch
 * a `REPLACE_CONTAINER` action into the Mina store.
 *
 * This is intentionally simple: Y.js guarantees convergence, so on every
 * remote update we rebuild the plain-JS tree from the authoritative Y.Doc.
 * The reducer's structural sharing ensures that only truly changed
 * sub-trees trigger React re-renders.
 *
 * @param dispatch - The Zustand store dispatch function.
 * @param yDoc     - The shared Y.Doc.
 */
export function syncYDocToStore(
  dispatch: (action: { type: string; payload?: unknown; _origin?: string }) => void,
  yDoc: YDoc
): void {
  const yRoot = yDoc.getMap('root') as YMap;
  if (!yRoot.get('id')) return; // Doc not yet initialised

  const container = yMapToNode(yRoot) as ContainerNode;
  dispatch({
    type: 'REPLACE_CONTAINER',
    payload: { container },
    _origin: REMOTE_ORIGIN,
  });
}

/**
 * Initialise the Y.Doc root map from a Mina `ContainerNode`.
 * Called once when the first client connects and the doc is empty.
 */
export async function initYDocFromContainer(
  yDoc: YDoc,
  container: ContainerNode
): Promise<void> {
  const Y = await getY();
  const yRoot = yDoc.getMap('root') as YMap;

  // Only initialise if the doc is empty
  if (yRoot.get('id')) return;

  yDoc.transact(() => {
    // Populate yRoot directly (it's already integrated in the doc)
    populateYMap(Y, yRoot, container);
  });
}

// ─── Y.Map tree traversal helpers ─────────────────────────────────────────────

/**
 * Find a `Y.Map` node by its `id` field, searching recursively through
 * the `children` Y.Array.
 */
function findYMapById(yMap: YMap, id: string): YMap | null {
  if (yMap.get('id') === id) return yMap;

  const yChildren = yMap.get('children');
  if (yChildren && typeof (yChildren as YArray).forEach === 'function') {
    let found: YMap | null = null;
    (yChildren as YArray).forEach((child: YMap) => {
      if (!found) {
        found = findYMapById(child, id);
      }
    });
    if (found) return found;
  }

  return null;
}

/**
 * Delete a node from the Y.Doc tree by its `id`.
 * Searches parent `children` arrays and splices the matching entry.
 */
function deleteYMapById(yMap: YMap, id: string): boolean {
  const yChildren = yMap.get('children');
  if (!yChildren || typeof (yChildren as YArray).forEach !== 'function') return false;

  const arr = yChildren as YArray;
  let idx = -1;
  arr.forEach((child: YMap, i: number) => {
    if (idx === -1 && child.get('id') === id) {
      idx = i;
    }
  });
  if (idx !== -1) {
    arr.delete(idx, 1);
    return true;
  }

  // Recurse
  let deleted = false;
  arr.forEach((child: YMap) => {
    if (!deleted) {
      deleted = deleteYMapById(child, id);
    }
  });
  return deleted;
}

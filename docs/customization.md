# Customization

Learn how to customize the Mina Rich Editor to fit your needs.

## Styling

The editor uses Tailwind CSS for styling. You can customize the appearance by:

### Custom CSS Classes

Add custom classes to nodes using the class popover in the editor toolbar.

```typescript
// Example: Adding custom styling to a paragraph
const customNode = {
  id: 'custom-p',
  type: 'p',
  content: 'Styled paragraph',
  attributes: {
    className: 'text-blue-600 font-bold bg-gray-100 p-4 rounded-lg'
  }
};
```

### Theme Customization

The editor supports both light and dark themes through the theme provider.

```tsx
import { ThemeProvider } from '@/components/ui/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="editor-theme">
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </ThemeProvider>
  );
}
```

## Custom Block Types

You can extend the editor with custom block types:

### 1. Define the Node Type

```typescript
// Add to your types
type CustomNodeType = 'custom-block';

interface CustomBlockNode extends BaseNode {
  type: 'custom-block';
  content: string;
  customData?: any;
}
```

### 2. Update the Reducer

```typescript
// Handle custom block in your reducer
case 'INSERT_CUSTOM_BLOCK':
  return insertNode(
    state,
    {
      id: generateId(),
      type: 'custom-block',
      content: action.content,
      customData: action.data
    },
    action.parentId,
    action.position
  );
```

### 3. Create Custom Renderer

```tsx
function CustomBlockRenderer({ node }: { node: CustomBlockNode }) {
  return (
    <div className="custom-block border-2 border-dashed border-blue-300 p-4">
      <h3>Custom Block</h3>
      <p>{node.content}</p>
      {node.customData && (
        <pre>{JSON.stringify(node.customData, null, 2)}</pre>
      )}
    </div>
  );
}
```

## Templates

Create custom templates for quick content insertion:

### Template Structure

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  coverImage: string;
  content: ContainerNode;
}
```

### Example Template

```typescript
const blogTemplate: Template = {
  id: 'blog-post',
  name: 'Blog Post',
  description: 'A standard blog post template',
  category: 'content',
  coverImage: '/templates/blog/blog-cover.jpg',
  content: {
    id: 'blog-container',
    type: 'container',
    children: [
      {
        id: 'title',
        type: 'h1',
        content: 'Your Blog Title Here',
        attributes: { className: 'text-4xl font-bold mb-4' }
      },
      {
        id: 'subtitle',
        type: 'p',
        content: 'A compelling subtitle that draws readers in...',
        attributes: { className: 'text-xl text-gray-600 mb-8' }
      },
      {
        id: 'content',
        type: 'p',
        content: 'Start writing your blog post content here...'
      }
    ]
  }
};
```

## Image Handling

Customize how images are uploaded and processed:

### Custom Upload Handler

```typescript
const handleImageUpload = async (file: File): Promise<string> => {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  // Upload to your service
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const { url } = await response.json();
  return url;
};
```

### Image Processing

```typescript
const processImage = async (file: File) => {
  // Resize image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = Math.min(img.width, 1200);
      canvas.height = (img.height * canvas.width) / img.width;
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

## Keyboard Shortcuts

Customize keyboard shortcuts by extending the key handler:

```typescript
const customKeyHandler = (e: KeyboardEvent, nodeId: string) => {
  // Custom shortcuts
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    // Open link dialog
    openLinkDialog(nodeId);
    return;
  }

  if (e.ctrlKey && e.shiftKey && e.key === 'L') {
    e.preventDefault();
    // Toggle code block
    toggleCodeBlock(nodeId);
    return;
  }

  // Fall back to default handler
  defaultKeyHandler(e, nodeId);
};
```

## Export Customization

Customize how content is exported:

### Custom HTML Export

```typescript
const customHtmlExport = (container: ContainerNode) => {
  return serializeToHtml(container, {
    // Custom class mappings
    classMap: {
      'h1': 'text-4xl font-bold mb-6',
      'p': 'mb-4 leading-relaxed',
      'blockquote': 'border-l-4 border-blue-500 pl-4 italic'
    },
    // Custom wrapper
    wrapper: (content) => `
      <article class="prose prose-lg max-w-none">
        ${content}
      </article>
    `
  });
};
```

### JSON Export with Metadata

```typescript
const exportWithMetadata = (state: EditorState) => {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    content: state.history[state.historyIndex],
    metadata: {
      wordCount: getWordCount(state.history[state.historyIndex]),
      readingTime: calculateReadingTime(state.history[state.historyIndex]),
      ...state.metadata
    }
  };
};
```


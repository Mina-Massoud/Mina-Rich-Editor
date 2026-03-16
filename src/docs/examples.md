# Examples

Common use cases and implementation examples for the Mina Rich Editor.

## Basic Blog Editor

A simple blog post editor with image upload support.

```tsx
import { useState } from 'react';
import { EditorProvider, Editor } from '@/components';
import { useToast } from '@/hooks/use-toast';

function BlogEditor() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const { url } = await response.json();
      return url;
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Could not upload image. Please try again.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Blog Post</h1>
      <EditorProvider>
        <Editor 
          onUploadImage={handleImageUpload}
          notionBased={true}
        />
      </EditorProvider>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <p>Uploading image...</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Read-Only Document Viewer

Display content in read-only mode with custom styling.

```tsx
import { EditorProvider, Editor } from '@/components';
import { createDemoContent } from '@/lib/demo-content';

function DocumentViewer({ documentId }: { documentId: string }) {
  const [document, setDocument] = useState(null);

  useEffect(() => {
    // Load document from API
    fetch(`/api/documents/${documentId}`)
      .then(res => res.json())
      .then(setDocument);
  }, [documentId]);

  if (!document) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <EditorProvider initialContainer={document.content}>
        <Editor readOnly={true} />
      </EditorProvider>
    </div>
  );
}
```

## Collaborative Editor

Basic setup for collaborative editing (requires backend integration).

```tsx
import { useEffect, useRef } from 'react';
import { EditorProvider, Editor, useEditor } from '@/components';
import { io, Socket } from 'socket.io-client';

function CollaborativeEditor({ roomId }: { roomId: string }) {
  const socketRef = useRef<Socket>();
  
  useEffect(() => {
    socketRef.current = io('/collaborative', {
      query: { roomId }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  return (
    <EditorProvider>
      <CollaborativeEditorInner socket={socketRef.current} />
    </EditorProvider>
  );
}

function CollaborativeEditorInner({ socket }: { socket?: Socket }) {
  const [state, dispatch] = useEditor();
  const lastChangeRef = useRef<string>();

  useEffect(() => {
    if (!socket) return;

    // Listen for changes from other users
    socket.on('editor-change', (change) => {
      if (change.id !== lastChangeRef.current) {
        dispatch(change.action);
      }
    });

    // Send changes to other users
    const handleChange = (newState: EditorState) => {
      const changeId = Date.now().toString();
      lastChangeRef.current = changeId;
      
      socket.emit('editor-change', {
        id: changeId,
        action: { type: 'REPLACE_CONTAINER', container: newState.history[newState.historyIndex] },
        roomId
      });
    };

    return () => {
      socket.off('editor-change');
    };
  }, [socket, dispatch]);

  return <Editor />;
}
```

## Custom Toolbar

Add custom buttons to the editor toolbar.

```tsx
import { EditorProvider, Editor, useEditor } from '@/components';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Link } from 'lucide-react';

function CustomToolbarEditor() {
  return (
    <EditorProvider>
      <div className="border rounded-lg overflow-hidden">
        <CustomToolbar />
        <Editor />
      </div>
    </EditorProvider>
  );
}

function CustomToolbar() {
  const [state, dispatch] = useEditor();

  const insertQuote = () => {
    dispatch({
      type: 'INSERT_NODE',
      node: {
        id: `quote-${Date.now()}`,
        type: 'blockquote',
        content: 'Enter your quote here...'
      },
      parentId: state.history[state.historyIndex].id,
      position: 'append'
    });
  };

  const insertCodeBlock = () => {
    dispatch({
      type: 'INSERT_NODE',
      node: {
        id: `code-${Date.now()}`,
        type: 'code',
        content: '// Your code here',
        attributes: { language: 'javascript' }
      },
      parentId: state.history[state.historyIndex].id,
      position: 'append'
    });
  };

  return (
    <div className="flex items-center gap-2 p-3 border-b bg-gray-50">
      <Button variant="ghost" size="sm">
        <Bold className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Italic className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Link className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-2" />
      <Button variant="ghost" size="sm" onClick={insertQuote}>
        Quote
      </Button>
      <Button variant="ghost" size="sm" onClick={insertCodeBlock}>
        Code
      </Button>
    </div>
  );
}
```

## Form Integration

Integrate the editor with form libraries like React Hook Form.

```tsx
import { useForm, Controller } from 'react-hook-form';
import { EditorProvider, Editor, useEditor } from '@/components';
import { Button } from '@/components/ui/button';

interface FormData {
  title: string;
  content: any; // Editor state
  tags: string[];
}

function EditorForm() {
  const { control, handleSubmit, setValue, watch } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
    // Submit to API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              className="w-full p-2 border rounded-md"
              placeholder="Enter title..."
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Content</label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <EditorProvider
              onChange={(state) => field.onChange(state)}
              initialState={field.value}
            >
              <div className="border rounded-md">
                <Editor />
              </div>
            </EditorProvider>
          )}
        />
      </div>

      <Button type="submit">Save Post</Button>
    </form>
  );
}
```

## Export and Import

Handle content export and import functionality.

```tsx
import { useState } from 'react';
import { EditorProvider, Editor, useEditor } from '@/components';
import { Button } from '@/components/ui/button';
import { serializeToHtml } from '@/lib/utils/serialize-to-html';

function ExportImportEditor() {
  const [exportedContent, setExportedContent] = useState('');

  return (
    <EditorProvider>
      <div className="space-y-4">
        <ExportImportControls onExport={setExportedContent} />
        <Editor />
        {exportedContent && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Exported HTML:</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
              {exportedContent}
            </pre>
          </div>
        )}
      </div>
    </EditorProvider>
  );
}

function ExportImportControls({ onExport }: { onExport: (content: string) => void }) {
  const [state, dispatch] = useEditor();

  const exportToHtml = () => {
    const html = serializeToHtml(state.history[state.historyIndex]);
    onExport(html);
  };

  const exportToJson = () => {
    const json = JSON.stringify(state.history[state.historyIndex], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        dispatch({
          type: 'REPLACE_CONTAINER',
          container: content
        });
      } catch (error) {
        console.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToHtml} variant="outline">
        Export HTML
      </Button>
      <Button onClick={exportToJson} variant="outline">
        Export JSON
      </Button>
      <div>
        <input
          type="file"
          accept=".json"
          onChange={importFromJson}
          className="hidden"
          id="import-json"
        />
        <Button asChild variant="outline">
          <label htmlFor="import-json" className="cursor-pointer">
            Import JSON
          </label>
        </Button>
      </div>
    </div>
  );
}
```


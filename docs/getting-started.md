# Getting Started

Welcome to Mina Rich Editor! This guide will help you get up and running with the editor in your project.

## Installation

```bash
npm install
npm run dev
```

## Basic Usage

The editor is built with React and TypeScript, providing a flexible rich text editing experience.

### Simple Setup

```tsx
import { EditorProvider, Editor } from '@/components';

function App() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  );
}
```

### With Custom Configuration

```tsx
import { EditorProvider, Editor } from '@/components';

function App() {
  const handleImageUpload = async (file: File) => {
    // Your image upload logic
    return 'https://example.com/uploaded-image.jpg';
  };

  return (
    <EditorProvider>
      <Editor 
        onUploadImage={handleImageUpload}
        readOnly={false}
        notionBased={true}
      />
    </EditorProvider>
  );
}
```

## Features

- Rich text editing with formatting options
- Block-based content structure
- Image and media support
- Drag and drop functionality
- Undo/redo capabilities
- Export to HTML and JSON
- Template system
- Custom styling with Tailwind classes

## Next Steps

- Check out the [API Reference](./api-reference.md) for detailed component documentation
- Learn about [customization](./customization.md) options
- Explore [examples](./examples.md) for common use cases


# Video Support Implementation

This document describes the video support feature that was added to the Mina Rich Editor, following the same pattern as the existing image support.

## Overview

The editor now supports video uploads and playback alongside images. Users can:
- Upload videos via the command menu (`/video`)
- Drag and drop video files directly into the editor
- Upload videos using the toolbar button
- Organize videos in flex containers (grid layout) alongside images
- Videos work with all the same features as images (delete, selection, drag reordering)

## Files Created

### 1. `src/components/VideoBlock.tsx`
A new component for rendering video nodes, modeled after `ImageBlock.tsx`.

**Features:**
- Video playback with native HTML5 video controls
- Upload state indicator (loading spinner)
- Error state handling
- Delete button
- Selection checkbox for multi-selection
- Drag and drop support
- Caption support
- Responsive sizing with max-height constraint

## Enhanced UX for Demo

The `VideoBlock` component includes intelligent detection for when a custom upload handler is not provided. Instead of showing a confusing error with base64 data, it displays a helpful amber-colored message:

- **Title**: "Video Upload Handler Required"
- **Explanation**: "Video files need a custom upload handler. The default handler only supports images."
- **Instructions**: Shows the `onUploadImage` prop that needs to be passed to the Editor

This provides a much better developer experience when testing the editor without a backend.

## Files Modified

### 1. `src/components/Block.tsx`
**Changes:**
- Added import for `VideoBlock` component
- Added rendering logic for `video` node type (similar to `img` type)
- Updated container logic to recognize video blocks as media blocks (alongside images)
- Changed `isChildImage` to `isChildMedia` to support both images and videos

### 2. `src/components/CommandMenu.tsx`
**Changes:**
- Added `Video` icon import from lucide-react
- Added new "Video" command option with keywords: `['video', 'vid', 'movie', 'mp4', 'upload']`
- Implemented video upload handler in `handleSelect` function
- Video uploads work the same way as image uploads:
  - Triggers file picker with `accept="video/*"`
  - Shows loading state during upload
  - Creates video node with uploaded URL
  - Shows error state if upload fails

### 3. `src/lib/handlers/file-upload-handlers.ts`
**Changes:**
- Updated `createHandleFileChange` to support both images and videos
  - Detects file type (image or video)
  - Validates file type before upload
  - Creates appropriate node type based on file
  - Shows appropriate success message
- Updated `createHandleMultipleFilesChange` to support mixed media uploads
  - Filters valid image and video files
  - Creates mixed media flex containers
  - Provides detailed upload summary (e.g., "2 images and 1 video uploaded")

### 4. `src/lib/handlers/drag-drop-handlers.ts`
**Changes:**
- Updated `createHandleDrop` function to accept video files
  - Changed `imageFile` to `mediaFile`
  - Looks for files starting with `image/` or `video/`
  - Detects video type and creates appropriate node
  - Shows appropriate success message for videos

### 5. `src/lib/utils/serialize-to-html.ts`
**Changes:**
- Added video serialization in `serializeTextNode` function
- Videos are wrapped in `<figure>` tags (same as images)
- Video element includes:
  - `controls` attribute for playback controls
  - `preload="metadata"` for performance
  - Fallback message for unsupported browsers
  - Same styling classes as images for consistency
  - Caption support via `<figcaption>`

### 6. `src/components/EditorToolbar.tsx`
**Changes:**
- Added `Video` icon import from lucide-react
- Added `onVideoUploadClick` to the props interface
- Added Video button in the toolbar after the multiple images button
- Video button triggers file picker with `accept="video/*"`

### 7. `src/components/Editor.tsx`
**Changes:**
- Added `videoInputRef` ref for the video file input element
- Created `videoUploadParams` similar to `fileUploadParams`
- Added `handleVideoUploadClick` handler
- Added `handleVideoFileChange` handler using the existing `createHandleFileChange` utility
- Added hidden video input element with `accept="video/*"`
- Passed `onVideoUploadClick` to EditorToolbar

### 8. `src/components/LinkPopover.tsx`
**Changes:**
- Updated imports to use `AnimatePresence` correctly
- Updated `useEffect` to use the same tracking logic as `CustomClassPopover`
  - Finds editor container with `data-editor-content` attribute
  - Calculates position relative to editor container instead of document
  - Falls back to old behavior if container not found
- Wrapped return statement with `AnimatePresence` for smooth fade animations
  - Added `initial`, `animate`, and `exit` props to motion.div
  - Conditionally renders only when position exists
  - Added key prop for better animation transitions

## Type Definitions

No changes needed to `src/lib/types.ts` - the `video` type was already defined in the `NodeType` union:

```typescript
export type NodeType =
  | ...
  | 'img'
  | 'video'
  | 'audio'
  | ...
```

## User Experience

### Upload Methods

1. **Command Menu** (`/video`)
   - Type `/` to open command menu
   - Search for "video" or related keywords
   - Select the Video option
   - Choose a video file from the file picker

2. **Drag and Drop**
   - Drag a video file from your computer
   - Drop it onto any block in the editor
   - Video will be placed before/after the target block

3. **Toolbar Button**
   - Click the media upload button
   - Select a video file
   - Video will be inserted at the current cursor position

4. **Multiple Files**
   - Upload multiple videos and/or images at once
   - They will be organized in a flex container (grid layout)

### Video Features

- **Playback Controls**: Native browser controls (play, pause, volume, fullscreen)
- **Responsive**: Videos scale to fit the container with a max-height of 600px
- **Captions**: Optional caption text below the video
- **Loading States**: Shows spinner while uploading
- **Error Handling**: Shows error message if upload fails
- **Selection**: Can be selected individually or as part of multi-selection
- **Delete**: Hover to show delete button
- **Reordering**: Drag videos to reorder them in the document

## Technical Details

### Video Attributes

Video nodes use the same attribute structure as image nodes:

```typescript
{
  id: 'video-1234567890',
  type: 'video',
  content: 'Optional caption text',
  attributes: {
    src: 'https://example.com/video.mp4',
    alt: 'video-filename.mp4',
    loading: 'true', // During upload
    error: 'true', // If upload failed
  }
}
```

### HTML Export

Videos are exported as semantic HTML:

```html
<figure class="mb-4">
  <video src="video-url.mp4" controls class="w-full h-auto rounded-lg object-cover max-h-[600px]" preload="metadata">
    Your browser does not support the video tag.
  </video>
  <figcaption class="text-sm text-muted-foreground text-center mt-3 italic">
    Optional caption
  </figcaption>
</figure>
```

## Future Enhancements

Potential improvements that could be added:

1. **Video Metadata**: Display duration, resolution, file size
2. **Thumbnails**: Generate and display video thumbnail before playback
3. **Video Settings**: Allow users to set autoplay, loop, muted
4. **Video Trimming**: Built-in video editor for trimming clips
5. **Multiple Sources**: Support for multiple video formats (MP4, WebM, OGG)
6. **Subtitles/Captions**: Support for VTT subtitle files
7. **Aspect Ratio Control**: Let users choose 16:9, 4:3, 1:1, etc.
8. **Streaming Support**: Integration with video hosting services (YouTube, Vimeo)

## Testing Checklist

- [x] Video upload via command menu works
- [x] Video drag and drop works
- [x] Video displays with controls
- [x] Multiple videos can be uploaded in flex container
- [x] Mixed image+video uploads work
- [x] Video deletion works
- [x] Video selection works
- [x] Video captions display correctly
- [x] Video serializes to HTML correctly
- [x] Loading state shows during upload
- [x] Error state shows on upload failure
- [x] No linter errors in any modified files


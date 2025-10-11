/**
 * Image Upload Utilities
 * 
 * Mock implementation for image upload functionality
 * In production, this would call your actual API endpoint
 */

/**
 * Mock image URLs for testing
 */
const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800&q=80',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Mock function to simulate image upload to server
 * 
 * @param file - The image file to upload
 * @returns Promise with upload result containing the image URL
 * 
 * @example
 * ```typescript
 * const result = await uploadImage(file);
 * if (result.success) {
 *
 * }
 * ```
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  // Simulate network delay (500ms - 1500ms)
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'File must be an image',
    };
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      success: false,
      error: 'Image must be smaller than 10MB',
    };
  }

  // Simulate 5% chance of upload failure for testing
  if (Math.random() < 0.05) {
    return {
      success: false,
      error: 'Upload failed. Please try again.',
    };
  }

  // Return a random mock image URL
  const randomIndex = Math.floor(Math.random() * MOCK_IMAGES.length);
  const url = MOCK_IMAGES[randomIndex];

  return {
    success: true,
    url,
  };
}

/**
 * In production, replace the above mock function with actual API call:
 * 
 * export async function uploadImage(file: File): Promise<UploadResult> {
 *   const formData = new FormData();
 *   formData.append('image', file);
 * 
 *   try {
 *     const response = await fetch('/api/upload', {
 *       method: 'POST',
 *       body: formData,
 *     });
 * 
 *     if (!response.ok) {
 *       throw new Error('Upload failed');
 *     }
 * 
 *     const data = await response.json();
 *     return {
 *       success: true,
 *       url: data.url,
 *     };
 *   } catch (error) {
 *     return {
 *       success: false,
 *       error: error instanceof Error ? error.message : 'Upload failed',
 *     };
 *   }
 * }
 */


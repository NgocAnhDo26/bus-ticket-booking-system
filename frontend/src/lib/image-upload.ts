import { apiClient } from './api-client';

export interface ImageUploadResponse {
  url: string;
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
}

export interface BatchImageUploadResponse {
  successful: ImageUploadResponse[];
  failed: Array<{
    fileName: string;
    error: string;
  }>;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface ValidationError {
  message: string;
  fileName?: string;
}

/**
 * Validates a single image file
 */
export function validateImageFile(file: File): ValidationError | null {
  if (!file) {
    return { message: 'File is required' };
  }

  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return {
      message: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
      fileName: file.name,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      message: `File size exceeds limit. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)} MB, provided: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      fileName: file.name,
    };
  }

  return null;
}

/**
 * Validates multiple image files
 */
export function validateImageFiles(
  files: File[],
  maxTotalSize?: number,
  maxFiles?: number,
): ValidationError | null {
  if (!files || files.length === 0) {
    return { message: 'No files provided' };
  }

  if (maxFiles && files.length > maxFiles) {
    return {
      message: `Too many files. Maximum allowed: ${maxFiles}, provided: ${files.length}`,
    };
  }

  // Validate each file
  for (const file of files) {
    const error = validateImageFile(file);
    if (error) {
      return error;
    }
  }

  // Validate total size
  if (maxTotalSize) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSizeBytes = maxTotalSize * 1024 * 1024; // Convert MB to bytes
    if (totalSize > maxTotalSizeBytes) {
      return {
        message: `Total batch size exceeds limit. Maximum: ${maxTotalSize} MB, provided: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
      };
    }
  }

  return null;
}

/**
 * Upload a single image to Cloudinary
 */
export async function uploadImage(file: File, folder?: string): Promise<ImageUploadResponse> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await apiClient.post<ImageUploadResponse>('/api/images/upload', formData);

  return response.data;
}

/**
 * Upload multiple images to Cloudinary in batch
 */
export async function uploadImages(
  files: File[],
  folder?: string,
  maxTotalSize?: number,
  maxFiles?: number,
): Promise<BatchImageUploadResponse> {
  const validationError = validateImageFiles(files, maxTotalSize, maxFiles);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await apiClient.post<BatchImageUploadResponse>(
    '/api/images/upload/batch',
    formData,
  );

  return response.data;
}

/**
 * Delete a single image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  await apiClient.delete('/api/images', {
    data: { publicId },
  });
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteImages(publicIds: string[]): Promise<Record<string, boolean>> {
  const response = await apiClient.delete<Record<string, boolean>>('/api/images/batch', {
    data: publicIds,
  });
  return response.data;
}

/**
 * Get optimized Cloudinary URL with transformations
 */
export function getImageUrl(publicId: string, transformations?: string): string {
  // If the publicId is already a full URL, return it
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }

  // Construct Cloudinary URL with transformations
  const baseUrl = `https://res.cloudinary.com`;
  // Note: This is a simplified version. In production, you'd want to use
  // the actual cloud name from your Cloudinary config
  if (transformations) {
    return `${baseUrl}/image/upload/${transformations}/${publicId}`;
  }
  return `${baseUrl}/image/upload/${publicId}`;
}

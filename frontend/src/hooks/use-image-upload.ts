import { useMutation } from '@tanstack/react-query';

import {
  type BatchImageUploadResponse,
  type ImageUploadResponse,
  deleteImage,
  deleteImages,
  uploadImage,
  uploadImages,
} from '@/lib/image-upload';

export interface UseImageUploadOptions {
  folder?: string;
  maxTotalSize?: number;
  maxFiles?: number;
  onSuccess?: (response: ImageUploadResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseBatchImageUploadOptions {
  folder?: string;
  maxTotalSize?: number;
  maxFiles?: number;
  onSuccess?: (response: BatchImageUploadResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for uploading a single image
 */
export function useImageUpload(options?: UseImageUploadOptions) {
  return useMutation({
    mutationFn: (file: File) => uploadImage(file, options?.folder),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

/**
 * Hook for uploading multiple images in batch
 */
export function useBatchImageUpload(options?: UseBatchImageUploadOptions) {
  return useMutation({
    mutationFn: (files: File[]) =>
      uploadImages(files, options?.folder, options?.maxTotalSize, options?.maxFiles),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

/**
 * Hook for deleting a single image
 */
export function useDeleteImage() {
  return useMutation({
    mutationFn: (publicId: string) => deleteImage(publicId),
  });
}

/**
 * Hook for deleting multiple images
 */
export function useDeleteImages() {
  return useMutation({
    mutationFn: (publicIds: string[]) => deleteImages(publicIds),
  });
}

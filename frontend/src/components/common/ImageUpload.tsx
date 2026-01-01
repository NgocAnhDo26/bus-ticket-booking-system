import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { AlertCircle, Image as ImageIcon, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBatchImageUpload } from '@/hooks/use-image-upload';
import { validateImageFiles } from '@/lib/image-upload';
import type { ImageUploadResponse } from '@/lib/image-upload';
import { cn } from '@/lib/utils';

export interface ImageUploadProps {
  /** Single or multiple file mode */
  multiple?: boolean;
  /** Cloudinary folder for organization */
  folder?: string;
  /** Maximum number of files (for multiple mode) */
  maxFiles?: number;
  /** Maximum total size in MB (for multiple mode) */
  maxTotalSize?: number;
  /** Callback when images are successfully uploaded */
  onUploadSuccess?: (images: ImageUploadResponse[]) => void;
  /** Callback when upload fails */
  onUploadError?: (error: Error) => void;
  /** Initial uploaded images */
  initialImages?: ImageUploadResponse[];
  /** Whether to show preview of uploaded images */
  showPreview?: boolean;
  /** Custom className */
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadResponse?: ImageUploadResponse;
}

export function ImageUpload({
  multiple = false,
  folder,
  maxFiles = 20,
  maxTotalSize = 50,
  onUploadSuccess,
  onUploadError,
  initialImages = [],
  showPreview = true,
  className,
}: ImageUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ImageUploadResponse[]>(initialImages);
  const [errors, setErrors] = useState<string[]>([]);

  const uploadMutation = useBatchImageUpload({
    folder,
    maxFiles,
    maxTotalSize,
    onSuccess: (response) => {
      const newImages = response.successful;
      setUploadedImages((prev) => [...prev, ...newImages]);

      // Update file statuses based on upload results
      setFiles((prev) => {
        const pendingFiles = prev.filter(
          (f) => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending',
        );
        return prev.map((file) => {
          const pendingIndex = pendingFiles.findIndex((f) => f === file);
          if (pendingIndex >= 0 && pendingIndex < newImages.length) {
            return {
              ...file,
              uploadStatus: 'success' as const,
              uploadResponse: newImages[pendingIndex],
            };
          }
          return file;
        });
      });

      if (onUploadSuccess) {
        onUploadSuccess(newImages);
      }
      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
      }, 1000);
    },
    onError: (error) => {
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: 'error' as const,
          error: error.message,
        })),
      );
      if (onUploadError) {
        onUploadError(error);
      }
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setErrors([]);

      // Validate files
      const validationError = validateImageFiles(
        acceptedFiles,
        maxTotalSize,
        multiple ? maxFiles : 1,
      );

      if (validationError) {
        setErrors([validationError.message]);
        if (onUploadError) {
          onUploadError(new Error(validationError.message));
        }
        return;
      }

      // Create file objects with previews
      const filesWithPreview = acceptedFiles.map((file) => {
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
          uploadStatus: 'pending' as const,
        });
        return fileWithPreview;
      });

      if (multiple) {
        setFiles((prev) => [...prev, ...filesWithPreview]);
      } else {
        // Clear previous files in single mode
        setFiles((prev) => {
          // Clean up preview URLs of previous files
          prev.forEach((file) => {
            if (file.preview) {
              URL.revokeObjectURL(file.preview);
            }
          });
          return filesWithPreview;
        });
      }
    },
    [multiple, maxFiles, maxTotalSize, onUploadError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple,
    maxFiles: multiple ? maxFiles : 1,
  });

  const handleUpload = () => {
    if (files.length === 0) return;

    const filesToUpload = files.filter((f) => f.uploadStatus !== 'success');
    if (filesToUpload.length === 0) return;

    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        uploadStatus: 'uploading' as const,
      })),
    );

    uploadMutation.mutate(filesToUpload);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const file = newFiles[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleRemoveUploadedImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const hasFiles = files.length > 0;
  const hasUploadedImages = uploadedImages.length > 0;
  const isUploading = uploadMutation.isPending;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          'cursor-pointer border-2 border-dashed transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        )}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <input {...getInputProps()} />
          <div className="mb-4 rounded-full bg-muted p-4">
            {isDragActive ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <p className="mb-2 text-sm font-medium">
            {isDragActive
              ? 'Drop images here'
              : multiple
                ? 'Drag & drop images here, or click to select'
                : 'Drag & drop an image here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground">
            {multiple
              ? `Up to ${maxFiles} files, ${maxTotalSize}MB total (JPEG, PNG, WebP)`
              : 'Max 5MB (JPEG, PNG, WebP)'}
          </p>
        </div>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        </div>
      )}

      {/* File Preview Grid */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            <Button onClick={handleUpload} disabled={isUploading || files.length === 0} size="sm">
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file, index) => (
              <Card key={index} className="relative overflow-hidden">
                {file.uploadStatus === 'uploading' ? (
                  <div className="aspect-square">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : file.preview ? (
                  <div className="relative aspect-square">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                    {file.uploadStatus === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/80">
                        <p className="p-2 text-xs text-destructive-foreground">
                          {file.error || 'Upload failed'}
                        </p>
                      </div>
                    )}
                    {file.uploadStatus === 'success' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/80">
                        <p className="text-xs text-primary-foreground">Uploaded</p>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null}
                <div className="p-2">
                  <p className="truncate text-xs text-muted-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images Preview */}
      {showPreview && hasUploadedImages && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded images ({uploadedImages.length})</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {uploadedImages.map((image, index) => (
              <Card key={image.publicId || index} className="relative overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={image.secureUrl || image.url}
                    alt={`Uploaded ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => handleRemoveUploadedImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { AlertCircle, Image as ImageIcon, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBatchImageUpload } from '@/hooks/use-image-upload';
import { getImageUrl, validateImageFiles } from '@/lib/image-upload';
import { cn } from '@/lib/utils';

export interface BusImageUploadRef {
  /** Uploads all pending files and returns their publicIds */
  uploadPendingFiles: () => Promise<string[]>;
  /** Whether there are files pending upload */
  hasPendingFiles: boolean;
}

export interface BusImageUploadProps {
  /** Maximum number of files */
  maxFiles?: number;
  /** Maximum total size in MB */
  maxTotalSize?: number;
  /** Initial photo publicIds (for edit mode) */
  initialPhotos?: string[];
  /** Custom className */
  className?: string;
  /** Callback when photos change (for form state sync) */
  onPhotosChange?: (publicIds: string[]) => void;
}

interface FileWithPreview extends File {
  preview?: string;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const BusImageUpload = forwardRef<BusImageUploadRef, BusImageUploadProps>(
  ({ maxFiles = 10, maxTotalSize = 50, initialPhotos = [], className, onPhotosChange }, ref) => {
    const [pendingFiles, setPendingFiles] = useState<FileWithPreview[]>([]);
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(initialPhotos);
    const [errors, setErrors] = useState<string[]>([]);

    // Sync initial photos when they change (edit mode)
    useEffect(() => {
      setUploadedPhotos(initialPhotos);
    }, [initialPhotos]);

    // Notify parent of changes
    useEffect(() => {
      onPhotosChange?.(uploadedPhotos);
    }, [uploadedPhotos, onPhotosChange]);

    const uploadMutation = useBatchImageUpload({
      folder: 'buses/photos',
      maxFiles,
      maxTotalSize,
    });

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        setErrors([]);

        const currentCount = pendingFiles.length + uploadedPhotos.length;
        const remainingSlots = maxFiles - currentCount;

        if (acceptedFiles.length > remainingSlots) {
          setErrors([`Chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa`]);
          return;
        }

        const validationError = validateImageFiles(acceptedFiles, maxTotalSize, maxFiles);
        if (validationError) {
          setErrors([validationError.message]);
          return;
        }

        const filesWithPreview = acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
            uploadStatus: 'pending' as const,
          }),
        );

        setPendingFiles((prev) => [...prev, ...filesWithPreview]);
      },
      [pendingFiles.length, uploadedPhotos.length, maxFiles, maxTotalSize],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
      },
      multiple: true,
      maxFiles,
    });

    const handleRemovePending = (index: number) => {
      setPendingFiles((prev) => {
        const newFiles = [...prev];
        const file = newFiles[index];
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
        newFiles.splice(index, 1);
        return newFiles;
      });
    };

    const handleRemoveUploaded = (index: number) => {
      setUploadedPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos.splice(index, 1);
        return newPhotos;
      });
    };

    // Expose upload method to parent via ref
    useImperativeHandle(ref, () => ({
      uploadPendingFiles: async () => {
        if (pendingFiles.length === 0) {
          return uploadedPhotos;
        }

        // Capture original files before state update (state update spreads and loses File prototype)
        const filesToUpload = [...pendingFiles];

        setPendingFiles((prev) =>
          prev.map((file) => ({
            ...file,
            uploadStatus: 'uploading' as const,
          })),
        );

        try {
          const response = await uploadMutation.mutateAsync(filesToUpload);
          const newPublicIds = response.successful
            .map((img) => img.publicId)
            .filter((id): id is string => !!id);

          const allPhotos = [...uploadedPhotos, ...newPublicIds];
          setUploadedPhotos(allPhotos);

          // Clear pending files after successful upload
          setPendingFiles((prev) => {
            prev.forEach((file) => {
              if (file.preview) URL.revokeObjectURL(file.preview);
            });
            return [];
          });

          return allPhotos;
        } catch (error) {
          setPendingFiles((prev) =>
            prev.map((file) => ({
              ...file,
              uploadStatus: 'error' as const,
              error: error instanceof Error ? error.message : 'Tải lên thất bại',
            })),
          );
          throw error;
        }
      },
      hasPendingFiles: pendingFiles.length > 0,
    }));

    // Cleanup preview URLs on unmount
    useEffect(() => {
      return () => {
        pendingFiles.forEach((file) => {
          if (file.preview) URL.revokeObjectURL(file.preview);
        });
      };
    }, [pendingFiles]);

    const isUploading = uploadMutation.isPending;
    const totalCount = pendingFiles.length + uploadedPhotos.length;

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
              {isDragActive ? 'Thả ảnh vào đây' : 'Kéo thả ảnh vào đây, hoặc nhấp để chọn'}
            </p>
            <p className="text-xs text-muted-foreground">
              Tối đa {maxFiles} ảnh, {maxTotalSize}MB tổng cộng (JPEG, PNG, WebP)
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

        {/* Combined Preview Grid */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Hình ảnh ({totalCount}/{maxFiles})
              {pendingFiles.length > 0 && (
                <span className="ml-2 text-muted-foreground">
                  • {pendingFiles.length} ảnh chờ tải lên
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {/* Already uploaded photos */}
              {uploadedPhotos.map((publicId, index) => (
                <Card key={`uploaded-${publicId}`} className="relative overflow-hidden p-0 gap-0">
                  <div className="relative aspect-square">
                    <img
                      src={getImageUrl(publicId)}
                      alt={`Ảnh ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveUploaded(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs text-muted-foreground">Ảnh {index + 1}</p>
                  </div>
                </Card>
              ))}

              {/* Pending files */}
              {pendingFiles.map((file, index) => (
                <Card key={`pending-${index}`} className="relative overflow-hidden p-0 gap-0">
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
                            {file.error || 'Tải lên thất bại'}
                          </p>
                        </div>
                      )}
                      <div className="absolute left-2 top-2 rounded bg-yellow-500/90 px-2 py-0.5 text-xs text-white">
                        Chờ lưu
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePending(index);
                        }}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null}
                  <div className="p-2">
                    <p className="truncate text-xs text-muted-foreground">{file.name}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

BusImageUpload.displayName = 'BusImageUpload';

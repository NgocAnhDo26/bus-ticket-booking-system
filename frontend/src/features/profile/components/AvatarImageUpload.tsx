import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { AlertCircle, Image as ImageIcon, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBatchImageUpload } from '@/hooks/use-image-upload';
import { validateImageFiles } from '@/lib/image-upload';
import { cn } from '@/lib/utils';

export interface AvatarImageUploadRef {
  /** Uploads the pending file and returns the secure URL */
  uploadPendingFile: () => Promise<string | null>;
  /** Whether there is a file pending upload */
  hasPendingFile: boolean;
}

export interface AvatarImageUploadProps {
  /** Maximum file size in MB */
  maxSize?: number;
  /** Custom className */
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const AvatarImageUpload = forwardRef<AvatarImageUploadRef, AvatarImageUploadProps>(
  ({ maxSize = 5, className }, ref) => {
    const [pendingFile, setPendingFile] = useState<FileWithPreview | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    const uploadMutation = useBatchImageUpload({
      folder: 'avatars',
      maxFiles: 1,
      maxTotalSize: maxSize,
    });

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        setErrors([]);

        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        const validationError = validateImageFiles([file], maxSize, 1);
        if (validationError) {
          setErrors([validationError.message]);
          return;
        }

        // Clean up previous preview
        if (pendingFile?.preview) {
          URL.revokeObjectURL(pendingFile.preview);
        }

        const fileWithPreview: FileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
          uploadStatus: 'pending' as const,
        });

        setPendingFile(fileWithPreview);
      },
      [maxSize, pendingFile],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
      },
      multiple: false,
      maxFiles: 1,
    });

    const handleRemovePending = () => {
      if (pendingFile?.preview) {
        URL.revokeObjectURL(pendingFile.preview);
      }
      setPendingFile(null);
    };

    // Expose upload method to parent via ref
    useImperativeHandle(ref, () => ({
      uploadPendingFile: async () => {
        if (!pendingFile) {
          return null;
        }

        // Capture original file before state update
        const fileToUpload = pendingFile;

        setPendingFile((prev) =>
          prev
            ? {
                ...prev,
                uploadStatus: 'uploading' as const,
              }
            : null,
        );

        try {
          const response = await uploadMutation.mutateAsync([fileToUpload]);
          const uploadedImage = response.successful[0];

          if (!uploadedImage) {
            throw new Error('Tải lên thất bại');
          }

          // Clear pending file after successful upload
          if (pendingFile?.preview) {
            URL.revokeObjectURL(pendingFile.preview);
          }
          setPendingFile(null);

          return uploadedImage.secureUrl;
        } catch (error) {
          setPendingFile((prev) =>
            prev
              ? {
                  ...prev,
                  uploadStatus: 'error' as const,
                  error: error instanceof Error ? error.message : 'Tải lên thất bại',
                }
              : null,
          );
          throw error;
        }
      },
      hasPendingFile: pendingFile !== null,
    }));

    // Cleanup preview URL on unmount
    useEffect(() => {
      return () => {
        if (pendingFile?.preview) {
          URL.revokeObjectURL(pendingFile.preview);
        }
      };
    }, [pendingFile]);

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
              {isDragActive ? 'Thả ảnh vào đây' : 'Kéo thả ảnh vào đây, hoặc nhấp để chọn'}
            </p>
            <p className="text-xs text-muted-foreground">Tối đa {maxSize}MB (JPEG, PNG, WebP)</p>
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

        {/* Pending file preview */}
        {pendingFile && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Ảnh đã chọn
              <span className="ml-2 text-muted-foreground">• Chờ lưu</span>
            </p>
            <div className="flex justify-center">
              <Card className="relative w-32 overflow-hidden p-0 gap-0">
                {pendingFile.uploadStatus === 'uploading' ? (
                  <div className="aspect-square">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : pendingFile.preview ? (
                  <div className="relative aspect-square">
                    <img
                      src={pendingFile.preview}
                      alt={pendingFile.name}
                      className="h-full w-full object-cover"
                    />
                    {pendingFile.uploadStatus === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/80">
                        <p className="p-2 text-xs text-destructive-foreground">
                          {pendingFile.error || 'Tải lên thất bại'}
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
                        handleRemovePending();
                      }}
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null}
                <div className="p-2">
                  <p className="truncate text-xs text-muted-foreground">{pendingFile.name}</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  },
);

AvatarImageUpload.displayName = 'AvatarImageUpload';

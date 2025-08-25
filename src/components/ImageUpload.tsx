import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import { handleUpload, UploadResult } from '@/services/pinataService';
import { toast } from './ui/sonner';

interface ImageUploadProps {
  onImageSelected?: (file: File) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload = ({ 
  onImageSelected, 
  onImageRemoved, 
  disabled = false,
  className 
}: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0 || disabled) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Create preview and store locally
    const preview = URL.createObjectURL(file);
    setSelectedImage({ file, preview });
    
    // Notify parent component
    onImageSelected?.(file);
  }, [disabled, onImageSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback(() => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    onImageRemoved?.();
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedImage, onImageRemoved]);

  const openFileDialog = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <Card className={cn("relative aspect-video overflow-hidden", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {selectedImage ? (
        // Image preview
        <div className="relative group w-full h-full">
          <img
            src={selectedImage.preview}
            alt="Selected preview"
            className="w-full h-full object-contain"
          />
          
          {/* Remove button */}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
            onClick={removeImage}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        // Drop zone
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={cn(
            "w-full h-full border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "flex flex-col items-center justify-center p-6 text-center",
            isDragOver
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="space-y-4">
            <div className="mx-auto">
              {isDragOver ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <Image className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium">
                {isDragOver ? 'Drop image here' : 'Upload an image'}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Max 10MB • JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

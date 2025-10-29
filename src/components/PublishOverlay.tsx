import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Upload, Image as ImageIcon, DollarSign, FileText } from 'lucide-react';

interface PublishOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (publishData: PublishData) => void;
  isPublishing: boolean;
}

export interface PublishData {
  description: string;
  thumbnail: File | null;
  price: string;
}

const PublishOverlay: React.FC<PublishOverlayProps> = ({
  isOpen,
  onClose,
  onPublish,
  isPublishing
}) => {
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [price, setPrice] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      
      setThumbnail(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = () => {
    // Validate required fields
    if (!description.trim()) {
      return;
    }

    if (!thumbnail) {
      return;
    }

    if (!price.trim()) {
      return;
    }

    // Validate price format (should be a positive number)
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      return;
    }

    // Call the publish handler with the data
    onPublish({
      description: description.trim(),
      thumbnail,
      price: price.trim()
    });
  };

  const handleClose = () => {
    // Reset form when closing
    setDescription('');
    setThumbnail(null);
    setPrice('');
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Publish Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </span>
              <span className="text-xs text-muted-foreground">
                {description.length}/500
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter a description that will be shown publicly on the post card..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isPublishing}
              maxLength={500}
            />
            {/* <p className="text-sm text-muted-foreground">
              This description will be visible to everyone browsing posts.
            </p> */}
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Thumbnail
            </Label>
            
            {thumbnailPreview ? (
              <div className="space-y-3">
                <div className="relative w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {thumbnail?.name} ({(thumbnail?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveThumbnail}
                    disabled={isPublishing}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload thumbnail image
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
              disabled={isPublishing}
            />
            
            {/* <p className="text-sm text-muted-foreground">
              This image will be displayed as the post thumbnail in the library.
            </p> */}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price (ETH)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.001"
              value={price}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow empty string or positive numbers
                if (value === '' || parseFloat(value) >= 0) {
                  setPrice(value);
                }
              }}
              onKeyDown={(e) => {
                // Prevent minus sign from being entered
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              disabled={isPublishing}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Set the price in ETH for accessing this post.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !description.trim() || !thumbnail || !price.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Publish to Blockchain
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishOverlay;

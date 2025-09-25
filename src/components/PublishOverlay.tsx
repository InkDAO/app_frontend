import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Upload, Image as ImageIcon, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file for the thumbnail.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
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
      toast({
        title: "Description required",
        description: "Please provide a description for your post.",
        variant: "destructive"
      });
      return;
    }

    if (!thumbnail) {
      toast({
        title: "Thumbnail required",
        description: "Please select a thumbnail image for your post.",
        variant: "destructive"
      });
      return;
    }

    if (!price.trim()) {
      toast({
        title: "Price required",
        description: "Please set a price for your post.",
        variant: "destructive"
      });
      return;
    }

    // Validate price format (should be a positive number)
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid positive number for the price.",
        variant: "destructive"
      });
      return;
    }

      description: description.trim(),
      thumbnail,
      price: price.trim()
    });
    
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
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter a description that will be shown publicly on the post card..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isPublishing}
            />
            <p className="text-sm text-muted-foreground">
              This description will be visible to everyone browsing posts.
            </p>
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Thumbnail Image
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
            
            <p className="text-sm text-muted-foreground">
              This image will be displayed as the post thumbnail in the library.
            </p>
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
              onChange={(e) => setPrice(e.target.value)}
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
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                'Publish to Blockchain'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishOverlay;

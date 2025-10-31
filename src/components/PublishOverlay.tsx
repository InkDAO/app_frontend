import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Upload, Image as ImageIcon, DollarSign, FileText, Hash } from 'lucide-react';

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
  hashtags: string;
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
  const [hashtags, setHashtags] = useState('');
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
      price: price.trim(),
      hashtags: hashtags.trim()
    });
  };

  const handleClose = () => {
    // Reset form when closing
    setDescription('');
    setThumbnail(null);
    setPrice('');
    setHashtags('');
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="w-[calc(100vw-2rem)] max-w-[600px] sm:max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-0 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden box-border"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent break-words">
            Publish Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-5 max-w-full overflow-hidden">
          {/* Description */}
          <div className="space-y-2 max-w-full">
            <Label htmlFor="description" className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-2 text-sm sm:text-base">
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Description
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {description.length}/500
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter a description that will be shown publicly on the post card..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors w-full box-border"
              disabled={isPublishing}
              maxLength={500}
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2 max-w-full">
            <Label htmlFor="hashtags" className="flex items-center gap-2 font-semibold text-sm sm:text-base">
              <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Hashtags
            </Label>
            <Input
              id="hashtags"
              type="text"
              placeholder="web3, blockchain, crypto"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              disabled={isPublishing}
              className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors box-border"
            />
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              Enter hashtags separated by commas (e.g., web3, blockchain, crypto)
            </p>
          </div>

          {/* Thumbnail */}
          <div className="space-y-2 max-w-full overflow-hidden">
            <Label className="flex items-center gap-2 font-semibold text-sm sm:text-base">
              <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Thumbnail
            </Label>
            
            {thumbnailPreview ? (
              <div className="space-y-3 max-w-full overflow-hidden">
                <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
                <div className="flex items-center justify-between bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-w-full overflow-hidden">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium truncate mr-2 flex-1 min-w-0">
                    {thumbnail?.name} ({((thumbnail?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveThumbnail}
                    disabled={isPublishing}
                    className="flex-shrink-0 border-2 bg-white/80 dark:bg-slate-700/80 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="relative w-full h-48 sm:h-56 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-2xl" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                    Click to upload thumbnail image
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
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
          </div>

          {/* Price */}
          <div className="space-y-2 max-w-full">
            <Label htmlFor="price" className="flex items-center gap-2 font-semibold text-sm sm:text-base">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
              className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-2 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors box-border"
            />
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              Set the price in ETH for accessing this post.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPublishing}
              className="w-full sm:w-auto border-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 font-semibold px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !description.trim() || !thumbnail || !price.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg hover:shadow-xl transition-all px-6"
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

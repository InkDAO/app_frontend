import { Card, CardContent } from "@/components/ui/card";
import { FileImage, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchFileContentByAssetAddress } from "@/services/dXService";
import { useAccount } from "wagmi";

interface MyPostCardProps {
  asset: {
    assetTitle: string;
    assetCid: string;
    assetAddress: string;
    author: string;
    thumbnailCid?: string;
    description?: string;
    costInNative?: string;
  };
}

export const MyPostCard = ({ asset }: MyPostCardProps) => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [thumbnailImage, setThumbnailImage] = useState<string>("");
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Safety check for asset
  if (!asset) {
    console.error('MyPostCard: asset prop is undefined');
    return null;
  }

  // Fetch thumbnail image when component mounts
  useEffect(() => {
    const fetchThumbnail = async () => {
      if (asset.thumbnailCid && !thumbnailImage) {
        setIsLoadingThumbnail(true);
        setThumbnailError(null);
        
        try {
          // Use the Vite gateway URL to fetch the thumbnail
          const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'gateway.pinata.cloud';
          const thumbnailUrl = `https://${gatewayUrl}/ipfs/${asset.thumbnailCid}`;
          
          // Test if the image loads
          const img = new Image();
          img.onload = () => {
            setThumbnailImage(thumbnailUrl);
            setIsLoadingThumbnail(false);
          };
          img.onerror = () => {
            setThumbnailError('Failed to load thumbnail');
            setIsLoadingThumbnail(false);
          };
          img.src = thumbnailUrl;
        } catch (error) {
          console.error('Failed to load thumbnail:', error);
          setThumbnailError('Failed to load thumbnail');
          setIsLoadingThumbnail(false);
        }
      }
    };

    fetchThumbnail();
  }, [asset.thumbnailCid, thumbnailImage]);

  // Fetch file content when user clicks on card
  const fetchContent = async () => {
    if (asset.assetAddress && address && !fileContent && !isLoadingContent) {
      setIsLoadingContent(true);
      setContentError(null);
      
      try {
        const content = await fetchFileContentByAssetAddress(asset.assetAddress, address);
        setFileContent(content);
      } catch (error) {
        console.error('❌ MyPostCard - Error loading file content:', error);
        setContentError(error instanceof Error ? error.message : 'Failed to load content');
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  // Use asset data from contract
  const postTitle = asset.assetTitle || 'Untitled';
  const postDescription = asset.description || '';
  
  // Calculate price from asset data
  const costInWei = asset.costInNative || '0';
  const pricePerAsset = costInWei ? parseFloat(costInWei.toString()) / 1e18 : 0; // Convert from wei to ETH with decimals

  const handleCardClick = async () => {
    if (!asset.assetAddress) return;
    
    // Navigate directly to the post page - let PostPreviewPage handle access control
    navigate(`/app/post/${asset.assetAddress}`);
  };

  return (
    <Card 
      className="w-full max-w-sm hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-48 bg-muted/30 overflow-hidden flex items-center justify-center">
        {isLoadingThumbnail ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : thumbnailError || !asset.thumbnailCid ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80">
            <FileImage className="h-16 w-16 text-muted-foreground/50" />
          </div>
        ) : thumbnailImage ? (
          <img 
            src={thumbnailImage} 
            alt={postTitle}
            className="group-hover:scale-105 transition-transform duration-300 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80">
            <FileImage className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Overlay gradient for better text readability on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <div className="mb-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {postTitle}
          </h3>
        </div>

        {/* Description */}
        {postDescription && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {postDescription}
            </p>
          </div>
        )}

        {/* Price Display */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-sm font-medium text-foreground">
            Price: {pricePerAsset.toFixed(4)} ETH
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

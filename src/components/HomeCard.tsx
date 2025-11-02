import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileImage, ShoppingCart, Loader2, Eye, Users, UserPlus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyAsset, getPostPrice, fetchFileContentByPostId } from "@/services/dXService";
import { useAccount, useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import { useAssetOwnership } from "@/hooks/useAssetOwnership";

import { Asset } from "@/types";
import { marketPlaceContract } from "@/contracts/marketPlace";

interface HomeCardProps {
  asset: Asset;
}

export const HomeCard = ({ asset }: HomeCardProps) => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { buyAsset, isPending, isConfirmed, isError } = useBuyAsset();
  const { isOwned, isLoading: isOwnershipLoading } = useAssetOwnership(asset.postId, asset);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [thumbnailImage, setThumbnailImage] = useState<string>("");
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Safety check for asset
  if (!asset) {
    console.error('HomeCard: asset prop is undefined');
    return null;
  }

  // Fetch total supply for the asset
  const { data: totalSupply } = useReadContract({
    address: marketPlaceContract.address as `0x${string}`,
    abi: marketPlaceContract.abi,
    functionName: "totalSupply",
    args: [BigInt(asset.postId)],
  });

  // Monitor transaction confirmation
  useEffect(() => {
    if (isConfirmed && isBuying) {
      setIsBuying(false);
      setIsDialogOpen(false);
    }
  }, [isConfirmed, isBuying]);

  // Monitor transaction errors
  useEffect(() => {
    if (isError && isBuying) {
      setIsBuying(false);
    }
  }, [isError, isBuying]);

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

  // Fetch file content when user clicks on card (only for owned assets)
  const fetchContent = async () => {
    if (asset.postId && address && !fileContent && !isLoadingContent && isOwned && !isOwnershipLoading) {
      setIsLoadingContent(true);
      setContentError(null);
      
      try {
        const content = await fetchFileContentByPostId(asset.postId, address);
        setFileContent(content);
      } catch (error) {
        console.error('❌ HomeCard - Error loading file content:', error);
        setContentError(error instanceof Error ? error.message : 'Failed to load content');
      } finally {
        setIsLoadingContent(false);
      }
    }
  };
  
  // Get asset cost from asset data or smart contract
  const priceInNative = asset.priceInNative || getPostPrice(asset.postId);
  const pricePerAsset = priceInNative ? parseFloat(priceInNative.toString()) / 1e18 : 0; // Convert from wei to ETH with decimals

  // Use asset data from contract
  const postTitle = asset.postTitle || 'Untitled';
  const postDescription = asset.description || '';
  
  // Format published date
  const formatPublishedDate = (dateString: string | undefined) => {
    if (!dateString) return { short: null, full: null };
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      const fullMonth = date.toLocaleDateString('en-US', { month: 'long' });
      return { 
        short: `${month} ${day}`,
        full: `${fullMonth} ${day}, ${year}`
      };
    } catch {
      return { short: null, full: null };
    }
  };
  
  const formattedDate = formatPublishedDate(asset.publishedAt);

  const handleCardClick = async () => {
    if (!asset.postId) return;
    
    // Navigate directly to the post page - let PostPreviewPage handle access control
    navigate(`/app/post/${asset.postId}`);
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsDialogOpen(true);
  };

  const handleConfirmBuy = async () => {
    if (!asset.postCid) {
      return;
    }

    setIsBuying(true);
    try {
      await buyAsset({
        postId: asset.postId,
        amount: "1",
        priceInNativeInWei: priceInNative.toString()
      });
      
      // Don't set isBuying to false here - let the useEffect handle it when transaction is confirmed
    } catch (error: any) {
      console.error('Error buying asset:', error);
      setIsBuying(false);
    }
  };

  // Use price per asset as the total price (quantity is always 1)
  const totalPrice = pricePerAsset;

  return (
    <div className="group relative w-full max-w-sm">
      {/* Glowing border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      <Card 
        className="relative w-full hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
        onClick={handleCardClick}
      >
        <div className="relative h-48 bg-gradient-to-br from-muted/30 to-muted/50 overflow-hidden flex items-center justify-center rounded-t-2xl">
          {/* Subtle animated blob in thumbnail */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse" />
          
          {isLoadingThumbnail ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80 relative z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : thumbnailError || !asset.thumbnailCid ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80 relative z-10">
              <FileImage className="h-16 w-16 text-muted-foreground/50" />
            </div>
          ) : thumbnailImage ? (
            <img 
              src={thumbnailImage} 
              alt={postTitle}
              className="group-hover:scale-110 transition-transform duration-500 w-full h-full object-cover relative z-10"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80 relative z-10">
              <FileImage className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
        </div>

      <CardContent className="p-5 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,transparent)] dark:bg-grid-slate-400/5 opacity-30" />
        
        {/* Date, Author Info, and Price at Top */}
        <div className="relative z-10 flex items-center mb-3 gap-2 flex-wrap">
          {formattedDate.short && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-3 py-1 flex-shrink-0 font-medium cursor-pointer bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                  >
                    {formattedDate.short}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formattedDate.full}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Link 
            to={`/dashboard/${asset.author}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-block"
          >
            <Badge 
              variant="secondary" 
              className="text-xs px-3 py-1.5 flex-shrink-0 font-medium bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
            >
              {asset.author?.slice(0, 6)}...{asset.author?.slice(-4)}
            </Badge>
          </Link>
          
          <Badge 
            variant="secondary" 
            className="text-xs px-3 py-1 flex-shrink-0 font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-blue-300 dark:border-blue-700"
          >
            {pricePerAsset === 0 ? "FREE" : `${pricePerAsset.toFixed(4)} ETH`}
          </Badge>
        </div>

        {/* Content area - Fixed height for consistency */}
        <div className="relative z-10 flex flex-col h-[7.5rem]">
          <div className="mb-2">
            <h3 className="font-bold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-2">
              {postTitle}
            </h3>
            
            {/* Hashtags Section - Right after title */}
            {asset.hashtags && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {asset.hashtags.split(',').slice(0, 4).map((tag, index) => {
                  const trimmedTag = tag.trim();
                  if (!trimmedTag) return null;
                  return (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="text-xs px-2 py-0.5 font-medium text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors backdrop-blur-sm"
                    >
                      #{trimmedTag}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative flex-1 overflow-hidden">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {postDescription}
            </p>
            {/* Gradient fade overlay - only visible when content overflows */}
            {postDescription && postDescription.length > 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent pointer-events-none" />
            )}
          </div>
        </div>

        {/* Total Supply and Action Section */}
        <div className="relative z-10 flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-medium">
              {totalSupply ? Number(totalSupply) : "0"} Collected
            </span>
          </div>
          {isOwned || pricePerAsset === 0 ? (
            <Badge 
              variant="secondary"
              className="cursor-pointer text-xs px-3 py-1.5 font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 backdrop-blur-sm border-emerald-300 dark:border-emerald-700 transition-all shadow-sm hover:shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Read
            </Badge>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Badge 
                  variant="secondary"
                  className="cursor-pointer text-xs px-3 py-1.5 font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-sm border-blue-300 dark:border-blue-700 transition-all shadow-sm hover:shadow-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Subscribe
                </Badge>
              </DialogTrigger>
              <DialogContent 
                className="w-[calc(100vw-2rem)] max-w-[400px] sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-0 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <DialogHeader className="pb-2 sm:pb-3 space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 backdrop-blur-sm shadow-lg flex-shrink-0">
                      <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <DialogTitle className="text-base sm:text-lg md:text-xl font-extrabold text-left leading-tight">Complete Subscription</DialogTitle>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium text-left">
                    Confirm your subscription to unlock this content
                  </p>
                </DialogHeader>
                
                <div className="py-3 sm:py-4 space-y-2.5 sm:space-y-3">
                  <div className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 border backdrop-blur-sm shadow-md ${totalPrice === 0 
                    ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200/50 dark:border-emerald-700/50"
                    : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200/50 dark:border-blue-700/50"
                  }`}>
                    <div className={`absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 rounded-full blur-2xl ${totalPrice === 0
                      ? "bg-gradient-to-br from-emerald-400/20 to-teal-400/20"
                      : "bg-gradient-to-br from-blue-400/20 to-indigo-400/20"
                    }`}></div>
                    <div className="relative flex justify-between items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">Price:</span>
                      <span className={`text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent ${totalPrice === 0
                        ? "from-emerald-600 to-teal-600"
                        : "from-blue-600 to-indigo-600"
                      }`}>
                        {totalPrice === 0 ? "FREE" : `${totalPrice.toFixed(4)} ETH`}
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <span>Lifetime access to this content</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <span>Blockchain-verified ownership</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <span>Support the creator directly</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDialogOpen(false);
                    }}
                    className="w-full sm:w-auto border-2 h-10 text-sm font-semibold bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md transition-all px-4 sm:px-6"
                    disabled={isBuying}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmBuy();
                    }}
                    disabled={isBuying}
                    className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 font-bold h-10 text-sm shadow-lg hover:shadow-xl transition-all px-4 sm:px-6"
                  >
                    {isBuying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Confirm Subscription
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, FileImage, Lock, Eye, ExternalLink, Users, Copy, Check, UserPlus, ChevronDown, ChevronUp, Shield, Wallet, Sparkles, Info, Calendar } from "lucide-react";
import EditorTextParser from "@/components/editor/EditorTextParser";
import { fetchFileContentByAssetAddress, useAssetCidByAddress, useAssetData, useBuyAsset } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import "@/components/editor/Editor.css";
import { useAccount, useReadContract } from "wagmi";
import { useAssetOwnership } from "@/hooks/useAssetOwnership";
import { AuthGuard } from "@/components/AuthGuard";
import { dXassetContract } from "@/contracts/dXasset";
import { handleGetFileMetadataByCid } from "@/services/pinataService";
import { useAuth } from "@/hooks/useAuth";

export const PostPreviewPage = () => {
  const { assetAddress } = useParams<{ assetAddress: string }>();
  const { address, isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { cid: assetCid, isLoading: isCidLoading, isError: isCidError } = useAssetCidByAddress(assetAddress || '');
  const { assetData, isLoading: isAssetDataLoading, isError: isAssetDataError } = useAssetData(assetCid || '');
  const { buyAsset, isPending: isBuying, isConfirmed: isBuyConfirmed, isError: isBuyError } = useBuyAsset();
  const { isOwned, isLoading: isOwnershipLoading } = useAssetOwnership(assetAddress || '', assetData);
  
  // Fetch total supply (number of subscribers)
  const { data: totalSupply } = useReadContract({
    address: assetAddress as `0x${string}`,
    abi: dXassetContract.abi,
    functionName: 'totalSupply',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string>("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [copiedAsset, setCopiedAsset] = useState(false);
  const [copiedAuthor, setCopiedAuthor] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [hashtags, setHashtags] = useState<string | undefined>(undefined);
  const [publishDate, setPublishDate] = useState<string | undefined>(undefined);
  const [isAnimated, setIsAnimated] = useState(false);

  // Trigger scroll animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update post title when asset data is loaded
  useEffect(() => {
    if (assetData) {
      if (assetData.assetTitle) {
        setPostTitle(assetData.assetTitle);
      }
    }
  }, [assetData]);

  // Fetch metadata to get hashtags and publish date
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!assetCid) return;
      
      try {
        const metadata = await handleGetFileMetadataByCid(assetCid);
        
        // Extract publish date
        if (metadata?.created_at) {
          setPublishDate(metadata.created_at);
        }
        
        if (metadata?.keyvalues && typeof metadata.keyvalues === 'object') {
          const hashtagArray: string[] = [];
          
          // Extract hashtags from keyvalues where key === value
          Object.entries(metadata.keyvalues).forEach(([key, value]) => {
            if (key === value && typeof value === 'string') {
              hashtagArray.push(key);
            }
          });
          
          if (hashtagArray.length > 0) {
            setHashtags(hashtagArray.join(','));
          }
        }
      } catch (error) {
        console.error('Error fetching metadata for hashtags:', error);
      }
    };
    
    fetchMetadata();
  }, [assetCid]);

  // Set access denied when user doesn't own the asset (but not for free posts)
  useEffect(() => {
    if (!isOwnershipLoading && !isOwned && assetData) {
      // Check if the post is free
      // Note: costInNativeInWei can be 0n (BigInt 0), which is falsy, so we need to check !== undefined
      const isFreePost = assetData?.costInNativeInWei !== undefined ? parseFloat(assetData.costInNativeInWei.toString()) === 0 : false;
      
      // Only deny access if it's not a free post
      if (!isFreePost) {
        setIsAccessDenied(true);
      } else {
        // For free posts, explicitly allow access
        setIsAccessDenied(false);
      }
    } else if (isOwned) {
      setIsAccessDenied(false);
    }
  }, [isOwned, isOwnershipLoading, assetData]);

  // Fetch content when asset CID is available
  useEffect(() => {
    const fetchContent = async () => {
      // Don't fetch content if user is not authenticated
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      if (!assetCid) {
        if (isCidError) {
          setContentError("Failed to load asset CID");
          setIsLoading(false);
        }
        return;
      }

      // Wait for asset data to load to check if post is free
      if (!assetData || isAssetDataLoading) {
        return;
      }

      // Check if the post is free (cost is 0)
      // Note: costInNativeInWei can be 0n (BigInt 0), which is falsy, so we need to check !== undefined
      const isFreePost = assetData?.costInNativeInWei !== undefined ? parseFloat(assetData.costInNativeInWei.toString()) === 0 : false;

      // For paid posts, only fetch content if user owns the asset
      if (!isFreePost && (!isOwned || isOwnershipLoading)) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setContentError(null);
        
        // For free posts, we can fetch without user address; for paid posts, we need it
        const contentData = await fetchFileContentByAssetAddress(assetAddress || '', address || '');
        
        if (contentData) {
          try {
            // Parse the JSON response that contains title and content (same as editor)
            const parsedResponse = typeof contentData === 'string' ? JSON.parse(contentData) : contentData;
            
            if (parsedResponse.content) {
              // Set the title
              if (parsedResponse.title) {
                setPostTitle(parsedResponse.title);
              }
              
              setPreviewData(parsedResponse.content);
              
              // Extract image from EditorJS content for header display
              if (parsedResponse.content.blocks) {
                const imageBlock = parsedResponse.content.blocks.find((block: any) => 
                  block.type === 'image' && block.data && (block.data.file?.url || block.data.url)
                );
                if (imageBlock) {
                  setPostImage(imageBlock.data.file?.url || imageBlock.data.url);
                }
              }
            } else {
              // Fallback to the original content if structure is different
              setPreviewData(contentData);
              setPostTitle("Untitled");
            }
          } catch (error) {
            // If parsing fails, use the content as-is
            setPreviewData(contentData);
            setPostTitle("Untitled");
          }
        } else {
          setContentError("No content found for this CID");
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        
        // Check if it's a 404 error (user doesn't have access)
        if (error instanceof Error && error.message.includes('404')) {
          setIsAccessDenied(true);
          setContentError(null);
        } else {
          setContentError(error instanceof Error ? error.message : 'Failed to load content');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [assetCid, isCidError, isOwned, isOwnershipLoading, assetData, assetAddress, address, isAssetDataLoading, isAuthenticated]);

  const handleCopyAsset = async () => {
    if (assetAddress) {
      await navigator.clipboard.writeText(assetAddress);
      setCopiedAsset(true);
      setTimeout(() => setCopiedAsset(false), 2000);
    }
  };

  const handleCopyAuthor = async () => {
    if (assetData?.author) {
      await navigator.clipboard.writeText(assetData.author);
      setCopiedAuthor(true);
      setTimeout(() => setCopiedAuthor(false), 2000);
    }
  };

  const handleCopyCid = async () => {
    if (assetCid) {
      await navigator.clipboard.writeText(assetCid);
      setCopiedCid(true);
      setTimeout(() => setCopiedCid(false), 2000);
    }
  };

  const handleCopyShareLink = async () => {
    const shareUrl = window.location.href;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const handlePurchase = async () => {
    if (!assetAddress || !assetData) return;

    try {
      setIsTransactionPending(true);
      const costInWei = assetData.costInNativeInWei ? assetData.costInNativeInWei.toString() : "0";
      await buyAsset({
        assetAddress,
        amount: "1",
        costInNativeInWei: costInWei
      });
      
      setIsPurchaseDialogOpen(false);
    } catch (error) {
      console.error('Error subscribing to asset:', error);
      setIsTransactionPending(false);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isBuyConfirmed) {
      setIsTransactionPending(false);
      // Reload the page to show the content
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }, [isBuyConfirmed]);

  // Handle transaction error
  useEffect(() => {
    if (isBuyError) {
      setIsTransactionPending(false);
    }
  }, [isBuyError]);

  // Loading state - show while fetching initial data
  if (isCidLoading || isAssetDataLoading || isOwnershipLoading) {
    return (
      <div className="bg-transparent py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="w-full max-w-7xl mx-auto">
          {/* Share Banner Container - matches editor page banner width */}
          <div className="mb-6 sm:mb-8 max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-4 sm:p-6 lg:p-8 border-0 shadow-2xl dark:shadow-blue-500/10">
              {/* Animated Background Blobs */}
              <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
              
              <div className="relative z-10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg sm:shadow-xl shadow-blue-500/50 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                    <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1.5 sm:mb-2">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                        Share this post
                      </h2>
                      <Button
                        onClick={handleCopyShareLink}
                        variant="outline"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 font-semibold shadow-md hover:shadow-lg transition-all flex-shrink-0"
                      >
                        {copiedShareLink ? (
                          <>
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground font-semibold">
                      Copy the link and <span className="text-foreground font-bold">share with others</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Container with Loading State */}
          <div className={`scroll-container ${isAnimated ? 'animated' : ''}`}>
            {/* Top Wooden Handle */}
            <div className="wooden-handle wooden-handle-top">
              <div className="handle-rod">
                <div className="handle-knob handle-knob-left"></div>
                <div className="handle-knob handle-knob-right"></div>
              </div>
            </div>
            
            {/* Top Paper Roll */}
            <div className="paper-roll paper-roll-top"></div>
            
            {/* Parchment Paper Content with Loading State */}
            <div className="parchment-paper">
              <div className="parchment-content">
                {/* Loading Title Skeleton */}
                <div className="mb-6">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
                </div>

                {/* Loading Metadata Skeleton */}
                <div className="mb-8 flex flex-wrap items-center justify-end gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>

                {/* Loading Content Area */}
                <div className="min-h-[500px] w-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Paper Roll */}
            <div className="paper-roll paper-roll-bottom"></div>
            
            {/* Bottom Wooden Handle */}
            <div className="wooden-handle wooden-handle-bottom">
              <div className="handle-rod">
                <div className="handle-knob handle-knob-left"></div>
                <div className="handle-knob handle-knob-right"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if post is free or user owns it
  const isFreePost = assetData?.costInNativeInWei !== undefined ? parseFloat(assetData.costInNativeInWei.toString()) === 0 : false;
  const hasAccess = isFreePost || isOwned;

  // If user doesn't have access (paid post they don't own), show access denied/purchase card
  // Don't require authentication to see the purchase card
  if (isAccessDenied && !hasAccess) {
    const pricePerAsset = assetData?.costInNativeInWei !== undefined ? parseFloat(assetData.costInNativeInWei.toString()) / 1e18 : 0;
    
    // Don't show purchase card for free posts
    if (pricePerAsset === 0) {
      // For free posts, just show loading or wait for content to load
      return (
        <div className="bg-transparent py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
          <div className="w-full max-w-7xl mx-auto">
            {/* Scroll Container with Loading State */}
            <div className={`scroll-container ${isAnimated ? 'animated' : ''}`}>
              {/* Top Wooden Handle */}
              <div className="wooden-handle wooden-handle-top">
                <div className="handle-rod">
                  <div className="handle-knob handle-knob-left"></div>
                  <div className="handle-knob handle-knob-right"></div>
                </div>
              </div>
              
              {/* Top Paper Roll */}
              <div className="paper-roll paper-roll-top"></div>
              
              {/* Parchment Paper Content with Loading State */}
              <div className="parchment-paper">
                <div className="parchment-content">
                  {/* Loading Title Skeleton */}
                  <div className="mb-6">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
                  </div>

                  {/* Loading Metadata Skeleton */}
                  <div className="mb-8 flex flex-wrap items-center justify-end gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>

                  {/* Loading Content Area */}
                  <div className="min-h-[500px] w-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">Loading free content...</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Paper Roll */}
              <div className="paper-roll paper-roll-bottom"></div>
              
              {/* Bottom Wooden Handle */}
              <div className="wooden-handle wooden-handle-bottom">
                <div className="handle-rod">
                  <div className="handle-knob handle-knob-left"></div>
                  <div className="handle-knob handle-knob-right"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-[calc(100vh-8rem)] py-8">
        <div className="max-w-5xl mx-auto w-full space-y-4">
          
          {/* Welcome Banner - Glassy Style */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-4 sm:p-6 lg:p-8 border-0 shadow-2xl dark:shadow-primary/10">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
            
            <div className="relative z-10">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg sm:shadow-xl shadow-blue-500/50 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight mb-1.5 sm:mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                    Welcome to <span className="font-brand">InkDAO</span>
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground font-semibold mb-2 sm:mb-2.5">
                    Discover premium content as blockchain assets. <span className="text-foreground font-bold">Subscribe once, access forever</span>
                  </p>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground/80 font-medium">
                    Your subscription is stored on-chain and can never be revoked
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Content Card - Glassy Enhanced Design */}
          <div className="relative">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            
            <Card className="relative overflow-hidden border-0 shadow-2xl dark:shadow-primary/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              {/* Animated Background Blobs */}
              <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-56 h-56 sm:w-72 sm:h-72 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
            
            <CardHeader className="relative z-10 pb-4 pt-6 px-4 sm:px-6">
              <div className="flex items-start gap-4">
                {/* Thumbnail image with trust badge */}
                <div className="flex-shrink-0 relative">
                  {(postImage || assetData?.thumbnailCid) ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200/50 dark:ring-slate-700/50">
                      <img 
                        src={postImage || `https://${import.meta.env.VITE_GATEWAY_URL}/ipfs/${assetData?.thumbnailCid}`}
                        alt={assetData?.assetTitle || 'Post thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 shadow-lg backdrop-blur-sm">
                      <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                  {/* Trust badge */}
                  <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full shadow-lg" title="Verified on blockchain">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                </div>
                
                {/* Title and description */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-200 flex-1">
                          {assetData?.assetTitle || 'Untitled'}
                        </h3>
                        {/* Premium badge - Glassy */}
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 backdrop-blur-sm text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold shadow-sm">
                          <Sparkles className="h-3 w-3" />
                          Premium
                        </span>
                      </div>
                      
                      {/* Hashtags Section - Right after title */}
                      {hashtags && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {hashtags.split(',').slice(0, 4).map((tag, index) => {
                            const trimmedTag = tag.trim();
                            if (!trimmedTag) return null;
                            return (
                              <Badge 
                                key={index}
                                variant="outline"
                                className="text-xs px-2 py-0.5 font-semibold text-primary border-primary/30 bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-colors"
                              >
                                #{trimmedTag}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      
                      {assetData?.description && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-3 font-medium">
                          {assetData.description}
                        </p>
                      )}
                      {/* Date and Author info */}
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {/* Publish Date */}
                        {publishDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-semibold">
                              {new Date(publishDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                        {/* Author */}
                        <Link 
                          to={`/dashboard/${assetData?.author}`}
                          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span className="font-semibold">{assetData?.author?.slice(0, 6)}...{assetData?.author?.slice(-4)}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 px-4 sm:px-6 pb-6 space-y-5">
              {/* Key Stats - Glassy Style */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/50 dark:border-blue-800/50 p-4 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
                  <div className="relative flex flex-col gap-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Subscription Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{pricePerAsset.toFixed(4)}</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">ETH</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">One-time payment</span>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200/50 dark:border-purple-800/50 p-4 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
                  <div className="relative flex flex-col gap-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Subscribers
                    </span>
                    <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{totalSupply ? totalSupply.toString() : '0'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">Lifetime access</span>
                  </div>
                </div>
              </div>

              {/* What You Get - Glassy Value Proposition */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200/50 dark:border-green-800/50 p-4 backdrop-blur-sm shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl"></div>
                <div className="relative">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    What You Get
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="font-medium"><strong className="font-bold">Lifetime Access:</strong> Read this content forever, no recurring fees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="font-medium"><strong className="font-bold">Blockchain-Secured:</strong> Your subscription is stored on-chain and can't be revoked</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="font-medium"><strong className="font-bold">Support Creators:</strong> Your payment goes directly to the content creator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="font-medium"><strong className="font-bold">Decentralized:</strong> No platform can remove your access or censor content</span>
                    </li>
                  </ul>
                </div>
              </div>

               {/* Call to Action - Glassy Style - Compact */}
               <div className="relative overflow-hidden rounded-xl bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-md">
                 <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-slate-400/10 to-slate-500/10 rounded-full blur-2xl"></div>
                 {isOwned ? (
                   <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                     <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                       You own this content. Click to read it.
                     </p>
                     <Button 
                       onClick={() => window.location.reload()}
                       size="default"
                       className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-shrink-0"
                     >
                       <Eye className="h-4 w-4 mr-2" />
                       Read Now
                     </Button>
                   </div>
                 ) : (
                   <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                     <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold text-center sm:text-left">
                       {!isConnected ? (
                         <>Connect your wallet to subscribe and unlock this premium content</>
                       ) : (
                         <>Ready to get lifetime access?</>
                       )}
                     </p>
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <span className="inline-block flex-shrink-0">
                             <Button 
                               onClick={() => setIsPurchaseDialogOpen(true)}
                               disabled={!isConnected || isTransactionPending}
                               size="default"
                               className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 px-6 py-2 text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                             >
                               {isTransactionPending ? (
                                 <>
                                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                   Processing...
                                 </>
                               ) : (
                                 <>
                                   <UserPlus className="h-4 w-4 mr-2" />
                                   Subscribe Now
                                 </>
                               )}
                             </Button>
                           </span>
                         </TooltipTrigger>
                         {!isConnected && (
                           <TooltipContent>
                             <p>Connect wallet to subscribe</p>
                           </TooltipContent>
                         )}
                       </Tooltip>
                     </TooltipProvider>
                   </div>
                 )}
               </div>

              {/* Technical Details - Collapsible - Glassy Style */}
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="flex items-center justify-between w-full text-left text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Technical Details (Blockchain Info)
                  </span>
                  {showTechnicalDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                
                {showTechnicalDetails && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="relative overflow-hidden bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-400/10 to-slate-500/10 rounded-full blur-xl"></div>
                      <div className="relative flex flex-col gap-2">
                        <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">Asset Contract</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-200/60 dark:bg-slate-700/60 backdrop-blur-sm px-2 py-1 rounded flex-1 truncate font-medium">
                            {assetAddress?.slice(0, 10)}...{assetAddress?.slice(-8)}
                          </span>
                          <button 
                            onClick={handleCopyAsset}
                            className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 backdrop-blur-sm rounded transition-colors flex-shrink-0"
                            title="Copy asset address"
                          >
                            {copiedAsset ? (
                              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg p-3 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-400/10 to-slate-500/10 rounded-full blur-xl"></div>
                      <div className="relative flex flex-col gap-2">
                        <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">Content CID</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-200/60 dark:bg-slate-700/60 backdrop-blur-sm px-2 py-1 rounded flex-1 truncate font-medium">
                            {assetCid ? `${assetCid.slice(0, 10)}...${assetCid.slice(-8)}` : 'Loading...'}
                          </span>
                          <button 
                            onClick={handleCopyCid}
                            className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 backdrop-blur-sm rounded transition-colors flex-shrink-0"
                            title="Copy content CID"
                          >
                            {copiedCid ? (
                              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>

            {/* Subscription Dialog - Glassy Responsive */}
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
              <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-0 shadow-2xl">
                <DialogHeader className="text-center pb-3 sm:pb-4 space-y-2">
                  <div className="mx-auto mb-2 sm:mb-3 p-2.5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 backdrop-blur-sm w-fit shadow-lg">
                    <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl font-extrabold">Complete Subscription</DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
                    Confirm your subscription to unlock this content
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl p-4 sm:p-6 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-md">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
                    <div className="relative flex justify-between items-center">
                      <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-200">Price:</span>
                      <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{pricePerAsset.toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPurchaseDialogOpen(false)}
                    disabled={isTransactionPending}
                    className="w-full sm:w-auto border-2 h-11 sm:h-10 text-sm sm:text-base font-semibold bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md transition-all"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePurchase}
                    disabled={isBuying || isTransactionPending}
                    className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 font-bold h-11 sm:h-10 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    {isBuying || isTransactionPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isBuying ? 'Confirming...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Confirm Subscription
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>
    );
  }

  // If user has access (free or owned) but is not authenticated, show sign-in card
  if (hasAccess && !isAuthenticated) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  if (contentError) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  // Show loading state while fetching content
  if (isLoading) {
    return (
      <div className="bg-transparent py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="w-full max-w-7xl mx-auto">
          {/* Share Banner Container - matches editor page banner width */}
          <div className="mb-6 sm:mb-8 max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-4 sm:p-6 lg:p-8 border-0 shadow-2xl dark:shadow-blue-500/10">
              {/* Animated Background Blobs */}
              <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
              
              <div className="relative z-10">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg sm:shadow-xl shadow-blue-500/50 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                    <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1.5 sm:mb-2">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                        Share this post
                      </h2>
                      <Button
                        onClick={handleCopyShareLink}
                        variant="outline"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 font-semibold shadow-md hover:shadow-lg transition-all flex-shrink-0"
                      >
                        {copiedShareLink ? (
                          <>
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground font-semibold">
                      Copy the link and <span className="text-foreground font-bold">share with others</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Container with Loading State */}
          <div className={`scroll-container ${isAnimated ? 'animated' : ''}`}>
            {/* Top Wooden Handle */}
            <div className="wooden-handle wooden-handle-top">
              <div className="handle-rod">
                <div className="handle-knob handle-knob-left"></div>
                <div className="handle-knob handle-knob-right"></div>
              </div>
            </div>
            
            {/* Top Paper Roll */}
            <div className="paper-roll paper-roll-top"></div>
            
            {/* Parchment Paper Content with Loading State */}
            <div className="parchment-paper">
              <div className="parchment-content">
                {/* Loading Title Skeleton */}
                <div className="mb-6">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
                </div>

                {/* Loading Metadata Skeleton */}
                <div className="mb-8 flex flex-wrap items-center justify-end gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>

                {/* Loading Content Area */}
                <div className="min-h-[500px] w-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Paper Roll */}
            <div className="paper-roll paper-roll-bottom"></div>
            
            {/* Bottom Wooden Handle */}
            <div className="wooden-handle wooden-handle-bottom">
              <div className="handle-rod">
                <div className="handle-knob handle-knob-left"></div>
                <div className="handle-knob handle-knob-right"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="w-full max-w-7xl mx-auto">
        {/* Share Banner Container - matches editor page banner width */}
        <div className="mb-6 sm:mb-8 max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-4 sm:p-6 lg:p-8 border-0 shadow-2xl dark:shadow-blue-500/10">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
            
            <div className="relative z-10">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg sm:shadow-xl shadow-blue-500/50 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                  <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1.5 sm:mb-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                      Share this post
                    </h2>
                    <Button
                      onClick={handleCopyShareLink}
                      variant="outline"
                      className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 font-semibold shadow-md hover:shadow-lg transition-all flex-shrink-0"
                    >
                      {copiedShareLink ? (
                        <>
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground font-semibold">
                    Copy the link and <span className="text-foreground font-bold">share with others</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Container */}
        <div className={`scroll-container ${isAnimated ? 'animated' : ''}`}>
          {/* Top Wooden Handle */}
          <div className="wooden-handle wooden-handle-top">
            <div className="handle-rod">
              <div className="handle-knob handle-knob-left"></div>
              <div className="handle-knob handle-knob-right"></div>
            </div>
          </div>
          
          {/* Top Paper Roll */}
          <div className="paper-roll paper-roll-top"></div>
          
          {/* Parchment Paper Content */}
          <div className="parchment-paper">
            <div className="parchment-content">
              {/* Title */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black dark:text-white">
                  {postTitle}
                </h1>
              </div>

              {/* Metadata */}
              <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                {/* Hashtags row */}
                {hashtags && hashtags.trim() && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hashtags.split(',').slice(0, 4).map((tag, index) => {
                      const trimmedTag = tag.trim();
                      if (!trimmedTag) return null;
                      return (
                        <Badge 
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-0.5 font-medium text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          #{trimmedTag}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                
                {/* Author and Date row */}
                <div className={`flex items-center justify-end gap-4 text-sm text-muted-foreground ${hashtags && hashtags.trim() ? 'mt-5' : 'mt-2'}`}>
                  {publishDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {new Date(publishDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  
                  <Link 
                    to={`/dashboard/${assetData?.author}`}
                    className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-xs font-semibold">
                      {assetData?.author?.slice(0, 6)}...{assetData?.author?.slice(-4)}
                    </span>
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="min-h-[500px] w-full">
                {previewData ? (
                  <EditorTextParser data={previewData} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No content available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Paper Roll */}
          <div className="paper-roll paper-roll-bottom"></div>
          
          {/* Bottom Wooden Handle */}
          <div className="wooden-handle wooden-handle-bottom">
            <div className="handle-rod">
              <div className="handle-knob handle-knob-left"></div>
              <div className="handle-knob handle-knob-right"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

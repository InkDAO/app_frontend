import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, FileImage, Lock, Eye, ExternalLink, Users, Copy, Check, UserPlus, ChevronDown, ChevronUp, Shield, Sparkles, Info, Calendar } from "lucide-react";
import EditorTextParser from "@/components/editor/EditorTextParser";
import { fetchFileContentByPostId, useBuyAsset } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import "@/components/editor/Editor.css";
import { useAccount, useReadContract } from "wagmi";
import { useAssetOwnership } from "@/hooks/useAssetOwnership";
import { AuthGuard } from "@/components/AuthGuard";
import { marketPlaceContract } from "@/contracts/marketPlace";
import { handleGetFileMetadataByCid } from "@/services/pinataService";
import { useAuth } from "@/hooks/useAuth";

export const PostPreviewPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const { address, isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  
  // Get post info directly from postId
  const { data: postInfoRaw, isLoading: isPostInfoLoading, isError: isPostInfoError } = useReadContract({
    address: marketPlaceContract.address as `0x${string}`,
    abi: marketPlaceContract.abi,
    functionName: 'getPostInfo',
    args: postId ? [BigInt(postId)] : undefined,
    query: {
      enabled: !!postId,
    }
  });
  
  const postInfo = postInfoRaw as any;
  const postCid = postInfo?.postCid;
  
  const { buyAsset, isPending: isBuying, isConfirmed: isBuyConfirmed, isError: isBuyError } = useBuyAsset();
  const { isOwned, isLoading: isOwnershipLoading, refetch: refetchOwnership } = useAssetOwnership(postId || '', postInfo);
  
  // Fetch total supply (number of subscribers)
  const { data: totalSupply } = useReadContract({
    address: marketPlaceContract.address as `0x${string}`,
    abi: marketPlaceContract.abi,
    functionName: 'totalSupply',
    args: postId ? [BigInt(postId)] : undefined,
    query: {
      enabled: !!postId,
    }
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
  const [showFreePostDialog, setShowFreePostDialog] = useState(false);
  const [hasViewedFreePostDialog, setHasViewedFreePostDialog] = useState(false);
  const [shouldLoadContent, setShouldLoadContent] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);

  // Update post title when asset data is loaded
  useEffect(() => {
    if (postInfo) {
      if (postInfo.postTitle) {
        setPostTitle(postInfo.postTitle);
      }
    }
  }, [postInfo]);

  // Fetch metadata to get hashtags and publish date
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!postCid) return;
      
      try {
        const metadata = await handleGetFileMetadataByCid(postCid);
        
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
  }, [postCid]);

  // Show free post dialog when landing on a free post
  useEffect(() => {
    if (!postInfo || isPostInfoLoading || isOwnershipLoading) return;
    
    const isFreePost = postInfo?.priceInNative !== undefined ? parseFloat(postInfo.priceInNative.toString()) === 0 : false;
    
    // For paid posts or if user already owns the free post, allow content to load immediately
    if (!isFreePost || isOwned) {
      setShouldLoadContent(true);
      return;
    }
    
    // Show dialog only for free posts and if user hasn't already seen it for this session
    // Don't show if user already owns the post (already subscribed)
    if (isFreePost && !hasViewedFreePostDialog && !isLoading && !isOwned) {
      setShowFreePostDialog(true);
    }
  }, [postInfo, isPostInfoLoading, hasViewedFreePostDialog, isLoading, isOwned, isOwnershipLoading]);

  // Set access denied when user doesn't own the asset (but not for free posts)
  useEffect(() => {
    if (!isOwnershipLoading && !isOwned && postInfo) {
      // Check if the post is free
      // Note: costInNativeInWei can be 0n (BigInt 0), which is falsy, so we need to check !== undefined
      const isFreePost = postInfo?.priceInNative !== undefined ? parseFloat(postInfo.priceInNative.toString()) === 0 : false;
      
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
  }, [isOwned, isOwnershipLoading, postInfo]);

  // Fetch content when asset CID is available
  useEffect(() => {
    const fetchContent = async () => {
      if (!postCid) {
        if (isPostInfoError) {
          setContentError("Failed to load post information");
          setIsLoading(false);
        }
        return;
      }

      // Wait for asset data to load to check if post is free
      if (!postInfo || isPostInfoLoading) {
        return;
      }

      // Check if the post is free (cost is 0)
      const isFreePost = postInfo?.priceInNative !== undefined ? parseFloat(postInfo.priceInNative.toString()) === 0 : false;

      // For free posts, wait until user makes a choice (shouldLoadContent is true)
      if (isFreePost && !shouldLoadContent) {
        setIsLoading(false);
        return;
      }

      // For paid posts, require authentication and ownership
      if (!isFreePost) {
        // For paid posts, require authentication
        if (!isAuthenticated) {
          setIsLoading(false);
          return;
        }
        
        // For paid posts, only fetch content if user owns the asset
        if (!isOwned || isOwnershipLoading) {
          setIsLoading(false);
          return;
        }
      }
      
      try {
        setIsLoading(true);
        setContentError(null);
        
        // For free posts, we can fetch without user address; for paid posts, we need it
        const contentData = await fetchFileContentByPostId(postId || '', address || '', isFreePost);
        
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
  }, [postCid, isPostInfoError, isOwned, isOwnershipLoading, postInfo, postId, address, isPostInfoLoading, isAuthenticated, shouldLoadContent]);

  const handleCopyAsset = async () => {
    if (postId) {
      await navigator.clipboard.writeText(postId);
      setCopiedAsset(true);
      setTimeout(() => setCopiedAsset(false), 2000);
    }
  };

  const handleCopyAuthor = async () => {
    if (postInfo?.author) {
      await navigator.clipboard.writeText(postInfo.author);
      setCopiedAuthor(true);
      setTimeout(() => setCopiedAuthor(false), 2000);
    }
  };

  const handleCopyCid = async () => {
    if (postCid) {
      await navigator.clipboard.writeText(postCid);
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
    if (!postId || !postInfo) return;

    try {
      setIsTransactionPending(true);
      const priceInNative = postInfo.priceInNative ? postInfo.priceInNative.toString() : "0";
      await buyAsset({
        postId: postId,
        amount: "1",
        priceInNativeInWei: priceInNative
      });
      
      setIsPurchaseDialogOpen(false);
    } catch (error) {
      console.error('Error subscribing to asset:', error);
      setIsTransactionPending(false);
    }
  };

  const handleRecordAccessOnChain = async () => {
    if (!postId || !postInfo) return;

    try {
      setShowFreePostDialog(false);
      setIsTransactionPending(true);
      // For free posts, the price is 0
      await buyAsset({
        postId: postId,
        amount: "1",
        priceInNativeInWei: "0"
      });
      
      setHasViewedFreePostDialog(true);
    } catch (error) {
      console.error('Error recording access on chain:', error);
      setIsTransactionPending(false);
      setHasViewedFreePostDialog(true);
      // Allow loading content even if transaction fails
      setShouldLoadContent(true);
    }
  };

  const handleSkipFreePostDialog = () => {
    setShowFreePostDialog(false);
    setHasViewedFreePostDialog(true);
    // Immediately allow content to load
    setShouldLoadContent(true);
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isBuyConfirmed) {
      setIsTransactionPending(false);
      // Refetch ownership to update the UI immediately
      // Add a small delay to ensure transaction is fully confirmed on-chain
      setTimeout(() => {
        refetchOwnership();
      }, 1000);
      // Show congratulations message
      setShowCongratulations(true);
      // After 2 seconds, hide congratulations and load content
      setTimeout(() => {
        setShowCongratulations(false);
        setShouldLoadContent(true);
      }, 2000);
    }
  }, [isBuyConfirmed, refetchOwnership]);

  // Handle transaction error
  useEffect(() => {
    if (isBuyError) {
      setIsTransactionPending(false);
    }
  }, [isBuyError]);

  // Loading state - show while fetching initial data
  if (isPostInfoLoading || isOwnershipLoading) {
    return (
      <div className="bg-transparent py-8 px-0 sm:px-4 md:px-6 lg:px-8 min-h-screen overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {/* Share Banner Container - matches editor page banner width */}
          <div className="mb-6 sm:mb-8 max-w-5xl mx-auto px-2 sm:px-0">
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

          {/* Modern Glassy Container - Loading State */}
          <div className="max-w-5xl mx-auto px-2 sm:px-0">
            {/* Glowing border effect */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 transition duration-500"></div>
              
              {/* Main Content Card */}
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl dark:shadow-primary/10 border-0 overflow-hidden">
                {/* Subtle animated blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>
                
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,white,transparent)] dark:bg-grid-slate-400/5 opacity-30 pointer-events-none"></div>
                
                {/* Content Container */}
                <div className="relative z-10 px-3 pt-6 pb-16 sm:px-8 sm:pb-20 md:px-12 lg:px-16 lg:pb-24 xl:px-20 xl:pb-28">
                  {/* Loading Title Skeleton */}
                  <div className="mb-6 mt-8 sm:mt-12 md:mt-16">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
                  </div>

                  {/* Loading Metadata Skeleton */}
                  <div className="mb-8 flex flex-wrap items-center justify-end gap-4 pb-6 border-b border-border/30">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if post is free or user owns it
  const isFreePost = postInfo?.priceInNative !== undefined ? parseFloat(postInfo.priceInNative.toString()) === 0 : false;
  const hasAccess = isFreePost || isOwned;

  // If user doesn't have access (paid post they don't own), show access denied/purchase card
  // Don't require authentication to see the purchase card
  if (isAccessDenied && !hasAccess) {
    const pricePerAsset = postInfo?.priceInNative !== undefined ? parseFloat(postInfo.priceInNative.toString()) / 1e18 : 0;
    
    // Don't show purchase card for free posts
    if (pricePerAsset === 0) {
      // For free posts, just show loading or wait for content to load
      return (
        <div className="bg-transparent py-8 px-0 sm:px-4 md:px-6 lg:px-8 min-h-screen overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto">
            {/* Modern Glassy Container - Loading State */}
            <div className="max-w-5xl mx-auto px-2 sm:px-0">
              {/* Glowing border effect */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 transition duration-500"></div>
                
                {/* Main Content Card */}
                <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl dark:shadow-primary/10 border-0 overflow-hidden">
                  {/* Subtle animated blobs */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,white,transparent)] dark:bg-grid-slate-400/5 opacity-30 pointer-events-none"></div>
                  
                  {/* Content Container */}
                  <div className="relative z-10 px-4 pt-6 pb-16 sm:px-8 sm:pb-20 md:px-12 lg:px-16 lg:pb-24 xl:px-20 xl:pb-28">
                    {/* Loading Title Skeleton */}
                    <div className="mb-6 mt-8 sm:mt-12 md:mt-16">
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
                    </div>

                    {/* Loading Metadata Skeleton */}
                    <div className="mb-8 flex flex-wrap items-center justify-end gap-4 pb-6 border-b border-border/30">
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
                  {(postImage || postInfo?.thumbnailCid) ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200/50 dark:ring-slate-700/50">
                      <img 
                        src={postImage || `https://${import.meta.env.VITE_GATEWAY_URL}/ipfs/${postInfo?.thumbnailCid}?img-width=320&img-height=320&img-fit=cover&img-format=webp&img-quality=85`}
                        alt={postInfo?.postTitle || 'Post thumbnail'}
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
                          {postInfo?.postTitle || 'Untitled'}
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
                      
                      {postInfo?.description && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-3 font-medium">
                          {postInfo.description}
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
                          to={`/dashboard/${postInfo?.author}`}
                          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span className="font-semibold">{postInfo?.author?.slice(0, 6)}...{postInfo?.author?.slice(-4)}</span>
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
                       You own this content. Content is loading...
                     </p>
                     <Button 
                       onClick={() => {
                         // Refetch ownership and trigger content load
                         refetchOwnership();
                         setShouldLoadContent(true);
                       }}
                       size="default"
                       className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-shrink-0"
                     >
                       <Eye className="h-4 w-4 mr-2" />
                       Refresh
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
                            {postId?.slice(0, 10)}...{postId?.slice(-8)}
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
                            {postCid ? `${postCid.slice(0, 10)}...${postCid.slice(-8)}` : 'Loading...'}
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
              <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px] sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-0 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
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
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-md">
                    <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
                    <div className="relative flex justify-between items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">Price:</span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{pricePerAsset.toFixed(4)} ETH</span>
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
                    onClick={() => setIsPurchaseDialogOpen(false)}
                    disabled={isTransactionPending}
                    className="w-full sm:w-auto border-2 h-10 text-sm font-semibold bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md transition-all px-4 sm:px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePurchase}
                    disabled={isBuying || isTransactionPending}
                    className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 font-bold h-10 text-sm shadow-lg hover:shadow-xl transition-all px-4 sm:px-6"
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
                </div>
              </DialogContent>
            </Dialog>
        </div>
      </div>
    );
  }

  // Free Post Access Dialog - Show when landing on a free post
  const renderFreePostDialog = () => (
    <Dialog open={showFreePostDialog} onOpenChange={setShowFreePostDialog}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px] sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-0 shadow-2xl p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-3 space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 backdrop-blur-sm shadow-lg flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-base sm:text-lg md:text-xl font-extrabold text-left leading-tight">Free Content Access</DialogTitle>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium text-left">
            This content is free to access. Choose how you'd like to proceed:
          </p>
        </DialogHeader>
        
        <div className="py-3 sm:py-4 space-y-2.5 sm:space-y-3">
          {/* Option 1: Record on-chain */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-md">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
            <div className="relative space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Record Access On-Chain</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Subscribe to this token and record your access on the blockchain. This shows your support for the creator!
              </p>
            </div>
          </div>

          {/* Option 2: Skip */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/40 dark:to-gray-950/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-md">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-400/20 to-gray-400/20 rounded-full blur-2xl"></div>
            <div className="relative space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Skip</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Just view the content without recording on-chain. You can always subscribe later.
              </p>
            </div>
          </div>

          {/* Benefits of recording on-chain */}
          <div className="pt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Why record on-chain?</p>
            <div className="flex items-start gap-2">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Show support for the creator</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Get listed as a subscriber</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>Blockchain-verified proof of access</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={handleRecordAccessOnChain}
            disabled={!isConnected || isTransactionPending}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-10 text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTransactionPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Record on Chain (Free)
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSkipFreePostDialog}
            disabled={isTransactionPending}
            className="w-full border-2 h-10 text-sm font-semibold bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md transition-all"
          >
            <Eye className="h-4 w-4 mr-2" />
            Skip & View Content
          </Button>
        </div>

        {!isConnected && (
          <p className="text-xs text-center text-amber-600 dark:text-amber-400 pt-2">
            Connect your wallet to record access on-chain
          </p>
        )}
      </DialogContent>
    </Dialog>
  );

  // If user has access (paid post they own) but is not authenticated, show sign-in card
  // Free posts don't require authentication
  if (hasAccess && !isAuthenticated && !isFreePost) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  if (contentError && !isFreePost) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  // Show free post dialog screen (before showing content) for free posts
  if (showFreePostDialog && isFreePost) {
    return (
      <div className="bg-transparent py-8 px-0 sm:px-4 md:px-6 lg:px-8 min-h-screen overflow-x-hidden flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="max-w-5xl mx-auto px-2 sm:px-0 w-full">
            {/* Welcome Message Card */}
            <div className="mb-6 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 p-6 sm:p-8 lg:p-10 border-0 shadow-2xl dark:shadow-green-500/10">
              {/* Animated Background Blobs */}
              <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
              
              <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 shadow-lg shadow-green-500/50">
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-300 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent drop-shadow-sm">
                  Free Content Available!
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-semibold mb-2">
                  This content is <span className="text-foreground font-bold">completely free</span> to access
                </p>
                {postTitle && (
                  <p className="text-sm sm:text-base text-muted-foreground/80 font-medium max-w-2xl mx-auto">
                    "{postTitle}"
                  </p>
                )}
              </div>
            </div>

            {/* Render the dialog */}
            {renderFreePostDialog()}
          </div>
        </div>
      </div>
    );
  }

  // Show waiting screen while transaction is being confirmed
  if (isTransactionPending && isFreePost && !showCongratulations) {
    return (
      <div className="bg-transparent py-8 px-0 sm:px-4 md:px-6 lg:px-8 min-h-screen overflow-x-hidden flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="max-w-5xl mx-auto px-2 sm:px-0 w-full">
            {/* Waiting Card */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-8 sm:p-12 lg:p-16 border-0 shadow-2xl dark:shadow-blue-500/10">
              {/* Animated Background Blobs */}
              <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
              
              <div className="relative z-10 text-center space-y-6">
                {/* Loading Icon */}
                <div className="flex justify-center">
                  <div className="p-4 sm:p-6 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-2xl shadow-blue-500/50">
                    <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 text-white animate-spin" />
                  </div>
                </div>

                {/* Waiting Message */}
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                    Confirming Transaction...
                  </h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-foreground font-bold">
                    Please wait while we record your access on-chain
                  </p>
                  <p className="text-base sm:text-lg text-muted-foreground font-semibold max-w-2xl mx-auto">
                    This may take a few moments. Please don't close this page.
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="pt-6 space-y-3 max-w-md mx-auto">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm sm:text-base text-muted-foreground font-semibold">Transaction sent to blockchain</span>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                    <span className="text-sm sm:text-base text-foreground font-bold">Waiting for confirmation...</span>
                  </div>
                  <div className="flex items-center gap-3 text-left opacity-50">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm sm:text-base text-muted-foreground font-medium">Access recorded & content loaded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show congratulations screen after transaction confirmation
  if (showCongratulations && isFreePost) {
    return (
      <div className="bg-transparent py-8 px-0 sm:px-4 md:px-6 lg:px-8 min-h-screen overflow-x-hidden flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="max-w-5xl mx-auto px-2 sm:px-0 w-full">
            {/* Congratulations Card */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 p-8 sm:p-12 lg:p-16 border-0 shadow-2xl dark:shadow-green-500/10">
              {/* Animated Background Blobs */}
              <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
              
              <div className="relative z-10 text-center space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="p-4 sm:p-6 rounded-full bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 shadow-2xl shadow-green-500/50 animate-bounce">
                    <Check className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                  </div>
                </div>

                {/* Congratulations Message */}
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-300 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent drop-shadow-sm">
                    🎉 Congratulations! 🎉
                  </h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-foreground font-bold">
                    Access Recorded On-Chain!
                  </p>
                  <p className="text-base sm:text-lg text-muted-foreground font-semibold max-w-2xl mx-auto">
                    Your subscription has been confirmed on the blockchain. Loading your content now...
                  </p>
                </div>

                {/* Loading indicator */}
                <div className="flex justify-center pt-4">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching content
  if (isLoading) {
    return (
      <div className="bg-transparent py-8 px-2 sm:px-4 md:px-6 lg:px-8 min-h-screen overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {/* Share Banner Container - matches editor page banner width */}
          <div className="mb-6 sm:mb-8 max-w-5xl mx-auto">
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

          {/* Modern Glassy Container - Loading State */}
          <div className="max-w-5xl mx-auto">
            {/* Glowing border effect */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 transition duration-500"></div>
              
              {/* Main Content Card */}
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl dark:shadow-primary/10 border-0 overflow-hidden">
                {/* Subtle animated blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>
                
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,white,transparent)] dark:bg-grid-slate-400/5 opacity-30 pointer-events-none"></div>
                
                {/* Content Container */}
                <div className="relative z-10 px-3 pt-6 pb-16 sm:px-8 sm:pb-20 md:px-12 lg:px-16 lg:pb-24 xl:px-20 xl:pb-28">
                  {/* Loading Title Skeleton */}
                  <div className="mb-6 mt-8 sm:mt-12 md:mt-16">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse"></div>
                  </div>

                  {/* Loading Metadata Skeleton */}
                  <div className="mb-8 flex flex-wrap items-center justify-end gap-4 pb-6 border-b border-border/30">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent py-8 px-0 sm:px-4 md:px-6 lg:px-8 min-h-screen overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        {/* Share Banner Container - matches editor page banner width */}
        <div className="mb-6 sm:mb-8 max-w-5xl mx-auto px-2 sm:px-0">
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

        {/* Modern Glassy Container */}
        <div className="max-w-5xl mx-auto px-2 sm:px-0">
          {/* Glowing border effect */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            
            {/* Main Content Card */}
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl dark:shadow-primary/10 border-0 overflow-hidden">
              {/* Subtle animated blobs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>
              
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,white,transparent)] dark:bg-grid-slate-400/5 opacity-30 pointer-events-none"></div>
              
              {/* Content Container */}
              <div className="relative z-10 px-3 pt-6 pb-16 sm:px-8 sm:pb-20 md:px-12 lg:px-16 lg:pb-24 xl:px-20 xl:pb-28">
                {/* Max-width content wrapper for large screens - improves readability */}
                <div className="w-full lg:max-w-3xl lg:mx-auto">
                  {/* Title */}
                  <div className="mb-6 mt-8 sm:mt-12 md:mt-16">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                      {postTitle}
                    </h1>
                  </div>

                  {/* Metadata */}
                  <div className="pb-4 border-b border-border/30">
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
                        to={`/dashboard/${postInfo?.author}`}
                        className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors font-medium"
                      >
                        <User className="h-4 w-4" />
                        <span className="text-xs font-semibold">
                          {postInfo?.author?.slice(0, 6)}...{postInfo?.author?.slice(-4)}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

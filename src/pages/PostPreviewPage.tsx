import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Calendar, User, FileImage, Lock, ShoppingCart, Eye } from "lucide-react";
import EditorTextParser from "@/components/editor/EditorTextParser";
import { fetchFileContentByAssetAddress, useAssetCidByAddress, useAssetData, useBuyAsset } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import "@/components/editor/Editor.css";
import { useAccount } from "wagmi";
import { useAssetOwnership } from "@/hooks/useAssetOwnership";

export const PostPreviewPage = () => {
  const { assetAddress } = useParams<{ assetAddress: string }>();
  const { address } = useAccount();
  const { cid: assetCid, isLoading: isCidLoading, isError: isCidError } = useAssetCidByAddress(assetAddress || '');
  const { assetData, isLoading: isAssetDataLoading, isError: isAssetDataError } = useAssetData(assetCid || '');
  const { buyAsset, isPending: isBuying, isConfirmed: isBuyConfirmed, isError: isBuyError } = useBuyAsset();
  const { isOwned, isLoading: isOwnershipLoading } = useAssetOwnership(assetAddress || '', assetData);
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string>("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Update post title when asset data is loaded
  useEffect(() => {
    if (assetData && assetData.assetTitle) {
      setPostTitle(assetData.assetTitle);
    }
  }, [assetData]);

  // Set access denied when user doesn't own the asset
  useEffect(() => {
    if (!isOwnershipLoading && !isOwned && assetData) {
      setIsAccessDenied(true);
    } else if (isOwned) {
      setIsAccessDenied(false);
    }
  }, [isOwned, isOwnershipLoading, assetData]);

  // Fetch content when asset CID is available
  useEffect(() => {
    const fetchContent = async () => {
      if (!assetCid) {
        if (isCidError) {
          setContentError("Failed to load asset CID");
          setIsLoading(false);
        }
        return;
      }

      // Only fetch content if user owns the asset
      if (!isOwned || isOwnershipLoading) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setContentError(null);
        
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
  }, [assetCid, isCidError, isOwned, isOwnershipLoading]);

  const handlePurchase = async () => {
    if (!assetAddress || !assetData) return;

    try {
      const costInWei = assetData.costInNativeInWei ? assetData.costInNativeInWei.toString() : "0";
      await buyAsset({
        assetAddress,
        amount: "1",
        costInNativeInWei: costInWei
      });
      
      toast.success("Purchase transaction submitted!");
      setIsPurchaseDialogOpen(false);
    } catch (error) {
      console.error('Error purchasing asset:', error);
      toast.error("Failed to purchase asset");
    }
  };


  if (isLoading || isCidLoading || isAssetDataLoading || isOwnershipLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading content...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAccessDenied) {
    const pricePerAsset = assetData?.costInNativeInWei ? parseFloat(assetData.costInNativeInWei.toString()) / 1e18 : 0;

    return (
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-[calc(100vh-8rem)]">
        <div className="max-w-4xl mx-auto w-full">

            {/* Premium Content Card - Compact Design */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 via-purple-600/3 to-indigo-600/3 dark:from-blue-400/3 dark:via-purple-400/3 dark:to-indigo-400/3"></div>
              
              <CardHeader className="relative pb-4 pt-6 px-4 sm:px-6">
                <div className="flex items-start gap-4">
                  {/* Lock icon - smaller and inline */}
                  <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 shadow-md">
                    <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600 dark:text-slate-300" />
                  </div>
                  
                  {/* Title and description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                          {assetData?.assetTitle || 'Untitled'}
                        </h3>
                        {assetData?.description && (
                          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                            {assetData.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Button - moved to header */}
                      <div className="flex-shrink-0">
                        {isOwned ? (
                          <Button 
                            onClick={() => window.location.reload()}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Read Now
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => setIsPurchaseDialogOpen(true)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Purchase
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative px-4 sm:px-6 pb-6">

                {/* Asset Details - Including Price */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-xs">Price</span>
                      <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded font-semibold">
                        {pricePerAsset.toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-xs">Asset</span>
                      <span className="font-mono text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                        {assetAddress?.slice(0, 6)}...{assetAddress?.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-xs">Author</span>
                      <span className="font-mono text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                        {assetData?.author?.slice(0, 6)}...{assetData?.author?.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Value proposition - compact */}
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                    One-time purchase • Lifetime access
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Dialog - Responsive */}
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center pb-3 sm:pb-4 space-y-2">
                  <div className="mx-auto mb-2 sm:mb-3 p-2 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 w-fit">
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold">Complete Purchase</DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    Confirm your purchase to unlock this content
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 sm:p-6 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-200">Price:</span>
                      <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{pricePerAsset.toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPurchaseDialogOpen(false)}
                    className="w-full sm:w-auto border-2 h-11 sm:h-10 text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePurchase}
                    disabled={isBuying}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-11 sm:h-10 text-sm sm:text-base"
                  >
                    {isBuying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Confirm Purchase
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

  if (contentError) {
    return (
      <div className="px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <FileImage className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Content Not Found</h2>
              <p className="text-muted-foreground mb-6">{contentError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-950 py-0 sm:py-8 px-0 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Card Container - matches EditorPage preview styling */}
        <div className="sm:bg-gray-50 sm:dark:bg-gray-800 sm:rounded-xl sm:shadow-lg overflow-hidden sm:border sm:border-gray-200 sm:dark:border-gray-700">
          <div className="px-4 py-4 sm:p-10 md:p-12 lg:p-16">
            
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100">
                {postTitle}
              </h1>
            </div>

            {/* Metadata */}
            <div className="mb-8 flex flex-wrap items-center justify-end gap-4 text-sm text-muted-foreground pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Published recently</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="text-xs">
                  {assetAddress?.slice(0, 6)}...{assetAddress?.slice(-4)}
                </span>
              </div>
            </div>

            {/* Content - matches EditorPage preview */}
            <div className="min-h-[500px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
                  </div>
                </div>
              ) : previewData ? (
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
  );
};

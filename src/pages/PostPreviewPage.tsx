import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, User, Copy, FileImage, Lock, ShoppingCart, ArrowLeft } from "lucide-react";
import EditorPreview from "@/components/EditorPreview";
import { fetchFileContentByAssetAddress, useAssetCidByAddress, useAssetData, useBuyAsset } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import '../styles/editor.css';
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";

export const PostPreviewPage = () => {
  const { assetAddress } = useParams<{ assetAddress: string }>();
  const { address } = useAccount();
  const navigate = useNavigate();
  const { cid: assetCid, isLoading: isCidLoading, isError: isCidError } = useAssetCidByAddress(assetAddress || '');
  const { assetData, isLoading: isAssetDataLoading, isError: isAssetDataError } = useAssetData(assetCid || '');
  const { buyAsset, isPending: isBuying, isConfirmed: isBuyConfirmed, isError: isBuyError } = useBuyAsset();
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string>("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("1");
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Update post title when asset data is loaded
  useEffect(() => {
    if (assetData && assetData.assetTitle) {
      setPostTitle(assetData.assetTitle);
    }
  }, [assetData]);

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
              
              // Set preview data for EditorPreview component
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
  }, [assetCid, isCidError]);

  const handleCopyCid = async () => {
    if (assetCid) {
      try {
        await navigator.clipboard.writeText(assetCid);
        toast.success("CID copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy CID");
      }
    }
  };

  const handlePurchase = async () => {
    if (!assetAddress || !assetData) return;

    try {
      const costInWei = assetData.costInNativeInWei ? assetData.costInNativeInWei.toString() : "0";
      await buyAsset({
        assetAddress,
        amount: purchaseAmount,
        costInNativeInWei: costInWei
      });
      
      toast.success("Purchase transaction submitted!");
      setIsPurchaseDialogOpen(false);
    } catch (error) {
      console.error('Error purchasing asset:', error);
      toast.error("Failed to purchase asset");
    }
  };

  const handleBackToHome = () => {
    navigate('/app');
  };

  if (isLoading || isCidLoading || isAssetDataLoading) {
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
    const totalPrice = pricePerAsset * parseInt(purchaseAmount);

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={handleBackToHome}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>

            {/* Access Denied Card */}
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 rounded-full bg-muted/50 w-fit">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">Premium Content</CardTitle>
                <p className="text-muted-foreground">
                  This content requires purchase to view
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Asset Information */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">{assetData?.assetTitle || 'Untitled'}</h3>
                  {assetData?.description && (
                    <p className="text-muted-foreground line-clamp-3">
                      {assetData.description}
                    </p>
                  )}
                </div>

                {/* Price Information */}
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {pricePerAsset.toFixed(4)} ETH
                  </div>
                  <p className="text-sm text-muted-foreground">per asset</p>
                </div>

                {/* Purchase Button */}
                <div className="text-center">
                  <Button 
                    onClick={() => setIsPurchaseDialogOpen(true)}
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase to View
                  </Button>
                </div>

                {/* Asset Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asset Address:</span>
                    <span className="font-mono text-xs">
                      {assetAddress?.slice(0, 6)}...{assetAddress?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Author:</span>
                    <span className="font-mono text-xs">
                      {assetData?.author?.slice(0, 6)}...{assetData?.author?.slice(-4)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Dialog */}
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Purchase Asset</DialogTitle>
                  <DialogDescription>
                    Enter the number of assets you want to purchase.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Quantity</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span>Price per asset:</span>
                      <span className="font-semibold">{pricePerAsset.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>{totalPrice.toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPurchaseDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePurchase}
                    disabled={isBuying || !purchaseAmount || parseInt(purchaseAmount) < 1}
                  >
                    {isBuying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  if (contentError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <FileImage className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Content Not Found</h2>
                <p className="text-muted-foreground mb-6">{contentError}</p>
                <Button onClick={handleBackToHome} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto mb-6">
        <Button 
          variant="ghost" 
          onClick={handleBackToHome}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{postTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Published recently</span>
              </div>
              <div className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                <button 
                  onClick={handleCopyCid}
                  className="hover:text-foreground transition-colors"
                >
                  Copy CID
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">
                  {assetAddress?.slice(0, 6)}...{assetAddress?.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="tab-content">
          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
              </div>
            </div>
          ) : previewData ? (
            <EditorPreview 
              data={previewData}
              className="min-h-[400px]"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No content available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

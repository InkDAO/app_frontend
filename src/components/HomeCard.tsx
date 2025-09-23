import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileImage, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBuyAsset, getAssetCost } from "@/services/dXService";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect } from "react";

interface HomeCardProps {
  savedPost: {
    id?: string;
    name?: string;
    cid?: string;
    size?: number;
    created_at?: string;
    keyvalues?: Record<string, string>;
    content?: any;
    contentError?: string | null;
  };
  assetAddress?: string;
}

export const HomeCard = ({ savedPost, assetAddress }: HomeCardProps) => {
  const { name, cid, content, contentError } = savedPost;
  const navigate = useNavigate();
  const { buyAsset, isPending, isConfirmed, isError } = useBuyAsset();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  // Monitor transaction confirmation
  useEffect(() => {
    if (isConfirmed && isBuying) {
      setIsBuying(false);
      toast.success("Asset purchased successfully!");
      setIsDialogOpen(false);
    }
  }, [isConfirmed, isBuying]);

  // Monitor transaction errors
  useEffect(() => {
    if (isError && isBuying) {
      setIsBuying(false);
      toast.error("Transaction failed. Please try again.");
    }
  }, [isError, isBuying]);
  
  // Get asset cost from smart contract
  const costInWei = getAssetCost(assetAddress || '');
  const pricePerAsset = costInWei ? parseFloat(costInWei.toString()) / 1e18 : 0; // Convert from wei to ETH with decimals

  let postTitle = (name && name.trim()) ? name.trim() : 'Untitled';
  let postImage: string | null = null;
  let postPreview: string | null = null;
  let editorContent = null;

  if (content && !contentError) {
    try {
      const contentData = typeof content === 'string' ? JSON.parse(content) : content;
      
      if (contentData.title && contentData.title.trim()) {
        postTitle = contentData.title.trim();
      } else {
        postTitle = 'Untitled';
      }
      
      if (contentData.content && contentData.content.blocks) {
        editorContent = contentData.content;
      } else if (contentData.blocks) {
        editorContent = contentData;
      } else if (contentData.content && typeof contentData.content === 'object') {
        try {
          const nestedContent = typeof contentData.content === 'string' 
            ? JSON.parse(contentData.content) 
            : contentData.content;
          if (nestedContent.blocks) {
            editorContent = nestedContent;
          }
        } catch (e) {
          console.warn('Failed to parse nested content:', e);
        }
      }

      if (editorContent && editorContent.blocks && Array.isArray(editorContent.blocks)) {
        const imageBlock = editorContent.blocks.find((block: any) => 
          block.type === 'image' && block.data && (block.data.file?.url || block.data.url)
        );
        if (imageBlock) {
          postImage = imageBlock.data.file?.url || imageBlock.data.url;
        }
      }

      if (editorContent && editorContent.blocks && Array.isArray(editorContent.blocks)) {
        let previewText = '';
        for (const block of editorContent.blocks) {
          if (previewText.length >= 200) break;
          let blockText = '';
          switch (block.type) {
            case 'paragraph': blockText = block.data?.text || ''; break;
            case 'header': blockText = block.data?.text || ''; break;
            case 'quote': blockText = block.data?.text || ''; break;
            case 'list':
              if (block.data?.items && Array.isArray(block.data.items)) {
                blockText = block.data.items.map((item: any) => item).join(' ');
              }
              break;
            case 'code': blockText = block.data?.code || ''; break;
            default: break;
          }
          previewText += (previewText.length > 0 ? ' ' : '') + blockText;
        }
        postPreview = previewText.length > 200 ? previewText.substring(0, 200) + '...' : previewText;
      }
    } catch (error) {
      console.warn('Failed to parse content for preview:', error);
    }
  }

  const handleCardClick = () => {
    if (!assetAddress) return;
    navigate(`/app/post/${assetAddress}`);
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsDialogOpen(true);
  };

  const handleAmountChange = (value: number) => {
    if (value >= 1) {
      setAmount(value);
    }
  };

  const handleConfirmBuy = async () => {
    if (!cid) {
      toast.error("No asset CID available");
      return;
    }

    setIsBuying(true);
    try {
      await buyAsset({
        assetCid: cid,
        amount: amount.toString(),
        costInNativeInWei: costInWei.toString()
      });
      
      toast.success("Asset purchase initiated! Please confirm the transaction in your wallet.");
      // Don't set isBuying to false here - let the useEffect handle it when transaction is confirmed
    } catch (error: any) {
      console.error('Error buying asset:', error);
      toast.error(error.message || "Failed to purchase asset");
      setIsBuying(false);
    }
  };

  // Calculate total price using actual asset cost
  const totalPrice = amount * pricePerAsset;

  return (
    <Card 
      className="w-full max-w-sm hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative h-48 bg-muted/30 overflow-hidden flex items-center justify-center">
        {postImage ? (
          <img 
            src={postImage} 
            alt={postTitle}
            className="group-hover:scale-105 transition-transform duration-300 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80">
            <FileImage className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Buy Button - Top Right */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleBuyClick}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 shadow-lg"
              >
                <ShoppingCart className="h-3 w-3" />
                Buy
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="sm:max-w-sm max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <DialogHeader>
                <DialogTitle>Purchase Asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price per asset: {pricePerAsset.toFixed(4)} ETH</label>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Amount to purchase:</label>
                    <Input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => handleAmountChange(parseInt(e.target.value) || 1)}
                      className="text-center w-20"
                    />
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Price:</span>
                      <span className="text-lg font-bold">{totalPrice.toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDialogOpen(false);
                    }}
                    className="flex-1"
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isBuying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Confirm Purchase
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {postTitle}
          </h3>
        </div>

        {postPreview && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5">
              {postPreview}
            </p>
          </div>
        )}

        {contentError && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            Failed to load content
          </div>
        )}
      </CardContent>
    </Card>
  );
};

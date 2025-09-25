import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Asset } from "@/types";
import { useAddComment } from "@/services/dXService";
import { fetchFromIPFS, handleGetFileMetadataByCid, handleGetGroupByName, handleUpload } from "@/services/pinataService";
import { Eye, MessageSquare, X, Loader2, Calendar, User, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useAccount } from "wagmi";
import { RichTextArea } from "./RichTextArea";
import { RichTextRenderer } from "./RichTextRenderer";

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard = ({ asset }: AssetCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [assetContent, setAssetContent] = useState<string>("");
  const [postImage, setPostImage] = useState<string>("");
  const [thumbnailImage, setThumbnailImage] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { address, isConnected } = useAccount();
  const { addComment, isPending, isSuccess, isError, isConfirming, isConfirmed, hash } = useAddComment();
  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);


  // Fetch hashtags immediately for display in collapsed state
  useEffect(() => {
    const fetchHashtags = async () => {
      if (hashtags.length === 0) {
        try {
          const fileMetadata = await handleGetFileMetadataByCid(asset.assetCid);
          
          // Extract hashtags from metadata
          if (fileMetadata.success && fileMetadata.keyvalues) {
            const extractedHashtags = Object.keys(fileMetadata.keyvalues).filter(key => key.trim().length > 0);
            setHashtags(extractedHashtags);
          }
        } catch (error) {
          console.error('Failed to fetch hashtags:', error);
        }
      }
    };

    fetchHashtags();
  }, [asset.assetCid, hashtags.length]);

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

  // Fetch IPFS content when post opens
  useEffect(() => {
    const fetchContent = async () => {
      if (isOpen && !assetContent) {
        setIsLoadingContent(true);
        setContentError(null);
        
        try {
          const contentResult = await fetchFromIPFS(asset.assetCid);

          // Handle content result
          if (contentResult.success && contentResult.content) {
            try {
              // Parse the JSON response that contains title and content
              const parsedResponse = JSON.parse(contentResult.content);
              if (parsedResponse.content) {
                // Extract only the content part
                setAssetContent(parsedResponse.content);
              } else {
                // Fallback to the original content if structure is different
                setAssetContent(contentResult.content);
              }
            } catch (error) {
              // If parsing fails, use the content as-is
              setAssetContent(contentResult.content);
            }
          } else {
            setContentError(contentResult.error || 'Failed to load content');
          }
        } catch (error) {
          setContentError('Failed to load content from IPFS');
        } finally {
          setIsLoadingContent(false);
        }
      }
    };

    fetchContent();
  }, [isOpen, asset.assetCid, assetContent]);

  // Reset success flag when starting a new transaction
  useEffect(() => {
    if (isPending) {
      setHasShownSuccess(false);
    }
  }, [isPending]);

  // Handle success state
  useEffect(() => {
    if (isConfirmed && !hasShownSuccess) {
      setComment("");
      setIsSubmittingComment(false);
      toast.success("Comment added successfully!", {
        description: (
          <div>
            Transaction:
            <a 
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline ml-2"
            >
              {hash}
            </a>
          </div>
        ),
        duration: 5000,
      });
      setHasShownSuccess(true);
      handleCloseCommentOverlay();
    }
  }, [isConfirmed, hash, hasShownSuccess]);

  // Handle error state
  useEffect(() => {
    if (isError) {
      setIsSubmittingComment(false);
      toast.error("Failed to comment. Please try again.");
    }
  }, [isError]);

  const handleCommentSubmit = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to post a comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    // Set loading state immediately
    setIsSubmittingComment(true);

    try {
      const groupResponse = await handleGetGroupByName(asset.assetCid.slice(0, 50));
      if (groupResponse.error) {
        throw new Error(`Failed to get group by name: ${groupResponse.error}`);
      }
      const groupId = groupResponse.group?.id || "";

      const commentFile = new File([comment.trim()], comment.trim().slice(0, 50), {
        type: "application/json" 
      });
      const commentResult = await handleUpload(comment.trim().slice(0, 50), groupId, commentFile, "comment");
      let commentCid = "";
      if (commentResult.success) {
        commentCid = commentResult.cid || "";
      } else {
        throw new Error(`Comment upload failed: ${commentResult.error}`);
      }

      await addComment({ 
        assetCid: asset.assetCid,
        comment: comment.trim()
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      setIsSubmittingComment(false);
    }
  };

  const handleCloseCommentOverlay = () => {
    setComment("");
  };

  const isButtonDisabled = isPending || isConfirming || !isConnected || isSubmittingComment;

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  // Helper function to get title parts for inline display
  const getTitleParts = () => {
    const maxLength = 50; // Character limit for smaller screens
    
    // Always show full title when expanded or when user clicked show more
    if (showFullTitle || isOpen) {
      return { displayTitle: asset.assetTitle, needsShowMore: false };
    }
    
    // For smaller screens, truncate if needed
    if (asset.assetTitle.length <= maxLength) {
      return { displayTitle: asset.assetTitle, needsShowMore: false };
    }
    
    return { 
      displayTitle: asset.assetTitle.slice(0, maxLength),
      needsShowMore: true 
    };
  };

  // Helper function to determine if content is JSON or plain text
  const renderContent = (content: string) => {
    // Handle empty content
    if (!content || content.trim().length === 0) {
      return (
        <div className="text-muted-foreground italic py-4">
          No content available
        </div>
      );
    }
    
    try {
      // Try to parse as JSON (rich text format)
      const parsed = JSON.parse(content);
      
      // Verify it's an array (Slate.js format)
      if (Array.isArray(parsed)) {
        return <RichTextRenderer content={content} />;
      } else {
        // If it's JSON but not an array, treat as plain text
        return (
          <div className="text-sm md:text-lg whitespace-pre-wrap break-words">
            {content}
          </div>
        );
      }
    } catch (error) {
      // If not JSON, treat as plain text
      return (
        <div className="text-sm md:text-lg whitespace-pre-wrap break-words">
          {content || 'No content'}
        </div>
      );
    }
  };

  // Helper function to truncate tag text with ellipsis
  const truncateTag = (tag: string, maxLength = 10) => {
    if (tag.length <= maxLength) return tag;
    return tag.slice(0, maxLength) + '...';
  };

  // Hashtags component for displaying tags with # prefix
  const renderHashtags = (collapsed = false) => {
    if (!hashtags || hashtags.length === 0) return null;

    if (!collapsed) {
      // Show all hashtags when expanded
      return (
        <div className="flex flex-wrap gap-1 mt-2">
          {hashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-[8px] sm:text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title={tag.length > 8 ? `#${tag}` : undefined}
            >
              #{truncateTag(tag)}
            </span>
          ))}
        </div>
      );
    }

    // For collapsed state: 2 tags on mobile, 3 on larger screens
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {/* Mobile: Show first 2 tags */}
        <div className="flex flex-wrap gap-1 md:hidden">
          {hashtags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-[8px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title={tag.length > 8 ? `#${tag}` : undefined}
            >
              #{truncateTag(tag)}
            </span>
          ))}
          {hashtags.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[8px] font-medium bg-muted text-muted-foreground">
              +{hashtags.length - 2} more
            </span>
          )}
        </div>

        {/* Desktop: Show first 3 tags */}
        <div className="hidden md:flex md:flex-wrap md:gap-1">
          {hashtags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title={tag.length > 8 ? `#${tag}` : undefined}
            >
              #{truncateTag(tag)}
            </span>
          ))}
          {hashtags.length > 5 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              +{hashtags.length - 5} more
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCommentOverlay = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-8">
      <Card className="w-full max-w-4xl mx-4 my-auto">
        <CardHeader className="flex flex-row items-center justify-between px-3 md:px-6">
          <CardTitle>Post Your Comment</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseCommentOverlay}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <div className="px-3 md:px-6">
          <Card className="mb-6 border-l-4 border-l-primary/20">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl md:text-3xl group-hover:text-primary transition-colors break-words leading-tight">
                  {asset.assetTitle}
                </CardTitle>
                
                {/* Hashtags in comment overlay */}
                {hashtags.length > 0 && (
                  <div>
                    {renderHashtags(false)}
                  </div>
                )}
                
                {/* Created by / at information in overlay - positioned after hashtags and right-aligned */}
                <div className="flex flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground justify-end">
                  <div className="flex items-center gap-1 justify-end sm:justify-start">
                    <Calendar className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-1 justify-end sm:justify-start">
                    <User className="h-3 w-3" />
                    <span className="font-mono text-xs">{asset.author.slice(0, 6)}...{asset.author.slice(-4)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAddress(asset.author);
                      }}
                      className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
                      title="Copy address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 pb-6 px-3 md:px-6 break-words">
              {/* Image Section */}
              {isLoadingImage ? (
                <div className="flex items-center justify-center py-8 mb-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading image...</span>
                </div>
              ) : imageError ? (
                <div className="text-red-500 py-4 mb-4">
                  Error loading image: {imageError}
                </div>
              ) : null}

              {/* Content Section */}
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading content...</span>
                </div>
              ) : contentError ? (
                <div className="text-red-500 py-4">
                  Error loading content: {contentError}
                </div>
              ) : (
                renderContent(assetContent)
              )}
            </CardContent>
          </Card>
        </div>

        <CardContent className="px-3 md:px-6">
          <RichTextArea
            placeholder="Write your comment here..."
            className={`min-h-[200px] ${
              (isSubmittingComment || isPending || isConfirming) ? 'cursor-not-allowed select-none pointer-events-none opacity-75' : ''
            }`}
            value={comment}
            onChange={setComment}
            disabled={isButtonDisabled}
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Link to={`/app/post/${asset.assetCid}`} className="flex-1">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full justify-center"
            >
              <Eye className="h-4 w-4" />
              See Comments
            </Button>
          </Link>
          <Button 
            variant="default" 
            className="flex items-center gap-2 flex-1 justify-center"
            disabled={isButtonDisabled}
            onClick={handleCommentSubmit}
          >
            <MessageSquare className="h-4 w-4" />
            {isSubmittingComment ? "Uploading..." : isPending ? "Pending..." : isConfirming ? "Confirming..." : "Post Comment"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <>
      <Card className="mb-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer w-full">
              <CardHeader className="p-0">
                                  <div className={cn(
                    "flex w-full",
                    !isOpen && "min-h-[96px] sm:min-h-[144px] md:min-h-[160px]"
                  )}>
                    <div className={cn(
                      "flex-1 min-w-0 flex flex-col px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3",
                      isOpen ? "space-y-2" : "justify-between"
                    )}>
                      {/* Title content */}
                      <div>
                        <CardTitle className="text-sm md:text-2xl lg:text-3xl group-hover:text-primary transition-colors hyphens-auto leading-tight mb-2">
                          {/* Full title on larger screens */}
                          <span className="hidden md:inline">
                            {asset.assetTitle || 'No title'}
                          </span>
                          
                          {/* Truncated title with show more on smaller screens */}
                          <span className="md:hidden">
                            {(() => {
                              const { displayTitle, needsShowMore } = getTitleParts();
                              return (
                                <>
                                  {displayTitle}
                                  {needsShowMore && (
                                    <>
                                      {"... "}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowFullTitle(true);
                                        }}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors underline"
                                      >
                                        show more
                                      </button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </span>
                        </CardTitle>
                        
                        {/* Description display */}
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {asset.description || 'No description available'}
                        </p>
                        
                        {/* Hashtags display */}
                        {renderHashtags(!isOpen)}
                        
                        {/* Footer content - right after title when expanded */}
                        {isOpen && (
                          <div className="flex flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground justify-end mt-3">
                            <div className="flex items-center gap-1 justify-end sm:justify-start">
                              <Calendar className="h-3 w-3" />
                            </div>
                            <div className="flex items-center gap-1 justify-end sm:justify-start">
                              <User className="h-3 w-3" />
                              <span className="font-mono text-xs">{asset.author.slice(0, 6)}...{asset.author.slice(-4)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyAddress(asset.author);
                                }}
                                className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
                                title="Copy address"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Footer content - flushed to bottom when collapsed */}
                      {!isOpen && (
                        <div className={cn(
                          "flex flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground justify-end",
                          "hidden md:flex"
                        )}>
                          <div className="flex items-center gap-1 justify-end sm:justify-start">
                            <Calendar className="h-3 w-3" />
                          </div>
                          <div className="flex items-center gap-1 justify-end sm:justify-start">
                            <User className="h-3 w-3" />
                            <span className="font-mono text-xs">{asset.author.slice(0, 6)}...{asset.author.slice(-4)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyAddress(asset.author);
                              }}
                              className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
                              title="Copy address"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  
                  {/* Image Thumbnail - Responsive size (hidden when expanded) */}
                  {!isOpen && (
                    <div className="w-24 h-24 sm:w-60 sm:h-36 md:w-72 md:h-40 flex-shrink-0 self-end">
                      {isLoadingThumbnail ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : thumbnailError || !asset.thumbnailCid ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                          <span className="text-muted-foreground text-xs">No thumbnail</span>
                        </div>
                      ) : thumbnailImage ? (
                        <div className="w-full h-full rounded-lg overflow-hidden">
                          <img 
                            src={thumbnailImage} 
                            alt="Asset thumbnail" 
                            className="w-full h-full object-cover"
                            onError={() => {
                              setThumbnailError('Failed to display thumbnail');
                              setThumbnailImage('');
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </CardHeader>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <CardContent className="pt-4 pb-6 px-3 md:px-6 break-words">
              {/* Image Section */}
              {isLoadingImage ? (
                <div className="flex items-center justify-center py-8 mb-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading image...</span>
                </div>
              ) : imageError ? (
                <div className="text-red-500 py-4 mb-4">
                  Error loading image: {imageError}
                </div>
              ) : postImage ? (
                <div className="mb-6">
                  <div className="w-full md:w-4/5 mx-auto aspect-video rounded-lg shadow-md overflow-hidden">
                    <img 
                      src={postImage} 
                      alt="Post image" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        setImageError('Failed to display image');
                        setPostImage('');
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Content Section */}
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading content...</span>
                </div>
              ) : contentError ? (
                <div className="text-red-500 py-4">
                  Error loading content: {contentError}
                </div>
              ) : (
                renderContent(assetContent)
              )}
            </CardContent>
            
            <CardFooter className="flex flex-row justify-end gap-2 md:gap-5 pt-0 pb-6 px-3 md:px-6">
              <Link to={`/app/post/${asset.assetCid}`} className="w-1/2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 w-full justify-center text-sm"
                >
                  <Eye className="h-4 w-4" />
                  See Comments
                </Button>
              </Link>
            </CardFooter>
          </CollapsibleContent>
        </Collapsible>
      </Card>

    </>
  );
};
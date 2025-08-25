import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Post } from "@/types";
import { useAddComment } from "@/services/dXService";
import { fetchFromIPFS, handleGetGroupByName, handleUpload } from "@/services/pinataService";
import { formatDistanceToNow } from "date-fns";
import { Eye, MessageSquare, X, Clock, Loader2, Calendar, User, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useAccount } from "wagmi";
import { RichTextArea } from "./RichTextArea";
import { RichTextRenderer } from "./RichTextRenderer";

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [showCommentOverlay, setShowCommentOverlay] = useState(false);
  const [postContent, setPostContent] = useState<string>("");
  const [postImage, setPostImage] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { address, isConnected } = useAccount();
  const { addComment, isPending, isSuccess, isError, isConfirming, isConfirmed, hash } = useAddComment();
  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);

  // Fetch image immediately for thumbnail display
  useEffect(() => {
    const fetchImage = async () => {
      if (post.imageCid && !postImage) {
        setIsLoadingImage(true);
        setImageError(null);
        
        try {
          const imgResult = await fetchFromIPFS(post.imageCid);
          
          if (imgResult.success && 'content' in imgResult && imgResult.content) {
            // Create image URL using gateway
            const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
            const imageUrl = `https://${gatewayUrl}/ipfs/${post.imageCid}`;
            setPostImage(imageUrl);
          } else {
            setImageError(imgResult.error || 'Failed to load image');
          }
        } catch (error) {
          setImageError('Failed to load image from IPFS');
        } finally {
          setIsLoadingImage(false);
        }
      }
    };

    fetchImage();
  }, [post.imageCid, postImage]);

  // Fetch IPFS content when post opens
  useEffect(() => {
    const fetchContent = async () => {
      if (isOpen && !postContent) {
        setIsLoadingContent(true);
        setContentError(null);
        
        try {
          const contentResult = await fetchFromIPFS(post.postCid);
          
          // Handle content result
          if (contentResult.success && contentResult.content) {
            try {
              // Parse the JSON response that contains title and content
              const parsedResponse = JSON.parse(contentResult.content);
              if (parsedResponse.content) {
                // Extract only the content part
                setPostContent(parsedResponse.content);
              } else {
                // Fallback to the original content if structure is different
                setPostContent(contentResult.content);
              }
            } catch (error) {
              // If parsing fails, use the content as-is
              setPostContent(contentResult.content);
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
  }, [isOpen, post.postCid, postContent]);

  // Reset success flag when starting a new transaction
  useEffect(() => {
    if (isPending) {
      setHasShownSuccess(false);
    }
  }, [isPending]);

  useEffect(() => {
    if (showCommentOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCommentOverlay]);

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
      const groupResponse = await handleGetGroupByName(post.postId.slice(0, 50));
      if (groupResponse.error) {
        throw new Error(`Failed to get group by name: ${groupResponse.error}`);
      }
      const groupId = groupResponse.group?.id || "";

      const commentFile = new File([comment.trim()], comment.trim(), {
        type: "text/plain" 
      });
      const commentResult = await handleUpload(comment.trim(), groupId, commentFile);
      let commentCid = "";
      if (commentResult.success) {
        commentCid = commentResult.cid || "";
      } else {
        throw new Error(`Comment upload failed: ${commentResult.error}`);
      }

      await addComment({ 
        postId: post.postId,
        commentCid
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      setIsSubmittingComment(false);
    }
  };

  const handleOpenCommentOverlay = () => {
    setShowCommentOverlay(true);
  };

  const handleCloseCommentOverlay = () => {
    setShowCommentOverlay(false);
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
    const maxLength = 60; // Character limit for smaller screens
    
    // Always show full title when expanded or when user clicked show more
    if (showFullTitle || isOpen) {
      return { displayTitle: post.postTitle, needsShowMore: false };
    }
    
    // For smaller screens, truncate if needed
    if (post.postTitle.length <= maxLength) {
      return { displayTitle: post.postTitle, needsShowMore: false };
    }
    
    return { 
      displayTitle: post.postTitle.slice(0, maxLength),
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
              <div className="flex flex-col gap-3">
                <CardTitle className="text-2xl md:text-3xl group-hover:text-primary transition-colors break-words leading-tight">
                  {post.postTitle}
                </CardTitle>
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
              ) : postImage ? (
                <div className="mb-6">
                  <div className="w-full md:w-6/7 mx-auto aspect-video rounded-lg shadow-md overflow-hidden">
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
                renderContent(postContent)
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
          <Link to={`/app/post/${post.postId}`} className="flex-1">
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
                    !isOpen && "min-h-[128px] sm:min-h-[144px] md:min-h-[160px]"
                  )}>
                    <div className={cn(
                      "flex-1 min-w-0 flex flex-col px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3",
                      isOpen ? "space-y-2" : "justify-between"
                    )}>
                      {/* Title content */}
                      <div>
                        <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl group-hover:text-primary transition-colors break-all hyphens-auto leading-tight mb-2">
                          {/* Full title on larger screens */}
                          <span className="hidden md:inline">
                            {post.postTitle}
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
                        
                        {/* Footer content - right after title when expanded */}
                        {isOpen && (
                          <div className="flex flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground justify-end">
                            <div className="flex items-center gap-1 justify-end sm:justify-start">
                              <Calendar className="h-3 w-3" />
                              <span>created {formatDistanceToNow(new Date(Number(post.endTime) * 1000 - 7 * 24 * 60 * 60 * 1000), { addSuffix: true, includeSeconds: false }).replace('about ', '')}</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end sm:justify-start">
                              <User className="h-3 w-3" />
                              <span className="font-mono text-xs">{post.owner.slice(0, 6)}...{post.owner.slice(-4)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyAddress(post.owner);
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
                      
                      {/* Footer content - at bottom when collapsed */}
                      {!isOpen && (
                        <div className={cn(
                          "flex flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground justify-end",
                          "hidden md:flex"
                        )}>
                          <div className="flex items-center gap-1 justify-end sm:justify-start">
                            <Calendar className="h-3 w-3" />
                            <span>created {formatDistanceToNow(new Date(Number(post.endTime) * 1000 - 7 * 24 * 60 * 60 * 1000), { addSuffix: true, includeSeconds: false }).replace('about ', '')}</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end sm:justify-start">
                            <User className="h-3 w-3" />
                            <span className="font-mono text-xs">{post.owner.slice(0, 6)}...{post.owner.slice(-4)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyAddress(post.owner);
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
                    <div className="w-48 sm:w-56 md:w-64 h-32 sm:h-36 md:h-40 flex-shrink-0">
                      {isLoadingImage ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : imageError || !post.imageCid ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-xs">No image</span>
                        </div>
                      ) : postImage ? (
                        <div className="w-full h-full overflow-hidden">
                          <img 
                            src={postImage} 
                            alt="Post thumbnail" 
                            className="w-full h-full object-cover"
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
                  <div className="w-full md:w-6/7 mx-auto aspect-video rounded-lg shadow-md overflow-hidden">
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
                renderContent(postContent)
              )}
            </CardContent>
            
            <CardFooter className="flex flex-row justify-end gap-2 md:gap-5 pt-0 pb-6 px-3 md:px-6">
              <Link to={`/app/post/${post.postId}`} className="w-1/2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 w-full justify-center text-sm"
                >
                  <Eye className="h-4 w-4" />
                  See Comments
                </Button>
              </Link>
              {!post.archived && (
                <Button 
                  variant="default"
                  className="flex items-center gap-2 w-1/2 justify-center text-sm"
                  disabled={!isConnected}
                  onClick={handleOpenCommentOverlay}
                >
                  <MessageSquare className="h-4 w-4" />
                  Post Comment
                </Button>
              )}
            </CardFooter>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {showCommentOverlay && renderCommentOverlay()}
    </>
  );
};
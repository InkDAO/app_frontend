import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Post } from "@/types";
import { useAddComment } from "@/services/dXService";
import { fetchFromIPFS, handleGetGroupByName, handleUpload } from "@/services/pinataService";
import { formatDistanceToNow } from "date-fns";
import { Eye, ChevronDown, MessageSquare, X, Clock, Loader2 } from "lucide-react";
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
  const { address, isConnected } = useAccount();
  const { addComment, isPending, isSuccess, isError, isConfirming, isConfirmed, hash } = useAddComment();
  const [hasShownSuccess, setHasShownSuccess] = useState(false);

  // Fetch IPFS content and image when post opens
  useEffect(() => {
    const fetchContent = async () => {
      if (isOpen && !postContent) {
        setIsLoadingContent(true);
        setIsLoadingImage(true);
        setContentError(null);
        setImageError(null);
        
        try {
          // Fetch image and content in parallel
          const [imgResult, contentResult] = await Promise.all([
            post.imageCid ? fetchFromIPFS(post.imageCid) : Promise.resolve({ success: false, error: 'No image CID' }),
            fetchFromIPFS(post.postCid)
          ]);
          
          // Handle image result
          if (imgResult.success && 'content' in imgResult && imgResult.content) {
            // Create image URL using gateway
            const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
            const imageUrl = `https://${gatewayUrl}/ipfs/${post.imageCid}`;
            setPostImage(imageUrl);
          } else if (post.imageCid) {
            setImageError(imgResult.error || 'Failed to load image');
          }
          
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
          setImageError('Failed to load image from IPFS');
        } finally {
          setIsLoadingContent(false);
          setIsLoadingImage(false);
        }
      }
    };

    fetchContent();
  }, [isOpen, post.postCid, post.imageCid, postContent]);

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
    }
  };

  const handleOpenCommentOverlay = () => {
    setShowCommentOverlay(true);
  };

  const handleCloseCommentOverlay = () => {
    setShowCommentOverlay(false);
    setComment("");
  };

  const isButtonDisabled = isPending || isConfirming || !isConnected;

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
              <div className="flex flex-col gap-2">
                <CardTitle className="text-xl md:text-2xl group-hover:text-primary transition-colors break-words">
                  {post.postTitle}
                </CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                  {new Date(Number(post.endTime) * 1000) > new Date() ? 'Archive' : 'Archived'}{' '}
                  {formatDistanceToNow(new Date(Number(post.endTime) * 1000), { addSuffix: true })}
                  </span>
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
              ) : postImage ? (
                <div className="mb-6">
                  <div className="w-full max-w-2xl mx-auto aspect-video rounded-lg shadow-md overflow-hidden">
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
            className="min-h-[200px]"
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
            {isPending ? "Pending..." : isConfirming ? "Confirming..." : "Post Comment"}
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
            <div className="cursor-pointer">
              <CardHeader className="pb-2 px-3 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl md:text-2xl group-hover:text-primary transition-colors break-words">
                      {post.postTitle}
                    </CardTitle>
                    <div className="mt-2 text-sm text-muted-foreground">
                    <span>
                      {new Date(Number(post.endTime) * 1000) > new Date() ? 'Archive' : 'Archived'}{' '}
                      {formatDistanceToNow(new Date(Number(post.endTime) * 1000), { addSuffix: true })}
                    </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    <ChevronDown className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200",
                      isOpen && "transform rotate-180"
                    )} />
                  </div>
                </div>
              </CardHeader>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
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
                  <div className="w-full max-w-2xl mx-auto aspect-video rounded-lg shadow-md overflow-hidden">
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
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { CommentForm } from "@/components/CommentForm";
import { Post, Comment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Clock, Loader2 } from "lucide-react";
import { CommentCard } from "@/components/CommentCard";
import { RichTextRenderer } from "@/components/RichTextRenderer";
import { fetchFromIPFS } from "@/services/pinataService";
import { useReadContract } from "wagmi"
import { maxterdXConfig } from "@/contracts/MasterdX";

export const PostInfoPage = () => {
  
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postContent, setPostContent] = useState<string>("");
  const [postImage, setPostImage] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { data: postInfo, isLoading: isPostLoading } = useReadContract({
    address: maxterdXConfig.address as `0x${string}`,
    abi: maxterdXConfig.abi,
    functionName: "getPostInfo",
    args: [id as `0x${string}`],
  });

  const { data: commentsInfo, isLoading: isCommentsLoading, refetch: refetchComments } = useReadContract({
    address: maxterdXConfig.address as `0x${string}`,
    abi: maxterdXConfig.abi,
    functionName: "getCommentsInfo",
    args: [id as `0x${string}`],
  });

  useEffect(() => {
    if (postInfo) {
      const convertedPost: Post = {
        postId: postInfo.postId,
        postTitle: postInfo.postTitle,
        postCid: postInfo.postcid,
        imageCid: postInfo.imagecid,
        owner: postInfo.owner,
        endTime: postInfo.endTime.toString(), // Convert bigint to string
        archived: postInfo.archived
      };
      setPost(convertedPost);
    }
  }, [postInfo]);

  useEffect(() => {
    if (commentsInfo) {
      const convertedComments: Comment[] = commentsInfo.map((comment: any) => ({
        postId: comment.postId,
        commentCid: comment.commentcid,
        owner: comment.owner
      }));
      setComments(convertedComments);
    }
  }, [commentsInfo]);

  useEffect(() => {
    setIsLoading(isPostLoading || isCommentsLoading);
  }, [isPostLoading, isCommentsLoading]);

  // Fetch IPFS content when post is loaded
  useEffect(() => {
    const fetchContent = async () => {
      
      // Force fetch for testing (ignore current postContent)
      if (post) {
        setIsLoadingContent(true);
        setIsLoadingImage(true);
        setContentError(null);
        setImageError(null);
        
        try {
          // Fetch image and content in parallel
          const [imgResult, contentResult] = await Promise.all([
            fetchFromIPFS(post.imageCid),
            fetchFromIPFS(post.postCid)
          ]);
          
          // Handle image result
          if (imgResult.success && imgResult.content) {
            // Create a data URL for the image
            const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
            const imageUrl = `https://${gatewayUrl}/ipfs/${post.imageCid}`;
            setPostImage(imageUrl);
          } else {
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
  }, [post, postContent]);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6 max-w-7xl">
        {isLoading ? (
          <div className="flex justify-center items-center py-4 md:py-8">
            <div className="w-full space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted/50 rounded-lg border border-border">
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-muted rounded w-1/4" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : post ? (
          <div>
            <Card className="mb-6 border-l-4 border-l-primary/20">
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-xl md:text-2xl font-semibold line-clamp-2">{post.postTitle}</CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(Number(post.endTime) * 1000) > new Date() ? 'Archive' : 'Archived'}{' '}
                      {formatDistanceToNow(new Date(Number(post.endTime) * 1000), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 pb-6">
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
                  renderContent(postContent)
                )}
              </CardContent>
            </Card>

            <CommentForm postId={id as string} onCommentAdded={() => {
              refetchComments();
            }} />

            <h2 className="text-xl font-bold mb-4 mt-8">
              Comments
            </h2>

            {comments.length > 0 ? (
              comments.map((comment) => (
                <CommentCard key={comment.postId} comment={comment} postTitle=""/>
              ))
            ) : (
              <div className="text-center py-10 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Post not found</p>
          </div>
        )}
      </main>
    </div>
  );
};
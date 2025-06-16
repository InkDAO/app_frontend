import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { CommentForm } from "@/components/CommentForm";
import { Post, Comment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { CommentCard } from "@/components/CommentCard";
import { RichTextRenderer } from "@/components/RichTextRenderer";
import { useReadContract } from "wagmi"
import { maxterdXConfig } from "@/contracts/MasterdX";

export const PostInfoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        postBody: postInfo.postBody,
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
        comment: comment.comment,
        owner: comment.owner
      }));
      setComments(convertedComments);
    }
  }, [commentsInfo]);

  useEffect(() => {
    setIsLoading(isPostLoading || isCommentsLoading);
  }, [isPostLoading, isCommentsLoading]);

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
                <RichTextRenderer content={post.postBody} />
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
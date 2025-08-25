import { Comment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextRenderer } from "./RichTextRenderer";
import { Link } from "react-router-dom";
import { fetchFromIPFS } from "@/services/pinataService";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CommentCardProps {
  comment: Comment;
  postTitle: string;
}

export const CommentCard = ({ comment, postTitle }: CommentCardProps) => {
  const [commentContent, setCommentContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const content = await fetchFromIPFS(comment.commentCid);
        if (content.success && content.content) {
          setCommentContent(content.content);
        } else {
          setError(content.error || "Failed to load comment");
        }
      } catch (err) {
        setError("Failed to load comment");
      } finally {
        setIsLoading(false);
      }
    }
    fetchContent();
  }, [comment.commentCid]);

  // Helper function to determine if content is JSON or plain text
  const renderContent = (content: string) => {
    // Handle empty content
    if (!content || content.trim().length === 0) {
      return <p className="text-muted-foreground italic">No content available</p>;
    }

    try {
      const parsed = JSON.parse(content);
      // Check if it's an array (Slate.js format)
      if (Array.isArray(parsed)) {
        return <RichTextRenderer content={content} />;
      }
      // If it's an object, it might be plain text wrapped in JSON
      return <p className="whitespace-pre-wrap break-words">{content}</p>;
    } catch (error) {
      // Not valid JSON, treat as plain text
      return <p className="whitespace-pre-wrap break-words">{content}</p>;
    }
  };

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
      {postTitle && (
        <CardHeader className="pb-2 px-3 md:px-6">
          <Link to={`/app/post/${comment.postId}`}>
            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {postTitle}
            </CardTitle>
          </Link>
        </CardHeader>
      )}
      <CardContent className="pt-4 pb-6 px-3 md:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading comment...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          renderContent(commentContent)
        )}
      </CardContent>
    </Card>
  );
};
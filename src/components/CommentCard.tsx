import { Comment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextRenderer } from "./RichTextRenderer";
import { Link } from "react-router-dom";
import { fetchFromIPFS } from "@/services/pinataService";
import { useEffect, useState } from "react";

interface CommentCardProps {
  comment: Comment;
  postTitle: string;
}

export const CommentCard = ({ comment, postTitle }: CommentCardProps) => {
  const [commentContent, setCommentContent] = useState<string>("");

  useEffect(() => {
    const fetchContent = async () => {
      const content = await fetchFromIPFS(comment.commentCid);
      if (content.success && content.content) {
        setCommentContent(content.content);
      }
    }
    fetchContent();
  }, [comment.commentCid]);

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
        <RichTextRenderer content={commentContent} />
      </CardContent>
    </Card>
  );
};
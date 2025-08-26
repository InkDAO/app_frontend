import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAddComment } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { RichTextArea } from "./RichTextArea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { MessageSquare } from "lucide-react";
import { handleGetGroupByName, handleUpload } from "@/services/pinataService";

interface CommentFormProps {
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentForm = ({ postId, onCommentAdded }: CommentFormProps) => {
  const [comment, setComment] = useState("");
  const { isConnected } = useAccount();
  const [resetKey, setResetKey] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { addComment, isPending, isSuccess, isError, isConfirming, isConfirmed, hash } = useAddComment();
  const [hasShownSuccess, setHasShownSuccess] = useState(false);

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
      setResetKey(prev => prev + 1);
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
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    }
  }, [isConfirmed, onCommentAdded, hash, hasShownSuccess]);

  // Handle error state
  useEffect(() => {
    if (isError) {
      setIsSubmittingComment(false);
      toast.error("Failed to comment. Please try again.");
    }
  }, [isError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const groupResponse = await handleGetGroupByName(postId.slice(0, 50));
      if (groupResponse.error) {
        throw new Error(`Failed to get group by name: ${groupResponse.error}`);
      }
      const groupId = groupResponse.group?.id || "";

      const commentFile = new File([comment.trim()], comment.trim(), {
        type: "text/plain" 
      });
      const commentResult = await handleUpload(comment.trim(), groupId, commentFile, "comment");
      let commentCid = "";
      if (commentResult.success) {
        commentCid = commentResult.cid || "";
      } else {
        throw new Error(`Comment upload failed: ${commentResult.error}`);
      }
      
      await addComment({ 
        postId,
        commentCid
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      setIsSubmittingComment(false);
    }
  };

  const isButtonDisabled = isPending || isConfirming || !isConnected || isSubmittingComment;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Write Comments</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <form onSubmit={handleSubmit}>
          <RichTextArea
            placeholder="Add Comments..."
            value={comment}
            onChange={setComment}
            className={`min-h-60 resize-none overflow-hidden mb-4 ${
              (isSubmittingComment || isPending || isConfirming) ? 'cursor-not-allowed select-none pointer-events-none opacity-75' : ''
            }`}
            disabled={isButtonDisabled}
            key={resetKey}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              variant="default"
              disabled={isButtonDisabled}
            >
              <MessageSquare className="h-4 w-4" />
              {isSubmittingComment ? "Uploading..." : isPending ? "Pending..." : isConfirming ? "Confirming..." : "Comment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
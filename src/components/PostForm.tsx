import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAddPost } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { RichTextArea } from "./RichTextArea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { MessageSquare } from "lucide-react";
import { Textarea } from "./ui/textarea";

interface PostFormProps {
  onPostAdded?: () => void;
}

export const PostForm = ({ onPostAdded }: PostFormProps) => {
  const [title, setTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const { isConnected } = useAccount();
  const [resetKey, setResetKey] = useState(0);
  const { addPost, isPending, isSuccess, isError, isConfirming, isConfirmed, hash } = useAddPost();
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
      setTitle("");
      setPostBody("");
      setResetKey(prev => prev + 1);
      toast.success("Post added successfully!", {
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
      
      if (onPostAdded) {
        onPostAdded();
      }
    }
  }, [isConfirmed, onPostAdded, hash, hasShownSuccess]);

  // Handle error state
  useEffect(() => {
    if (isError) {
      toast.error("Failed to post. Please try again.");
    }
  }, [isError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error("Please connect your wallet to ask a post");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    if (title.length > 100) {
      toast.error("Title must not exceed 100 characters");
      return;
    }
    
    if (!postBody.trim()) {
      toast.error("Please enter a post");
      return;
    }
    
    try {
      await addPost({ 
        postTitle: title.trim(), 
        postBody: postBody.trim(), 
      });
    } catch (error) {
      console.error("Error posting post:", error);
    }
  };

  const isButtonDisabled = isPending || isConfirming || !isConnected;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Share Your Thoughts</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Enter Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isButtonDisabled}
              className="mb-1 text-xs md:text-xl h-auto overflow-hidden"
              maxLength={100}
            />
            <div className={`flex justify-end text-sm mb-4 ${title.length >= 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {title.length}/100
            </div>
          <RichTextArea
            placeholder="Share anything anonymously..."
            value={postBody}
            onChange={setPostBody}
            className="min-h-80 resize-none overflow-hidden mb-4"
            disabled={isButtonDisabled}
            key={resetKey}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end">
            <Button 
              type="submit" 
              variant="default"
              disabled={isButtonDisabled}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="h-4 w-4" />
              {isPending ? "Pending..." : isConfirming ? "Confirming..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
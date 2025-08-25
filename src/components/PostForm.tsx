import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAddPost } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { RichTextArea } from "./RichTextArea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { MessageSquare } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { handleCreateGroup, handleUpload, UploadResult } from "@/services/pinataService";
import { ImageUpload } from "./ImageUpload";
import { ethers } from "ethers";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import { useNavigate } from "react-router-dom";

interface PostFormProps {
  onPostAdded?: () => void;
}

export const PostForm = ({ onPostAdded }: PostFormProps) => {
  const [title, setTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string>("");
  const { isConnected } = useAccount();
  const [resetKey, setResetKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { addPost, isPending, isSuccess, isError, isConfirming, isConfirmed, hash } = useAddPost();
  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const navigate = useNavigate();

  // Utility function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

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
      setSelectedImageFile(null);
      setResetKey(prev => prev + 1);
      setIsUploading(false);
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
      
      // Navigate to the newly created post
      if (currentPostId) {
        navigate(`/app/post/${currentPostId}`);
      }
    }
  }, [isConfirmed, onPostAdded, hash, hasShownSuccess, navigate, currentPostId]);

  // Handle error state
  useEffect(() => {
    if (isError) {
      setIsUploading(false);
      toast.error("Failed to post. Please try again.");
    }
  }, [isError]);

  const handleImageSelected = (file: File) => {
    setSelectedImageFile(file);
  };

  const handleImageRemoved = () => {
    setSelectedImageFile(null);
  };

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
    
    // Set loading state immediately
    setIsUploading(true);
    
    try {
      let imageBase64 = "";
      if (selectedImageFile) {
        imageBase64 = await convertFileToBase64(selectedImageFile);
      }

      const postIdInput = selectedImageFile 
        ? ethers.solidityPacked(['string', 'string', 'string'], [title.trim(), postBody.trim(), imageBase64])
        : ethers.solidityPacked(['string', 'string'], [title.trim(), postBody.trim()]);
      
      const postId = ethers.keccak256(postIdInput);
      
      // Store the postId for navigation after success
      setCurrentPostId(postId);

      const groupResponse = await handleCreateGroup(postId.slice(0, 50));
      if (groupResponse.error) {
        throw new Error(`Failed to create group: ${groupResponse.error}`);
      }
      const groupId = groupResponse.group?.id || "";

      let imageCid = "";
      let postBodyCid = "";

      if (selectedImageFile && imageBase64) {
        const binaryString = atob(imageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: selectedImageFile.type });
        const imageFile = new File([blob], 'image.png', { 
          type: selectedImageFile.type 
        });
        const imageResult = await handleUpload('image.png', groupId, imageFile);
        
        if (imageResult.success) {
          imageCid = imageResult.cid || "";
        } else {
          throw new Error(`Image upload failed: ${imageResult.error}`);
        }
      }

      const postContent = JSON.stringify({
        title: title.trim(),
        content: postBody.trim()
      });

      // Create file with JSON content
      const postFile = new File([postContent], title.trim().slice(0, 50), {
        type: "application/json"
      });
      const postResult = await handleUpload(title.trim().slice(0, 50), groupId, postFile);
      
      if (postResult.success) {
        postBodyCid = postResult.cid || "";
      } else {
        throw new Error(`Post upload failed: ${postResult.error}`);
      }

      await addPost({
        postId,
        postTitle: title.trim(),
        postCid: postBodyCid,
        imageCid: imageCid
      });
      
    } catch (error) {
      console.error("Error in post submission flow:", error);
      toast.error(`Post submission failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsUploading(false);
    }
  };

  const isButtonDisabled = isPending || isConfirming || !isConnected || isUploading;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Share Your Thoughts</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <form onSubmit={handleSubmit}>
          {/* Top row: Image Upload and Title */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
                         {/* Title Section - Right Half */}
             <div className="w-full md:w-2/3 flex flex-col h-[200px]">
               {/* Title text area with integrated label */}
               <div className="flex-1 flex flex-col relative">
                 <div className="relative flex-1">
                   {/* Title label inside the textarea */}
                   <div className="absolute top-3 left-0 right-0 pointer-events-none z-10">
                     <div className="text-center">
                       <span className="text-3xl font-semibold text-muted-foreground bg-background px-3 py-1">
                          Post Title
                       </span>
                     </div>
                                            {/* Horizontal line */}
                       <div className="mt-2 mx-4">
                         <div className="h-px bg-border"></div>
                       </div>
                   </div>
                   {/* Character count inside the textarea */}
                   <div className="absolute bottom-2 right-3 pointer-events-none z-10">
                     <span className={`text-xs px-2 py-1 rounded bg-background/80'}`}>
                       {title.length}/100
                     </span>
                   </div>
                                     <Textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isButtonDisabled}
                    readOnly={isUploading || isPending || isConfirming}
                    className={`text-xs md:text-xl resize-none h-full pt-16 pb-8 pr-16 ${
                      (isUploading || isPending || isConfirming) ? 'cursor-not-allowed select-none pointer-events-none' : ''
                    }`}
                    maxLength={100}
                  />
                 </div>
               </div>
             </div>

            {/* Image Upload Section - Left Half */}
            <div className={`w-full md:w-1/3 ${
              (isUploading || isPending || isConfirming) ? 'pointer-events-none opacity-75' : ''
            }`}>
              <ImageUpload
                onImageSelected={handleImageSelected}
                onImageRemoved={handleImageRemoved}
                disabled={isButtonDisabled}
                className="h-full min-h-[200px]"
                key={resetKey}
              />
            </div>
          </div>

          {/* Bottom: Rich Text Editor - Full Width */}
          <div className="mb-4">
            <RichTextArea
              placeholder="Share anything anonymously..."
              value={postBody}
              onChange={setPostBody}
              className={`min-h-80 resize-none overflow-hidden ${
                (isUploading || isPending || isConfirming) ? 'cursor-not-allowed select-none pointer-events-none opacity-75' : ''
              }`}
              disabled={isButtonDisabled}
              key={resetKey}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end">
            <Button 
              type="submit" 
              variant="default"
              disabled={isButtonDisabled}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="h-4 w-4" />
              {isUploading ? "Uploading..." : isPending ? "Pending..." : isConfirming ? "Confirming..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
import { maxterdXConfig } from "@/contracts/MasterdX";
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useState, useEffect } from "react";
import { CommentWithPostTitle } from "@/types";

export const useAddPost = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const addPost = async (postData: { postTitle: string, postBody: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    try {
      await writeContract({
        address: maxterdXConfig.address as `0x${string}`,
        abi: maxterdXConfig.abi,
        functionName: 'addPost',
        args: [postData.postTitle, postData.postBody],
        account: address,
        chain: sepolia,
      });

    } catch (error: any) {
      console.error("Error in addPost:", error);
      // Handle specific mobile wallet errors
      if (error.message?.includes("user rejected")) {
        throw new Error("Transaction was rejected by user");
      }
      throw error;
    }
  };

  return {
    addPost,
    isPending,
    isSuccess,
    isError,
    isConfirming,
    isConfirmed,
    hash
  };
};

export const useAddComment = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const addComment = async (commentData: { postId: string, comment: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    try {
      await writeContract({
        address: maxterdXConfig.address as `0x${string}`,
        abi: maxterdXConfig.abi,
        functionName: 'addComment',
        args: [commentData.postId as `0x${string}`, commentData.comment],
        account: address,
        chain: sepolia,
      });

    } catch (error: any) {
      console.error("Error in addComment:", error);
      // Handle specific mobile wallet errors
      if (error.message?.includes("user rejected")) {
        throw new Error("Transaction was rejected by user");
      }
      throw error;
    }
  };

  return {
    addComment,
    isPending,
    isSuccess,
    isError,
    isConfirming,
    isConfirmed,
    hash
  };
};

export const useGetUserComments = (owner: string) => {
  const { data: numOfPosts } = useReadContract({
    address: maxterdXConfig.address as `0x${string}`,
    abi: maxterdXConfig.abi,
    functionName: 'totalPosts',
  });

  const [userComments, setUserComments] = useState<CommentWithPostTitle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: postId } = useReadContract({
    address: maxterdXConfig.address as `0x${string}`,
    abi: maxterdXConfig.abi,
    functionName: 'postIds',
    args: [BigInt(currentIndex)],
  });

  const { data: postInfo } = useReadContract({
    address: maxterdXConfig.address as `0x${string}`,
    abi: maxterdXConfig.abi,
    functionName: 'getPostInfo',
    args: [postId],
  });

  const { data: commentInfos } = useReadContract({
    address: maxterdXConfig.address as `0x${string}`,
    abi: maxterdXConfig.abi,
    functionName: 'getCommentsInfo',
    args: [postId],
  });

  useEffect(() => {
    if (!numOfPosts || !owner || !commentInfos || !postId) return;

    // Process comments for the current post
    commentInfos.forEach((commentInfo: any) => {
      const { postId: commentPostId, comment, owner: commentOwner } = commentInfo;
      if (commentOwner && commentOwner.toLowerCase() === owner.toLowerCase()) {
        setUserComments(prev => [
          ...prev,
          {
            postId: commentPostId,
            comment: comment,
            owner: commentOwner,
            postTitle: postInfo?.postTitle,
          },
        ]);
      }
    });

    // Move to next post if we've processed all comments
    if (currentIndex < Number(numOfPosts) - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [commentInfos, currentIndex, numOfPosts, owner, postId]);

  return {
    comments: userComments,
    isLoading: !numOfPosts,
  };
};
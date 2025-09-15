import { maxterdXConfig } from "@/contracts/MasterdX";
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useState, useEffect } from "react";
import { CommentWithPostTitle } from "@/types";

// API Service for posting to group endpoint
export const createGroupPost = async (content: any, title: string, address: string, signature: string, salt: string) => {
  try {
    const payload = {
      salt,
      address,
      signature,
      upload: {
        id: "01994e08-bbce-7479-90a9-703362ae10da",
        name: `${address}4012d8194a5b44718a8ba6ec553241b_${salt}`,
        size: 44,
        mime_type: "application/json",
        cid: "bafkreicwrrmusmuprjxv5onfjnx2tr64uzsanhflcxs7babcrizke52jwa",
        network: "private",
        keyvalues: {
          owner: address
        },
        group_id: "01994e08-b713-7a01-b412-a6a73e7ce014",
        number_of_files: 1,
        streamable: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vectorized: false
      }
    };

    console.log('📡 API Request Details:');
    console.log('   - Endpoint: http://localhost:8888/create/group');
    console.log('   - Salt (timestamp):', salt);
    console.log('   - Address:', address);
    console.log('   - Signature:', signature);
    console.log('📦 Full API Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('http://localhost:8888/create/group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ API Success Response:', result);
    return result;
  } catch (error) {
    console.error('Error creating group post:', error);
    throw error;
  }
};

// Function to sign salt (timestamp) with MetaMask
export const signMessageWithMetaMask = async (salt: string): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Get the current account
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    
    console.log('🔐 MetaMask Signing Details:');
    console.log('   - Salt to sign:', salt);
    console.log('   - Salt length:', salt.length);
    console.log('   - Salt type:', typeof salt);
    console.log('   - Signing account:', account);
    console.log('   - Method: personal_sign (modern wallet standard)');
    
    // Convert salt to hex-encoded UTF-8 using browser-compatible TextEncoder
    const encoder = new TextEncoder();
    const saltBytes = encoder.encode(salt);
    const hexMessage = '0x' + Array.from(saltBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    console.log('   - Salt as hex:', hexMessage);

    // Use personal_sign which is the standard for modern wallets
    // This creates a signature compatible with most dApps and APIs
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [hexMessage, account],
    });
    
    console.log('✅ Signature generated via personal_sign:', signature);
    console.log('   - Signature length:', signature.length);
    console.log('   - Note: This signature includes Ethereum message prefix');
    
    return signature;
  } catch (error) {
    console.error('❌ Signing failed:', error);
    throw error;
  }
};

export const useAddPost = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const addPost = async (postData: { postId: string, postTitle: string, postCid: string, imageCid: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    try {
      await writeContract({
        address: maxterdXConfig.address as `0x${string}`,
        abi: maxterdXConfig.abi,
        functionName: 'addPost',
        args: [postData.postId as `0x${string}`, postData.postTitle, postData.postCid, postData.imageCid],
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

  const addComment = async (commentData: { postId: string, commentCid: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    try {
      await writeContract({
        address: maxterdXConfig.address as `0x${string}`,
        abi: maxterdXConfig.abi,
        functionName: 'addComment',
        args: [commentData.postId as `0x${string}`, commentData.commentCid],
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
      const { postId: commentPostId, commentcid, owner: commentOwner } = commentInfo;
      if (commentOwner && commentOwner.toLowerCase() === owner.toLowerCase()) {
        setUserComments(prev => [
          ...prev,
          {
            postId: commentPostId,
            commentCid: commentcid,
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
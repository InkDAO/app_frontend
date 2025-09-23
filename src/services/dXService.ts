import { dXmasterContract } from "@/contracts/dXmaster";
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract  } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useState, useEffect } from "react";
import { CommentWithPostTitle } from "@/types";
import { apiService } from "./httpClient";
import { authService } from "./authService";
import { handleCreateGroup, handleUpload } from "./pinataService";

// API Service for posting to group endpoint with proper content upload
export const createGroupPost = async (content: any, title: string, address: string, signature: string, salt: string) => {
  try {    
    const contentJson = JSON.stringify({
      title,
      content,
    }, null, 2);


    const payload = {
      salt,
      address,
      signature,
      content: contentJson
    };

    const response = await fetch('http://localhost:8888/create/group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    
    return {
      ...result,
    };
  } catch (error) {
    console.error('❌ Error in createGroupPost:', error);
    throw error;
  }
};

export const useAddAsset = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({hash});

  const addAsset = async (assetData: { salt: string, assetTitle: string, assetCid: string, costInNative: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    // Convert salt to bytes32 format (32 bytes, padded with zeros)
    const saltBytes32 = `0x${assetData.salt.padStart(64, '0')}` as `0x${string}`;

    try {
      await writeContract({
        address: dXmasterContract.address as `0x${string}`,
        abi: dXmasterContract.abi,
        functionName: 'addAsset',
        args: [saltBytes32, assetData.assetTitle, assetData.assetCid, BigInt(assetData.costInNative)],
        account: address,
        chain: sepolia,
      });

      console.log('🟢 Transaction submitted successfully');
      // The hash will be available in the hook's data property after the transaction is submitted
      return true;

    } catch (error: any) {
      console.error("Error in addAsset:", error);
      if (error.message?.includes("user rejected")) {
        throw new Error("Transaction was rejected by user");
      }
      throw error;
    }
  };

  return {
    addAsset,
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
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({hash});

  const addComment = async (commentData: { assetCid: string, comment: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    try {
      await writeContract({
        address: dXmasterContract.address as `0x${string}`,
        abi: dXmasterContract.abi,
        functionName: 'addComment',
        args: [commentData.assetCid as `0x${string}`, commentData.comment],
        account: address,
        chain: sepolia,
      });

    } catch (error: any) {
      console.error("Error in addComment:", error);
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

// API function to fetch file content by CID (with JWT authentication)
export const fetchFileContentByCid = async (cid: string): Promise<any> => {
  try {
    
    // Make authenticated API call to get file content by CID
    const data = await apiService.get(`/fileByCid?cid=${cid}`);
    
    // Check if the response has the content nested under a specific key
    if (data && typeof data === 'object') {
      if (data.content) {
        return data.content;
      } else if (data.file) {
        return data.file;
      } else if (data.data) {
        return data.data;
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching file content for CID:', cid, error);
    throw error;
  }
};

// API function to delete a file by CID (with authentication)
export const deleteFileById = async (cid: string, address: string, signMessage: any): Promise<any> => {
  try {
    
    // Generate salt (current timestamp in seconds)
    const timestamp = Math.floor(Date.now() / 1000);
    const salt = `I want to delete my file ${cid} at timestamp - ${timestamp}`;
    
    const signature = await signMessage({ 
      message: salt,
      account: address as `0x${string}`
    });
        
    // Prepare the deletion payload
    const payload = {
      salt,
      address,
      signature
    };
    
    // Make authenticated API call to delete the file
    const response = await fetch(`http://localhost:8888/delete/file?cid=${cid}`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deletion API error response:', errorText);
      throw new Error(`Failed to delete file: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('❌ Error deleting file for CID:', cid, error);
    throw error;
  }
};

// API function to update a file by CID (with authentication)
export const updateFileById = async (cid: string, content: any, title: string, address: string, signMessage: any): Promise<any> => {
  try {
    
    // Generate salt (current timestamp in seconds)
    const timestamp = Math.floor(Date.now() / 1000);
    const salt = `I want to update file ${cid} at timestamp - ${timestamp}`;
    
    
    // Sign the salt with wallet
    const signature = await signMessage({ 
      message: salt,
      account: address as `0x${string}`
    });
    
    
    // Prepare the update payload with content
    const payload = {
      salt,
      address,
      signature,
      content: JSON.stringify({
        title,
        content
      }, null, 2)
    };
    
    
    
    // Make authenticated API call to update the file
    const response = await fetch(`http://localhost:8888/update/file?cid=${cid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getAuthToken()}`
      },
      body: JSON.stringify(payload)
    });
    
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update API error response:', errorText);
      console.error('❌ Update API error status:', response.status);
      console.error('❌ Update API error statusText:', response.statusText);
      throw new Error(`Failed to update file: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    
    return result;
  } catch (error) {
    console.error('❌ Error updating file for CID:', cid, error);
    throw error;
  }
};

// API function to fetch saved posts for a specific owner with full content
export const fetchSavedPosts = async (owner: string): Promise<{ posts: any[], nextPageToken?: string }> => {
  try {
    
    // Check if JWT token exists, if not, throw error
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required. Please sign in first.');
    }

    // Make authenticated API call to fetch saved posts
    const endpoint = `/pendingFilesByOwner?owner=${owner}`;
    
    const response = await apiService.get(endpoint);
    
    // If response is an array, iterate over each file to get content
    const savedFiles = Array.isArray(response) ? response : (response.files || []);
    const nextPageToken = response.next_page_token;
    
    if (savedFiles.length === 0) {
      return { posts: [], nextPageToken };
    }

    
    // Fetch content for each file by CID
    const savedPostsWithContent = await Promise.allSettled(
      savedFiles.map(async (file: any) => {
        try {
          if (!file.cid) {
            return {
              ...file,
              content: null,
              contentError: 'Missing CID'
            };
          }

          // Fetch the actual file content
          const contentData = await fetchFileContentByCid(file.cid);
          
          return {
            ...file,
            content: contentData,
            contentError: null
          };
        } catch (error) {
          console.error(`❌ Failed to fetch content for CID ${file.cid}:`, error);
          return {
            ...file,
            content: null,
            contentError: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Filter successful results and log any failures
    const processedPosts = savedPostsWithContent
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`❌ Failed to process saved post ${index}:`, result.reason);
          return null;
        }
      })
      .filter(Boolean);

    return { posts: processedPosts, nextPageToken };
    
  } catch (error) {
    console.error('❌ Error fetching saved posts:', error);
    throw error;
  }
};

// API function to fetch saved posts by next page token
export const fetchSavedPostsByNextPageToken = async (owner: string, nextPageToken: string): Promise<{ posts: any[], nextPageToken?: string }> => {
  try {
    
    // Check if JWT token exists, if not, throw error
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required. Please sign in first.');
    }

    // Make authenticated API call to fetch saved posts by next page token
    const endpoint = `/filesByOwnerByNextPageToken?owner=${owner}&next_page_token=${nextPageToken}`;
    
    const response = await apiService.get(endpoint);
    
    
    // If response is an array, iterate over each file to get content
    const savedFiles = Array.isArray(response) ? response : (response.files || []);
    const newNextPageToken = response.next_page_token;
    
    if (savedFiles.length === 0) {
      return { posts: [], nextPageToken: newNextPageToken };
    }

    
    // Fetch content for each file by CID
    const savedPostsWithContent = await Promise.allSettled(
      savedFiles.map(async (file: any) => {
        try {
          if (!file.cid) {
            return {
              ...file,
              content: null,
              contentError: 'Missing CID'
            };
          }

          // Fetch the actual file content
          const contentData = await fetchFileContentByCid(file.cid);
          
          return {
            ...file,
            content: contentData,
            contentError: null
          };
        } catch (error) {
          console.error(`❌ Failed to fetch content for CID ${file.cid}:`, error);
          return {
            ...file,
            content: null,
            contentError: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Filter successful results and log any failures
    const processedPosts = savedPostsWithContent
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`❌ Failed to process saved post ${index}:`, result.reason);
          return null;
        }
      })
      .filter(Boolean);

    return { posts: processedPosts, nextPageToken: newNextPageToken };
    
  } catch (error) {
    console.error('❌ Error fetching saved posts by next page token:', error);
    throw error;
  }
};
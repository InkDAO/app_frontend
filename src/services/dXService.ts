import { dXmasterContract } from "@/contracts/dXmaster";
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { apiService, authenticatedFetch } from "./httpClient";
import { authService } from "./authService";
import { dXassetContract } from "@/contracts/dXasset";

// API Service for posting to group endpoint with proper content upload using EIP-712 typed data
export const createGroupPost = async (content: any, title: string, address: string, signTypedData: any) => {
  try {    
    // Generate timestamp (current timestamp in seconds)
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generate random nonce for uniqueness
    const nonce = crypto.randomUUID();
    
    // Define EIP-712 domain
    const domain = {
      name: 'InkDAO',
      version: '1',
      chainId: sepolia.id,
    } as const;
    
    // Define EIP-712 types
    const types = {
      CreateFile: [
        { name: 'title', type: 'string' },
        { name: 'nonce', type: 'string' },
        { name: 'address', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
      ],
    };
    
    // Define message data
    const message = {
      title: title,
      nonce: nonce,
      address: address as `0x${string}`,
      timestamp: BigInt(timestamp),
    } as const;
    
    // Sign the typed data with wallet
    const signature = await signTypedData({
      domain,
      types,
      primaryType: 'CreateFile',
      message,
      account: address as `0x${string}`
    });
    
    const contentJson = JSON.stringify({
      title,
      content,
    }, null, 2);

    const payload = {
      address,
      signature,
      content: contentJson,
      // Include EIP-712 data for server verification
      salt: {
        domain,
        types,
        message: {
          title: message.title,
          nonce: message.nonce,
          address: message.address,
          timestamp: timestamp,
        }
      }
    };

    const response = await authenticatedFetch(`${import.meta.env.VITE_SERVER_URL}/create/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

// API function to publish file (upload thumbnail image) with wallet signature using EIP-712 typed data
export const publishFile = async (file: File, address: string, signTypedData: any, cid: string, hashtags?: string): Promise<{ thumbnailCid: string }> => {
  try {
    // Generate timestamp (current timestamp in seconds)
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generate random nonce for uniqueness
    const nonce = crypto.randomUUID();
    
    // Define EIP-712 domain
    const domain = {
      name: 'InkDAO',
      version: '1',
      chainId: sepolia.id,
    } as const;
    
    // Define EIP-712 types
    const types = {
      PublishFile: [
        { name: 'cid', type: 'string' },
        { name: 'nonce', type: 'string' },
        { name: 'address', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
      ],
    };
    
    // Define message data
    const message = {
      cid: cid,
      nonce: nonce,
      address: address as `0x${string}`,
      timestamp: BigInt(timestamp),
    } as const;
    
    // Sign the typed data with wallet
    const signature = await signTypedData({
      domain,
      types,
      primaryType: 'PublishFile',
      message,
      account: address as `0x${string}`
    });
    
    // Create salt object for server verification
    const saltObject = {
      domain,
      types,
      message: {
        cid: message.cid,
        nonce: message.nonce,
        address: message.address,
        timestamp: timestamp,
      }
    };
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('salt', JSON.stringify(saltObject));
    formData.append('address', address);
    formData.append('signature', signature);
    
    // Add hashtags if provided
    if (hashtags && hashtags.trim()) {
      formData.append('hashtags', hashtags.trim());
    }
    
    // Make authenticated API call to publish file
    const response = await authenticatedFetch(`${import.meta.env.VITE_SERVER_URL}/publish/file?cid=${cid}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Publish file API error response:', errorText);
      throw new Error(`Failed to publish file: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Extract thumbnail CID from response
    const thumbnailCid = result?.thumbnailCid || result?.cid || result?.data?.thumbnailCid;
    if (!thumbnailCid) {
      throw new Error('No thumbnail CID returned from publish file API');
    }
    
    return { thumbnailCid };
  } catch (error) {
    console.error('❌ Error publishing file:', error);
    throw error;
  }
};

export const useAddAsset = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({hash});

  const addAsset = async (assetData: { salt: string, assetTitle: string, assetCid: string, thumbnailCid: string, description: string, costInNative: string }) => {
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
        args: [saltBytes32, {
          assetCid: assetData.assetCid,
          assetTitle: assetData.assetTitle,
          thumbnailCid: assetData.thumbnailCid,
          description: assetData.description,
          costInNativeInWei: BigInt(assetData.costInNative)
        }],
        account: address,
        chain: sepolia,
      });

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

export const useBuyAsset = () => {
  const { address } = useAccount();
  const { writeContract, isPending, isSuccess, isError, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({hash});
  
  
  const buyAsset = async (assetData: { assetAddress: string, amount: string, costInNativeInWei: string }) => {
    if (!address) {
      throw new Error("No account connected");
    }

    const amountInWei = BigInt(assetData.amount) * BigInt(assetData.costInNativeInWei);

    try {
      await writeContract({
        address: dXmasterContract.address as `0x${string}`,
        abi: dXmasterContract.abi,
        functionName: 'buyAsset',
        args: [assetData.assetAddress as `0x${string}`, BigInt(assetData.amount)],
        account: address,
        chain: sepolia,
        value: amountInWei,
      });

      return true;

    } catch (error: any) {
      console.error("Error in buyAsset:", error);
      if (error.message?.includes("user rejected")) {
        throw new Error("Transaction was rejected by user");
      }
      throw error;
    }
  };

  return {
    buyAsset,
    isPending,
    isSuccess,
    isError,
    isConfirming,
    isConfirmed,
    hash
  };
};

export const getAssetCost = (assetAddress: string) => {
  const { data: cost } = useReadContract({
    address: assetAddress as `0x${string}`,
    abi: dXassetContract.abi,
    functionName: 'costInNativeInWei',
    args: []
  });

  return cost;
};

export const useAssetCidByAddress = (assetAddress: string) => {
  const { data: cid, isLoading, isError } = useReadContract({
    address: assetAddress as `0x${string}`,
    abi: dXassetContract.abi,
    functionName: 'assetCid',
    args: []
  });

  return { cid, isLoading, isError };
};

export const useAssetData = (assetCid: string) => {
  const { data: assetData, isLoading, isError } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: 'getAssetInfo',
    args: [assetCid]
  });
  return { assetData, isLoading, isError };
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

// API function to fetch file content by asset address (checks if free first, then uses authentication if needed)
export const fetchFileContentByAssetAddress = async (assetAddress: string, userAddress: string): Promise<any> => {
  try {
    // First, try the public free endpoint to check if the post is free
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL;
      const freeResponse = await fetch(`${baseUrl}/freeFileByAddress?assetAddress=${assetAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // If the post is free (status 200), return the data
      if (freeResponse.ok) {
        const freeData = await freeResponse.json();
        
        // Apply same extraction logic as authenticated endpoint
        if (freeData && typeof freeData === 'object') {
          if (freeData.files && freeData.files.length > 0) {
            return freeData.files[0];
          } else if (freeData.content) {
            return freeData.content;
          } else if (freeData.file) {
            return freeData.file;
          } else if (freeData.data) {
            return freeData.data;
          }
        }
        
        return freeData;
      }
      
      // If status is 400 and error is "File is not free", fall through to authenticated endpoint
      if (freeResponse.status === 400) {
        const errorData = await freeResponse.json();
        if (errorData.error === 'File is not free') {
          // Fall through to authenticated flow below
        } else {
          // Other 400 error, throw it
          throw new Error(errorData.error || 'Failed to fetch file');
        }
      }
    } catch (freeEndpointError) {
      // If free endpoint fails for any reason other than "not free", fall through to authenticated endpoint
    }
    
    // Make authenticated API call to get file content by asset address
    // The endpoint requires both user and assetAddress parameters
    const data = await apiService.get(`/fileByAssetAddress?user=${userAddress}&assetAddress=${assetAddress}`);
    
    // Check if the response has the content nested under a specific key
    if (data && typeof data === 'object') {
      if (data.files && data.files.length > 0) {
        // Return the first file from the files array
        return data.files[0];
      } else if (data.content) {
        return data.content;
      } else if (data.file) {
        return data.file;
      } else if (data.data) {
        return data.data;
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching file content for asset address:', assetAddress, error);
    throw error;
  }
};

// API function to delete a file by CID (with authentication) using EIP-712 typed data
export const deleteFileById = async (cid: string, address: string, signTypedData: any): Promise<any> => {
  try {
    
    // Generate timestamp (current timestamp in seconds)
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generate random nonce for uniqueness
    const nonce = crypto.randomUUID();
    
    // Define EIP-712 domain
    const domain = {
      name: 'InkDAO',
      version: '1',
      chainId: sepolia.id,
    } as const;
    
    // Define EIP-712 types
    const types = {
      DeleteFile: [
        { name: 'cid', type: 'string' },
        { name: 'nonce', type: 'string' },
        { name: 'address', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
      ],
    };
    
    // Define message data
    const message = {
      cid: cid,
      nonce: nonce,
      address: address as `0x${string}`,
      timestamp: BigInt(timestamp),
    } as const;
    
    // Sign the typed data with wallet
    const signature = await signTypedData({
      domain,
      types,
      primaryType: 'DeleteFile',
      message,
      account: address as `0x${string}`
    });
        
    // Prepare the deletion payload
    const payload = {
      address,
      signature,
      // Include EIP-712 data for server verification
      salt: {
        domain,
        types,
        message: {
          cid: message.cid,
          nonce: message.nonce,
          address: message.address,
          timestamp: timestamp,
        }
      }
    };
    
    // Make authenticated API call to delete the file
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/delete/file?cid=${cid}`, {
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

// API function to update a file by CID (with authentication) using EIP-712 typed data
export const updateFileById = async (cid: string, content: any, title: string, address: string, signTypedData: any): Promise<any> => {
  try {
    
    // Generate timestamp (current timestamp in seconds)
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generate random nonce for uniqueness
    const nonce = crypto.randomUUID();
    
    // Define EIP-712 domain
    const domain = {
      name: 'InkDAO',
      version: '1',
      chainId: sepolia.id,
    } as const;
    
    // Define EIP-712 types
    const types = {
      UpdateFile: [
        { name: 'cid', type: 'string' },
        { name: 'nonce', type: 'string' },
        { name: 'address', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
      ],
    };
    
    // Define message data
    const message = {
      cid: cid,
      nonce: nonce,
      address: address as `0x${string}`,
      timestamp: BigInt(timestamp),
    } as const;
    
    // Sign the typed data with wallet
    const signature = await signTypedData({
      domain,
      types,
      primaryType: 'UpdateFile',
      message,
      account: address as `0x${string}`
    });
    // Prepare the update payload with content
    const payload = {
      address,
      signature,
      content: JSON.stringify({
        title,
        content
      }, null, 2),
      // Include EIP-712 data for server verification
      salt: {
        domain,
        types,
        message: {
          cid: message.cid,
          nonce: message.nonce,
          address: message.address,
          timestamp: timestamp,
        }
      }
    };
    
    
    
    // Make authenticated API call to update the file
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/update/file?cid=${cid}`, {
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
    const endpoint = `/filesByNextPageToken?next_page_token=${nextPageToken}`;
    
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

// API function to fetch all file metadata with pagination
export const fetchAllFileMetadata = async (nextPageToken?: string): Promise<{ files: any[], nextPageToken?: string }> => {
  try {
    // Build the endpoint with optional next_page_token
    const endpoint = nextPageToken 
      ? `/filesByNextPageToken?next_page_token=${nextPageToken}`
      : '/filesMetaData';
    
    // Try with apiService first (authenticated)
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract files and next_page_token from response
      const files = Array.isArray(data) ? data : (data.files || []);
      const newNextPageToken = data.next_page_token;
      
      return { files, nextPageToken: newNextPageToken };
    } catch (authError) {
      // If authenticated request fails, try without authentication (public endpoint)
      const baseUrl = import.meta.env.VITE_SERVER_URL;
      const fullUrl = `${baseUrl}${endpoint}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const files = Array.isArray(data) ? data : (data.files || []);
      const newNextPageToken = data.next_page_token;
      
      return { files, nextPageToken: newNextPageToken };
    }
  } catch (error) {
    console.error('❌ Error fetching all file metadata:', error);
    throw error;
  }
};
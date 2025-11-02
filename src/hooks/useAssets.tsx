import { useState, useEffect, useCallback } from "react";
import { Asset } from "@/types";
import { useReadContract } from "wagmi";
import { fetchAllFileMetadata } from "@/services/dXService";
import { marketPlaceContract } from "@/contracts/marketPlace";

interface PostInfo {
  author: `0x${string}`;
  postCid: string;
  postTitle: string;
  thumbnailCid: string;
  description: string;
  priceInNative: string;
}

// The function returns just the post infos array
type GetAllPostsResult = PostInfo[];

export const useAssets = () => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isAllAssetLoading, setIsAllAssetLoading] = useState(true);
  const [isEnrichmentInProgress, setIsEnrichmentInProgress] = useState(false);

  const { data: allAssetInfo, isLoading: isAllAssetInfoLoading, refetch: refetchTotalAssets } = useReadContract({
    address: marketPlaceContract.address as `0x${string}`,
    abi: marketPlaceContract.abi,
    functionName: "getAllPosts",
  });

  // Function to fetch all pages of file metadata from API
  const fetchAllMetadataPages = useCallback(async () => {
    const allFiles: any[] = [];
    let nextToken: string | undefined = undefined;
    let pageCount = 0;
    
    try {
      // Keep fetching until there's no next_page_token
      do {
        pageCount++;
        const { files, nextPageToken } = await fetchAllFileMetadata(nextToken);
        allFiles.push(...files);
        nextToken = nextPageToken;
      } while (nextToken);
      
      return allFiles;
    } catch (error) {
      console.error('❌ Error fetching all metadata pages:', error);
      return [];
    }
  }, []);

  // Function to enrich contract data with API metadata
  const enrichAssetsWithMetadata = useCallback(async (contractAssets: Asset[]) => {
    if (contractAssets.length === 0) {
      return;
    }

    setIsEnrichmentInProgress(true);
    
    try {
      // Fetch all metadata pages in the background
      const apiFiles = await fetchAllMetadataPages();
      
      if (apiFiles.length === 0) {
        console.warn('⚠️ No metadata files returned from API');
        setIsEnrichmentInProgress(false);
        return;
      }

      // Create a map of CID to metadata for quick lookup
      const metadataMap = new Map();
      apiFiles.forEach(file => {
        if (file.cid) {
          metadataMap.set(file.cid, file);
        }
      });

      // Enrich assets with hashtags from API
      // Keep all contract assets, but only add hashtags for those in the API response
      let enrichedCount = 0;
      let missingMetadataCount = 0;
      const enrichedAssets = contractAssets.map((asset, index) => {
        const metadata = metadataMap.get(asset.postCid);
        
        if (!metadata) {
          missingMetadataCount++;
        }
        
        // Extract hashtags and publishedAt from keyvalues
        let hashtags: string | undefined = undefined;
        let publishedAt: string | undefined = undefined;
        
        if (metadata?.keyvalues && typeof metadata.keyvalues === 'object') {
          const hashtagArray: string[] = [];
          
          // Iterate through keyvalues and find entries where key === value (hashtags)
          // Also extract publishedAt if it exists
          Object.entries(metadata.keyvalues).forEach(([key, value]) => {
            // If key equals value, it's a hashtag
            if (key === value && typeof value === 'string') {
              hashtagArray.push(key);
            }
            // Extract publishedAt
            if (key === 'publishedAt' && typeof value === 'string') {
              publishedAt = value;
            }
          });
          
          // Join hashtags with commas if any found
          if (hashtagArray.length > 0) {
            hashtags = hashtagArray.join(',');
            enrichedCount++;
          }
        }
        
        // Merge hashtags and publishedAt from API if available
        return {
          ...asset,
          hashtags,
          publishedAt,
        };
      });

      // Update state with enriched data
      setAllAssets(enrichedAssets);
    } catch (error) {
      console.error('❌ Error enriching assets with metadata:', error);
      // Keep the contract data if enrichment fails
    } finally {
      setIsEnrichmentInProgress(false);
    }
  }, [fetchAllMetadataPages]);

  // Effect to load contract data and trigger background enrichment
  useEffect(() => {
    if (!isAllAssetInfoLoading) {
      if (allAssetInfo) {
        try {
          const postInfos = allAssetInfo as unknown as GetAllPostsResult;
          
          if (postInfos && Array.isArray(postInfos)) {
            const convertedPosts: Asset[] = postInfos.map((post, index) => ({
              postTitle: post.postTitle,
              postCid: post.postCid,
              postId: (index + 1).toString(),
              author: post.author,
              thumbnailCid: post.thumbnailCid,
              description: post.description,
              priceInNative: post.priceInNative,
            }));
            
            setAllAssets(convertedPosts);
            enrichAssetsWithMetadata(convertedPosts);
          } else {
            console.error('❌ Invalid data structure');
            setAllAssets([]);
          }
        } catch (error) {
          console.error('❌ Error processing post data:', error);
          setAllAssets([]);
        }
      }
      setIsAllAssetLoading(false);
    } else {
      setIsAllAssetLoading(true);
    }
  }, [isAllAssetInfoLoading, allAssetInfo, enrichAssetsWithMetadata]);

  const refetchAssets = () => {
    refetchTotalAssets();
  };

  return { allAssets, isAllAssetLoading, refetchAssets, isEnrichmentInProgress };
};
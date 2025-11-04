import { useState, useEffect, useCallback } from "react";
import { Asset } from "@/types";
import { useReadContract } from "wagmi";
import { fetchAllFileMetadata } from "@/services/dXService";
import { marketPlaceContract } from "@/contracts/marketPlace";
import { setCache, getCache, clearCache, clearAssetsCache, CACHE_KEYS } from "@/utils/cacheUtils";

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
  const [isUsingCache, setIsUsingCache] = useState(false);

  const { data: allAssetInfo, isLoading: isAllAssetInfoLoading, refetch: refetchTotalAssets } = useReadContract({
    address: marketPlaceContract.address as `0x${string}`,
    abi: marketPlaceContract.abi,
    functionName: "getAllPosts",
  });

  // Function to fetch all pages of file metadata from API with caching
  const fetchAllMetadataPages = useCallback(async (useCache = true) => {
    // Try to get from cache first
    if (useCache) {
      const cachedMetadata = getCache<any[]>(CACHE_KEYS.PINATA_METADATA);
      if (cachedMetadata && cachedMetadata.length > 0) {
        return cachedMetadata;
      }
    }

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
      
      // Cache the fetched metadata
      if (allFiles.length > 0) {
        setCache(CACHE_KEYS.PINATA_METADATA, allFiles);
      }
      
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


      // Filter and enrich assets - only keep posts that exist in Pinata
      let enrichedCount = 0;
      let filteredOutCount = 0;
      const enrichedAssets = contractAssets
        .filter((asset) => {
          const exists = metadataMap.has(asset.postCid);
          if (!exists) {
            filteredOutCount++;
          }
          return exists;
        })
        .map((asset) => {
          const metadata = metadataMap.get(asset.postCid);
          
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


      // Cache the enriched and filtered assets
      if (enrichedAssets.length > 0) {
        setCache(CACHE_KEYS.ASSETS, enrichedAssets);
      }

      // Update state with filtered and enriched data
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
    // Check cache first before processing contract data
    const cachedAssets = getCache<Asset[]>(CACHE_KEYS.ASSETS);
    
    if (cachedAssets && cachedAssets.length > 0 && isAllAssetInfoLoading) {
      setAllAssets(cachedAssets);
      setIsAllAssetLoading(false);
      setIsUsingCache(true);
      return;
    }

    if (!isAllAssetInfoLoading) {
      setIsUsingCache(false);
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
      if (!cachedAssets) {
        setIsAllAssetLoading(true);
      }
    }
  }, [isAllAssetInfoLoading, allAssetInfo, enrichAssetsWithMetadata]);

  const refetchAssets = useCallback(() => {
    // Clear cache and refetch
    clearAssetsCache();
    refetchTotalAssets();
  }, [refetchTotalAssets]);

  // Clear cache when component unmounts (optional, for development)
  useEffect(() => {
    return () => {
      // Optionally clear cache on unmount during development
      // clearAssetsCache();
    };
  }, []);

  return { 
    allAssets, 
    isAllAssetLoading, 
    refetchAssets, 
    isEnrichmentInProgress,
    isUsingCache,
    clearAssetsCache
  };
};
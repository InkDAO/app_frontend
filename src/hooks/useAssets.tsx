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

// Cache configuration
const CACHE_KEY_ASSETS = 'dx_cached_assets';
const CACHE_KEY_PINATA_METADATA = 'dx_cached_pinata_metadata';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface CacheData<T> {
  data: T;
  timestamp: number;
}

// Cache utilities
const setCache = <T,>(key: string, data: T): void => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

const getCache = <T,>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData: CacheData<T> = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

const clearCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

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
      const cachedMetadata = getCache<any[]>(CACHE_KEY_PINATA_METADATA);
      if (cachedMetadata && cachedMetadata.length > 0) {
        console.log(`✅ Using cached Pinata metadata (${cachedMetadata.length} files)`);
        return cachedMetadata;
      }
    }

    const allFiles: any[] = [];
    let nextToken: string | undefined = undefined;
    let pageCount = 0;
    
    try {
      console.log('🔄 Fetching fresh Pinata metadata...');
      // Keep fetching until there's no next_page_token
      do {
        pageCount++;
        const { files, nextPageToken } = await fetchAllFileMetadata(nextToken);
        allFiles.push(...files);
        nextToken = nextPageToken;
      } while (nextToken);
      
      // Cache the fetched metadata
      if (allFiles.length > 0) {
        setCache(CACHE_KEY_PINATA_METADATA, allFiles);
        console.log(`✅ Cached ${allFiles.length} Pinata metadata files`);
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

      console.log(`📊 Contract posts: ${contractAssets.length}, Pinata files: ${apiFiles.length}`);

      // Filter and enrich assets - only keep posts that exist in Pinata
      let enrichedCount = 0;
      let filteredOutCount = 0;
      const enrichedAssets = contractAssets
        .filter((asset) => {
          const exists = metadataMap.has(asset.postCid);
          if (!exists) {
            filteredOutCount++;
            console.log(`🚫 Filtering out post with CID not in Pinata: ${asset.postCid} (${asset.postTitle})`);
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

      console.log(`✅ Filtered posts: ${enrichedAssets.length}, Removed: ${filteredOutCount}, Enriched with hashtags: ${enrichedCount}`);

      // Cache the enriched and filtered assets
      if (enrichedAssets.length > 0) {
        setCache(CACHE_KEY_ASSETS, enrichedAssets);
        console.log(`💾 Cached ${enrichedAssets.length} enriched assets`);
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
    const cachedAssets = getCache<Asset[]>(CACHE_KEY_ASSETS);
    
    if (cachedAssets && cachedAssets.length > 0 && isAllAssetInfoLoading) {
      console.log(`✅ Using cached assets (${cachedAssets.length} posts)`);
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
    clearCache(CACHE_KEY_ASSETS);
    clearCache(CACHE_KEY_PINATA_METADATA);
    console.log('🔄 Cache cleared, refetching assets...');
    refetchTotalAssets();
  }, [refetchTotalAssets]);

  // Clear cache when component unmounts (optional, for development)
  useEffect(() => {
    return () => {
      // Optionally clear cache on unmount during development
      // clearCache(CACHE_KEY_ASSETS);
      // clearCache(CACHE_KEY_PINATA_METADATA);
    };
  }, []);

  return { 
    allAssets, 
    isAllAssetLoading, 
    refetchAssets, 
    isEnrichmentInProgress,
    isUsingCache,
    clearAssetsCache: () => {
      clearCache(CACHE_KEY_ASSETS);
      clearCache(CACHE_KEY_PINATA_METADATA);
    }
  };
};
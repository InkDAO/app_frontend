import { useState, useEffect, useCallback } from "react";
import { Asset } from "@/types";
import { useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";
import { fetchAllFileMetadata } from "@/services/dXService";

interface AssetInfo {
  author: `0x${string}`;
  assetCid: string;
  assetTitle: string;
  thumbnailCid: string;
  description: string;
  costInNativeInWei: string;
}

// The function returns a tuple: [addresses[], assetInfos[]]
type GetAllAssetInfosResult = [`0x${string}`[], AssetInfo[]];

export const useAssets = () => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isAllAssetLoading, setIsAllAssetLoading] = useState(true);
  const [isEnrichmentInProgress, setIsEnrichmentInProgress] = useState(false);

  const { data: allAssetInfo, isLoading: isAllAssetInfoLoading, refetch: refetchTotalAssets } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: "getAllAssetInfos",
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
        const metadata = metadataMap.get(asset.assetCid);
        
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
          // The function returns a tuple: [addresses[], assetInfos[]]
          const result = allAssetInfo as unknown as GetAllAssetInfosResult;
          const [assetAddresses, assetInfos] = result;
          
          // Check if both arrays exist and are valid
          if (assetInfos && Array.isArray(assetInfos) && assetAddresses && Array.isArray(assetAddresses)) {
            // Map asset infos with their corresponding addresses
            const convertedPosts: Asset[] = assetInfos.map((asset, index) => ({
              assetTitle: asset.assetTitle,
              assetCid: asset.assetCid,
              assetAddress: assetAddresses[index] || '0x0000000000000000000000000000000000000000',
              author: asset.author,
              thumbnailCid: asset.thumbnailCid,
              description: asset.description,
              costInNative: asset.costInNativeInWei,
            }));
            
            // Set initial contract data immediately
            setAllAssets(convertedPosts);
            
            // Start background enrichment with API metadata
            enrichAssetsWithMetadata(convertedPosts);
          } else {
            console.error('❌ Invalid data structure:', { assetAddresses, assetInfos });
            setAllAssets([]);
          }
        } catch (error) {
          console.error('❌ Error processing asset data:', error);
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
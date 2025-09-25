import { useState, useEffect } from "react";
import { Asset } from "@/types";
import { useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";

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

  const { data: allAssetInfo, isLoading: isAllAssetInfoLoading, refetch: refetchTotalAssets } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: "getAllAssetInfos",
  });

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
            
            setAllAssets(convertedPosts);
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
  }, [isAllAssetInfoLoading, allAssetInfo]);

  const refetchAssets = () => {
    refetchTotalAssets();
  };

  return { allAssets, isAllAssetLoading, refetchAssets };
};
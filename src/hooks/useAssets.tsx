import { useState, useEffect } from "react";
import { Asset } from "@/types";
import { useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";

interface AssetInfo {
  assetTitle: string;
  assetCid: string;
  assetAddress: string;
  author: `0x${string}`;
}

export const useAssets = () => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isAllAssetLoading, setIsAllAssetLoading] = useState(true);

  const { data: allAssetInfo, isLoading: isAllAssetInfoLoading, refetch: refetchTotalAssets } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: "getAllAssets",
  });

  console.log('allAssetInfo', allAssetInfo);


  useEffect(() => {
    if (!isAllAssetInfoLoading) {
      if (allAssetInfo) {
        const convertedPosts: Asset[] = (allAssetInfo as unknown as AssetInfo[]).map(asset => ({
          assetTitle: asset.assetTitle,
          assetCid: asset.assetCid,
          assetAddress: asset.assetAddress,
          author: asset.author,
        }));
        setAllAssets(convertedPosts);
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
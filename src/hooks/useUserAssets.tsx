import { useState, useEffect } from "react";
import { Asset } from "@/types";
import { useAccount, useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";
import { useAssets } from "./useAssets";

export const useUserAssets = () => {
  const { address } = useAccount();
  const [allUserAssets, setAllUserAssets] = useState<Asset[]>([]);
  const [isAllUserAssetLoading, setIsAllUserAssetLoading] = useState(true);
  const { allAssets, isAllAssetLoading, refetchAssets: refetchAllAssets } = useAssets();
  
  const { data: allUserAssetInfo, isLoading: isAllUserAssetInfoLoading, refetch: refetchTotalUserAssets } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: "getUserAssetData",
    args: [address],
  });

  useEffect(() => {
    if (!isAllUserAssetInfoLoading && !isAllAssetLoading && allAssets.length > 0 && allUserAssetInfo) {
      const userAssets = allAssets.filter((asset) => allUserAssetInfo.some((userAsset) => userAsset.assetAddress === asset.assetAddress));
      
      if (userAssets) {
        const convertedUserAssets: Asset[] = userAssets.map(asset => ({
          assetTitle: asset.assetTitle,
          assetCid: asset.assetCid,
          assetAddress: asset.assetAddress,
          author: asset.author,
          thumbnailCid: asset.thumbnailCid,
          description: asset.description,
          costInNative: asset.costInNative,
        }));
        setAllUserAssets(convertedUserAssets);
      }
      setIsAllUserAssetLoading(false);
    } else if (isAllUserAssetInfoLoading || isAllAssetLoading) {
      setIsAllUserAssetLoading(true);
    }
  }, [isAllUserAssetInfoLoading, isAllAssetLoading, allAssets, allUserAssetInfo]);

  const refetchAssets = () => {
    refetchTotalUserAssets();
  };

  return { allUserAssets, isAllUserAssetLoading, refetchAssets };
};
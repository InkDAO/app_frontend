import { useState, useEffect } from "react";
import { Asset } from "@/types";
import { useAccount, useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";
import { useAssets } from "./useAssets";

interface AssetInfo {
  assetTitle: string;
  assetCid: string;
  assetAddress: string;
  author: `0x${string}`;
}

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
  console.log('allUserAssetInfo', allUserAssetInfo);

  const userAssets = allAssets.filter((asset) => allUserAssetInfo.some((userAsset) => userAsset.assetAddress === asset.assetAddress));
  console.log('userAssets', userAssets);

  useEffect(() => {
    if (!isAllUserAssetInfoLoading) {
      if (userAssets) {
        const convertedUserAssets: Asset[] = (userAssets as unknown as AssetInfo[]).map(asset => ({
          assetTitle: asset.assetTitle,
          assetCid: asset.assetCid,
          assetAddress: asset.assetAddress,
          author: asset.author,
        }));
        setAllUserAssets(convertedUserAssets);
    }
      setIsAllUserAssetLoading(false);
    } else {
        setIsAllUserAssetLoading(true);
    }
  }, [isAllUserAssetInfoLoading, allUserAssetInfo]);

  const refetchAssets = () => {
    refetchTotalUserAssets();
  };

  return { allUserAssets, isAllUserAssetLoading, refetchAssets };
};
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";

export const useAssetOwnership = (assetAddress: string, assetData?: any) => {
  const { address } = useAccount();
  const [isOwned, setIsOwned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: userAssetInfo, isLoading: isUserAssetInfoLoading } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: "getUserAssetData",
    args: [address],
    query: {
      enabled: !!address && !!assetAddress,
    }
  });

  useEffect(() => {
    if (!isUserAssetInfoLoading && userAssetInfo && assetAddress) {
      // Check if the current asset address is in the user's owned assets
      const purchased = userAssetInfo.some((userAsset: any) => 
        userAsset.assetAddress?.toLowerCase() === assetAddress.toLowerCase()
      );
      
      // Check if the current user is the creator of the asset
      const isCreator = assetData?.author?.toLowerCase() === address?.toLowerCase();
      
      // User owns the asset if they either purchased it OR created it
      const owned = purchased || isCreator;
      
      setIsOwned(owned);
      setIsLoading(false);
    } else if (isUserAssetInfoLoading) {
      setIsLoading(true);
    } else if (!userAssetInfo) {
      // If no user asset info but we have asset data, check if user is creator
      const isCreator = assetData?.author?.toLowerCase() === address?.toLowerCase();
      setIsOwned(isCreator);
      setIsLoading(false);
    }
  }, [isUserAssetInfoLoading, userAssetInfo, assetAddress, assetData, address]);

  return { isOwned, isLoading };
};

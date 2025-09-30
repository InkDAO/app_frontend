import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";

export const useAssetOwnership = (assetAddress: string) => {
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
      const owned = userAssetInfo.some((userAsset: any) => 
        userAsset.assetAddress?.toLowerCase() === assetAddress.toLowerCase()
      );
      setIsOwned(owned);
      setIsLoading(false);
    } else if (isUserAssetInfoLoading) {
      setIsLoading(true);
    } else if (!userAssetInfo) {
      setIsOwned(false);
      setIsLoading(false);
    }
  }, [isUserAssetInfoLoading, userAssetInfo, assetAddress]);

  return { isOwned, isLoading };
};

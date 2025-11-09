import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { marketPlaceContract } from "@/contracts/marketPlace";

export const useAssetOwnership = (postId: string, assetData?: any) => {
  const { address } = useAccount();
  const [isOwned, setIsOwned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: userAssetInfo, isLoading: isUserAssetInfoLoading, refetch } = useReadContract({
    address: marketPlaceContract.address as `0x${string}`,
    abi: marketPlaceContract.abi,
    functionName: "getUserPosts",
    args: [address],
    query: {
      enabled: !!address && !!postId,
    }
  });

  useEffect(() => {
    if (!isUserAssetInfoLoading && userAssetInfo && postId) {
      const userPostIds = userAssetInfo as any[];
      
      // Check if the current postId is in the user's owned posts
      const purchased = userPostIds.some((userPostId: any) => 
        userPostId?.toString() === postId
      );
      
      // Check if the current user is the creator of the asset
      const isCreator = assetData?.author?.toLowerCase() === address?.toLowerCase();
      
      // User owns the asset if they either purchased it OR created it
      setIsOwned(purchased || isCreator);
      setIsLoading(false);
    } else if (isUserAssetInfoLoading) {
      setIsLoading(true);
    } else if (!userAssetInfo) {
      // If no user asset info but we have asset data, check if user is creator
      const isCreator = assetData?.author?.toLowerCase() === address?.toLowerCase();
      setIsOwned(isCreator);
      setIsLoading(false);
    }
  }, [isUserAssetInfoLoading, userAssetInfo, postId, assetData, address]);

  return { isOwned, isLoading, refetch };
};

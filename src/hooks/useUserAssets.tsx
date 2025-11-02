import { useState, useEffect } from "react";
import { Asset } from "@/types";
import { useAccount, useReadContract } from "wagmi";
import { marketPlaceContract } from "@/contracts/marketPlace";
import { useAssets } from "./useAssets";

export const useUserAssets = () => {
  const { address } = useAccount();
  const [allUserAssets, setAllUserAssets] = useState<Asset[]>([]);
  const [isAllUserAssetLoading, setIsAllUserAssetLoading] = useState(true);
  const { allAssets, isAllAssetLoading, refetchAssets: refetchAllAssets } = useAssets();
  
  const { data: allUserAssetInfo, isLoading: isAllUserAssetInfoLoading, refetch: refetchTotalUserAssets } = useReadContract({
    address: marketPlaceContract.address as `0x${string}`,
    abi: marketPlaceContract.abi,
    functionName: "getUserPosts",
    args: [address],
  });

  useEffect(() => {
    if (!isAllUserAssetInfoLoading && !isAllAssetLoading && allAssets.length > 0 && allUserAssetInfo) {
      try {
        const userPostIds = allUserAssetInfo as any[];
        
        if (!Array.isArray(userPostIds)) {
          setAllUserAssets([]);
          setIsAllUserAssetLoading(false);
          return;
        }
        
        // Filter assets where user has ownership
        const userAssets = allAssets.filter((asset) => 
          userPostIds.some((postId: any) => postId?.toString() === asset.postId)
        );
        
        setAllUserAssets(userAssets);
      } catch (error) {
        console.error('❌ Error processing user assets:', error);
        setAllUserAssets([]);
      }
      setIsAllUserAssetLoading(false);
    } else if (isAllUserAssetInfoLoading || isAllAssetLoading) {
      setIsAllUserAssetLoading(true);
    } else if (!isAllUserAssetInfoLoading && !isAllAssetLoading) {
      setAllUserAssets([]);
      setIsAllUserAssetLoading(false);
    }
  }, [isAllUserAssetInfoLoading, isAllAssetLoading, allAssets, allUserAssetInfo]);

  const refetchAssets = () => {
    refetchTotalUserAssets();
  };

  return { allUserAssets, isAllUserAssetLoading, refetchAssets };
};
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { dXmasterContract } from "@/contracts/dXmaster";

interface PlatformMetrics {
  totalPosts: number;
  totalValueTraded: string;
  totalWorthOfAssets: string;
  isLoading: boolean;
}

export const usePlatformMetrics = (): PlatformMetrics => {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalPosts: 0,
    totalValueTraded: "0",
    totalWorthOfAssets: "0",
    isLoading: true,
  });

  // Get total number of assets (posts)
  const { data: totalAssets, isLoading: isTotalAssetsLoading } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: "totalAssets",
  });

  // Get all asset information
  const { data: allAssetInfo, isLoading: isAllAssetInfoLoading } = useReadContract({
    address: dXmasterContract.address as `0x${string}`,
    abi: dXmasterContract.abi,
    functionName: "getAllAssetInfos",
  });

  useEffect(() => {
    const calculateMetrics = () => {
      if (isTotalAssetsLoading || isAllAssetInfoLoading) {
        setMetrics({
          totalPosts: 0,
          totalValueTraded: "0",
          totalWorthOfAssets: "0",
          isLoading: true,
        });
        return;
      }

      try {
        // Set total posts
        const postsCount = totalAssets ? Number(totalAssets) : 0;

        if (!allAssetInfo || postsCount === 0) {
          setMetrics({
            totalPosts: postsCount,
            totalValueTraded: "0",
            totalWorthOfAssets: "0",
            isLoading: false,
          });
          return;
        }

        // Parse asset data
        const result = allAssetInfo as unknown as [`0x${string}`[], any[]];
        const [assetAddresses, assetInfos] = result;

        if (!assetAddresses || !Array.isArray(assetAddresses) || assetAddresses.length === 0) {
          setMetrics({
            totalPosts: postsCount,
            totalValueTraded: "0",
            totalWorthOfAssets: "0",
            isLoading: false,
          });
          return;
        }

        // Calculate total worth of all assets (sum of all prices)
        let totalWorth = BigInt(0);
        assetInfos.forEach((asset) => {
          const cost = BigInt(asset.costInNativeInWei || 0);
          totalWorth += cost;
        });

        // For total value traded, we'll use a simplified calculation
        // In a real scenario, you'd need to track actual purchase history
        // For now, we'll estimate based on a conservative multiplier
        // This is a placeholder - actual implementation would need events or state tracking
        const totalTraded = totalWorth; // Simplified: same as worth for now

        // Convert to ETH (divide by 1e18) and format
        const totalWorthInEth = Number(totalWorth) / 1e18;
        const totalTradedInEth = Number(totalTraded) / 1e18;

        setMetrics({
          totalPosts: postsCount,
          totalValueTraded: totalTradedInEth.toFixed(4),
          totalWorthOfAssets: totalWorthInEth.toFixed(4),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error calculating metrics:", error);
        setMetrics({
          totalPosts: totalAssets ? Number(totalAssets) : 0,
          totalValueTraded: "0",
          totalWorthOfAssets: "0",
          isLoading: false,
        });
      }
    };

    calculateMetrics();
  }, [totalAssets, allAssetInfo, isTotalAssetsLoading, isAllAssetInfoLoading]);

  return metrics;
};


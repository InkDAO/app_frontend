import { useState, useEffect } from "react";

interface PlatformMetrics {
  totalPosts: number;
  totalUsers: number;
  totalValueTraded: string;
  totalWorthOfAssets: string;
  isLoading: boolean;
}

interface LandingPageApiResponse {
  statusCode: number;
  data: {
    totalUsers: string;
    totalAssets: string;
    totalAssetWorth: string;
    totalVolume: string;
  };
}

export const usePlatformMetrics = (): PlatformMetrics => {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalPosts: 0,
    totalUsers: 0,
    totalValueTraded: "0",
    totalWorthOfAssets: "0",
    isLoading: true,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, isLoading: true }));
        
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/landingPage`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result: LandingPageApiResponse = await response.json();
        
        if (result.statusCode === 200 && result.data) {
          const { totalUsers, totalAssets, totalAssetWorth, totalVolume } = result.data;
          
          // Convert wei to ETH for display
          const worthInEth = Number(totalAssetWorth) / 1e18;
          const volumeInEth = Number(totalVolume) / 1e18;
          
          setMetrics({
            totalPosts: Number(totalAssets),
            totalUsers: Number(totalUsers),
            totalValueTraded: volumeInEth.toFixed(4),
            totalWorthOfAssets: worthInEth.toFixed(4),
            isLoading: false,
          });
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (error) {
        console.error("Error fetching platform metrics:", error);
        setMetrics({
          totalPosts: 0,
          totalUsers: 0,
          totalValueTraded: "0",
          totalWorthOfAssets: "0",
          isLoading: false,
        });
      }
    };

    fetchMetrics();
    
    // Refetch every 30 seconds to keep data fresh
    const intervalId = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  return metrics;
};


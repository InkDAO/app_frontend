import { BarChart3, Users, DollarSign, TrendingUp, Loader2, Sparkles, BookOpen, Copy, Check } from "lucide-react";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UserMetrics {
  creator: {
    totalAssets: number;
    totalEarnings: number;
    totalSubscribers: number;
    totalAssetWorth: number;
  };
  holder: {
    totalPurchases: string;
    totalSpent: string;
  };
}

export const DashboardPage = () => {
  const { address: urlAddress } = useParams<{ address: string }>();
  const { address: connectedAddress } = useAccount();
  
  // Use URL address if provided, otherwise use connected address
  const dashboardAddress = urlAddress || connectedAddress;
  const isOwnDashboard = connectedAddress && dashboardAddress?.toLowerCase() === connectedAddress.toLowerCase();
  
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch user metrics from API
  useEffect(() => {
    const fetchUserMetrics = async () => {
      if (!dashboardAddress) return;
      
      setIsLoadingMetrics(true);
      setMetricsError(null);
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/userMetrics?userAddress=${dashboardAddress}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.statusCode === 200 && result.data) {
          setUserMetrics(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching user metrics:', error);
        setMetricsError(error instanceof Error ? error.message : 'Failed to load metrics');
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchUserMetrics();
  }, [dashboardAddress]);

  // Copy dashboard URL to clipboard
  const copyDashboardUrl = () => {
    const url = `${window.location.origin}/dashboard/${dashboardAddress}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract metrics with defaults and ensure proper number types
  // Convert wei to ETH by dividing by 10^18
  const myPostsCount = Number(userMetrics?.creator.totalAssets) || 0;
  const totalCopiesSold = Number(userMetrics?.creator.totalSubscribers) || 0;
  const totalEarned = (Number(userMetrics?.creator.totalEarnings) || 0) / 1e18;
  const totalMarketValue = (Number(userMetrics?.creator.totalAssetWorth) || 0) / 1e18;
  const libraryCount = parseInt(userMetrics?.holder.totalPurchases || "0", 10);
  const collectionValue = (parseFloat(userMetrics?.holder.totalSpent || "0")) / 1e18;

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!dashboardAddress) {
    return (
      <div className="px-4 sm:px-8 py-6 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No Address Found</h2>
          <p className="text-muted-foreground">Please connect your wallet or provide a valid address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 py-6 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
      <div className="mb-8 sm:mb-10 lg:mb-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 p-4 sm:p-6 lg:p-8 border-0 shadow-2xl dark:shadow-blue-500/10">
          {/* Animated Background Blobs */}
          <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 lg:gap-5">
              {/* Icon and Title Section */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg sm:shadow-xl shadow-blue-500/50 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight mb-1.5 sm:mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                    Dashboard
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground font-semibold mb-2 sm:mb-2.5">
                    Performance metrics and <span className="text-foreground font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">content analytics</span>
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-xs sm:text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {formatAddress(dashboardAddress)}
                    </span>
                    <span className="hidden sm:inline text-xs sm:text-sm text-muted-foreground/80 font-medium">
                      Content creation and engagement statistics
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Share Button */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDashboardUrl}
                  className="w-full sm:w-auto gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="font-semibold">Share Dashboard</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* User Analytics */}
        <div className="space-y-8">
          {/* Creator Analytics */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Creator Analytics
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Posts Created Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-violet-100 dark:border-violet-900/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/50">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400">CONTENT</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Posts Created</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {isLoadingMetrics ? (
                          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                        ) : (
                          myPostsCount
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-500 flex-shrink-0">total</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copies Sold Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/50">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">REACH</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Copies Sold</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {isLoadingMetrics ? (
                          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        ) : (
                          totalCopiesSold
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-500 flex-shrink-0">subscribers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Earned Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/50">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">REVENUE</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent break-all">
                        {isLoadingMetrics ? (
                          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                        ) : (
                          totalEarned.toFixed(4)
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-500 flex-shrink-0">ETH</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Value Card */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl shadow-lg shadow-orange-500/50">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">VALUE</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Market Value</p>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent break-all">
                        {isLoadingMetrics ? (
                          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                        ) : (
                          totalMarketValue.toFixed(4)
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-500 flex-shrink-0">ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collection */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Content Collection
              </h3>
            </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Library Size Card */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-teal-100 dark:border-teal-900/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-500/50">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="px-2.5 py-1 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">LIBRARY</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Library Size</p>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                          {isLoadingMetrics ? (
                            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
                          ) : (
                            libraryCount
                          )}
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-500 flex-shrink-0">posts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Value Card */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/50">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">WORTH</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Collection Value</p>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent break-all">
                          {isLoadingMetrics ? (
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                          ) : (
                            collectionValue.toFixed(4)
                          )}
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-500 flex-shrink-0">ETH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
  );
};


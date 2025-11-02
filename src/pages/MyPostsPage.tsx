import { useState, useEffect } from "react";
import { HomeCard } from "@/components/HomeCard";
import { HomeCardSkeleton } from "@/components/HomeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAssets } from "@/hooks/useAssets";
import { useAccount } from "wagmi";
import { useSearch } from "@/context/SearchContext";

export const MyPostsPage = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { searchTerm } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();

  // Filter my assets from all assets
  const filterMyAssets = () => {
    if (!address) return [];
    return allAssets.filter((asset) => {
      return asset.author.toLowerCase() === address?.toLowerCase();
    });
  };

  // Get filtered assets based on search term
  const getFilteredAssets = () => {
    const myAssets = filterMyAssets();
    if (!searchTerm.trim()) return myAssets;
    
    return myAssets.filter(asset => 
      asset.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredAssets = getFilteredAssets();

  // Handle refresh
  const handleRefresh = () => {
    // Assets will be refreshed automatically when allAssets changes
  };

  return (
    <AuthGuard>
      <div className="px-4 sm:px-8 py-6 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Posts</h1>
            </div>
          </div>
          <p className="text-muted-foreground ml-14">Your published posts and assets</p>
        </div>
        <div className="w-full">
        {isAllAssetLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <HomeCardSkeleton key={i} />
            ))}
          </div>
          ) : filteredAssets.length > 0 ? (
            <div className="space-y-6">
              {/* Posts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {filteredAssets.map((asset, index) => (
                  <HomeCard 
                    key={asset.postCid || index} 
                    asset={asset}
                  />
                ))}
              </div>
              
              {/* Pagination Controls - Placeholder for future implementation */}
              {filteredAssets.length > 12 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    disabled={true}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Page 1</span>
                    {isAllAssetLoading && (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  
                  <Button
                    disabled={true}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No Posts Yet"
              description={searchTerm ? `No published posts found matching "${searchTerm}"` : "Your published posts will appear here. Start creating and share your expertise with the world!"}
              actionLabel={!searchTerm ? "Create Your First Post" : undefined}
              onAction={!searchTerm ? () => navigate('/app/editor') : undefined}
              gradient="from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/20"
              iconGradient="from-violet-500 via-purple-600 to-fuchsia-600"
              iconShadow="shadow-violet-500/50"
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

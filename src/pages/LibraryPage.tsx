import { useState, useEffect } from "react";
import { LibraryCard } from "@/components/LibraryCard";
import { AuthGuard } from "@/components/AuthGuard";
import { useSearch } from "@/context/SearchContext";
import { useUserAssets } from "@/hooks/useUserAssets";
import { MessageSquare, ArrowRight, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LibraryPage = () => {
  const { searchTerm } = useSearch();
  const { allUserAssets, isAllUserAssetLoading } = useUserAssets();
  const navigate = useNavigate();

  // Get the posts to display based on title search
  const getPostsToDisplay = () => {
    if (!searchTerm.trim()) return allUserAssets;
    
    return allUserAssets.filter(asset => 
      asset.assetTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPosts = getPostsToDisplay();

  return (
    <AuthGuard>
      <div className="px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Library</h1>
          </div>
          <p className="text-muted-foreground">Your personal collection of assets and posts</p>
        </div>
        <div className="w-full">
          {isAllUserAssetLoading ? (
            <div className="flex justify-center items-center py-4 md:py-8">
              <div className="w-full space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-muted/50 rounded-lg border border-border">
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-muted rounded w-1/4" />
                          <div className="h-3 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : allUserAssets.length > 0 ? (
            <div className="space-y-6">
              {/* Posts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {filteredPosts.map((asset, index) => (
                  <LibraryCard 
                    key={asset.assetCid || index} 
                    asset={asset}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
                <BookOpen className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
                <h2 className="text-2xl font-semibold">No Assets in Library</h2>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000">
                {searchTerm ? `No assets found matching "${searchTerm}"` : "Your library is empty. Start by purchasing assets."}
              </p>
              {!searchTerm && (
                <div 
                  onClick={() => navigate('/app')}
                  className="flex items-center gap-2 text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000 cursor-pointer hover:text-foreground transition-colors"
                >
                  <p>Purchase your first asset</p>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};
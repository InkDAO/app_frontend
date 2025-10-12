import { useState, useEffect } from "react";
import { HomeCard } from "@/components/HomeCard";
import { HomeCardSkeleton } from "@/components/HomeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useSearch } from "@/context/SearchContext";
import { useAssets } from "@/hooks/useAssets";
import { MessageSquare, ArrowRight, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const { searchTerm } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();
  const navigate = useNavigate();

  // Get the posts to display based on title search only
  const getPostsToDisplay = () => {
    if (!searchTerm.trim()) return allAssets;
    
    return allAssets.filter(asset => 
      asset.assetTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPosts = getPostsToDisplay();

  return (
    <div className="px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Posts</h1>
          </div>
        </div>
        <p className="text-muted-foreground ml-14">Discover content from the community</p>
      </div>
      <div className="w-full">
        {isAllAssetLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <HomeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {/* Posts Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                     {filteredPosts.map((asset, index) => (
                       <HomeCard 
                         key={asset.assetCid || index} 
                         asset={asset}
                       />
                     ))}
                   </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
              <MessageSquare className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
              <h2 className="text-2xl font-semibold">No Posts Yet</h2>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000">
              {searchTerm ? `No posts found matching "${searchTerm}"` : "No posts have been published yet"}
            </p>
            {!searchTerm && (
              <div 
                onClick={() => navigate('/app')}
                className="flex items-center gap-2 text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000 cursor-pointer hover:text-foreground transition-colors"
              >
                <p>Be the first to create a post</p>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

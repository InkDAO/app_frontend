import { useState, useEffect } from "react";
import { HomeCard } from "@/components/HomeCard";
import { HomeCardSkeleton } from "@/components/HomeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useSearch } from "@/context/SearchContext";
import { useAssets } from "@/hooks/useAssets";
import { MessageSquare, ArrowRight, Globe, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HomePage = () => {
  const { searchTerm } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "free">("all");

  // Get the posts to display based on title search and active tab
  const getPostsToDisplay = () => {
    let posts = allAssets;
    
    // Apply search filter
    if (searchTerm.trim()) {
      posts = posts.filter(asset => 
        asset.assetTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply tab filter
    if (activeTab === "free") {
      posts = posts.filter(asset => {
        const cost = asset.costInNative || "0";
        const costInEth = parseFloat(cost) / 1e18;
        return costInEth === 0;
      });
    }
    
    // Reverse to show new posts first
    return [...posts].reverse();
  };

  const filteredPosts = getPostsToDisplay();

  return (
    <div className="px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer group border-2 border-border rounded-lg px-4 py-2 hover:border-primary/50 transition-colors w-[200px]">
                <h1 className="text-3xl font-bold tracking-tight flex-1 truncate">
                  {activeTab === "all" ? "All Posts" : "Free Posts"}
                </h1>
                <ChevronDown className="h-6 w-6 transition-transform group-data-[state=open]:rotate-180 flex-shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuItem 
                onClick={() => setActiveTab("all")}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">All Posts</span>
                  {activeTab === "all" && (
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveTab("free")}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Free Posts</span>
                  {activeTab === "free" && (
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-muted-foreground ml-14">
          {activeTab === "all" 
            ? "Discover content from the community" 
            : "Discover free content from the community"}
        </p>
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
              {searchTerm && activeTab === "free" 
                ? `No free posts found matching "${searchTerm}"` 
                : searchTerm 
                ? `No posts found matching "${searchTerm}"` 
                : activeTab === "free"
                ? "No free posts available yet"
                : "No posts have been published yet"}
            </p>
            {!searchTerm && activeTab === "all" && (
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

import { useState, useEffect } from "react";
import { HomeCard } from "@/components/HomeCard";
import { HomeCardSkeleton } from "@/components/HomeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/context/SearchContext";
import { useAssets } from "@/hooks/useAssets";
import { MessageSquare, ArrowRight, Globe, TrendingUp, Star, DollarSign, Rocket, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const POSTS_PER_PAGE = 9;

type FilterType = "all" | "just-created" | "top-performer" | "free";

const FILTER_OPTIONS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Posts", icon: Globe },
  { id: "just-created", label: "Just Created", icon: Clock },
  { id: "top-performer", label: "Top Performer", icon: Star },
  { id: "free", label: "Free Posts", icon: CheckCircle },
];

const HomePage = () => {
  const { searchTerm } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  // Get the posts to display based on title search and active filter
  const getPostsToDisplay = () => {
    let posts = allAssets;
    
    // Apply search filter
    if (searchTerm.trim()) {
      posts = posts.filter(asset => 
        asset.assetTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filter
    if (activeFilter === "free") {
      posts = posts.filter(asset => {
        const cost = asset.costInNative || "0";
        const costInEth = parseFloat(cost) / 1e18;
        return costInEth === 0;
      });
    } else if (activeFilter === "just-created") {
      // Show newest posts first (already reversed below)
      posts = [...posts];
    } else if (activeFilter === "top-performer") {
      // Could be based on number of purchases or revenue in the future
      posts = [...posts];
    }
    
    // Reverse to show new posts first
    return [...posts].reverse();
  };

  const filteredPosts = getPostsToDisplay();

  // Get visible posts
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [searchTerm, activeFilter]);

  // Handle view more
  const handleViewMore = () => {
    setVisibleCount(prev => prev + POSTS_PER_PAGE);
  };

  return (
    <div className="px-4 sm:px-8 py-6 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Discover Posts
          </h1>
        </div>
        
        {/* Horizontal Scrollable Filter Card */}
        <div className="-mx-4 sm:mx-0 w-[100vw] sm:w-auto bg-muted/50 border-y sm:border sm:border-border sm:rounded-xl">
          <div className="overflow-x-auto scrollbar-hide px-4 py-2">
            <div className="flex gap-3">
              {FILTER_OPTIONS.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 font-medium rounded-lg
                      transition-all duration-200 whitespace-nowrap flex-shrink-0
                      ${isActive 
                        ? 'text-foreground bg-background/80' 
                        : 'text-muted-foreground hover:text-foreground/80 hover:bg-background/40'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      {filter.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground mt-4">
          {activeFilter === "all" 
            ? "Discover all content from the community" 
            : activeFilter === "free"
            ? "Discover free content from the community"
            : activeFilter === "just-created"
            ? "Discover the newest posts"
            : activeFilter === "top-performer"
            ? "Discover the most popular posts"
            : "Discover content from the community"}
        </p>
      </div>

      <div className="w-full">
        {isAllAssetLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <HomeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {visiblePosts.map((asset, index) => (
                <HomeCard 
                  key={asset.assetCid || index} 
                  asset={asset}
                />
              ))}
            </div>
            
            {/* View More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleViewMore}
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-base font-medium bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200"
                >
                  View More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
              <MessageSquare className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
              <h2 className="text-2xl font-semibold">No Posts Yet</h2>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000">
              {searchTerm && activeFilter === "free" 
                ? `No free posts found matching "${searchTerm}"` 
                : searchTerm 
                ? `No posts found matching "${searchTerm}"` 
                : activeFilter === "free"
                ? "No free posts available yet"
                : "No posts have been published yet"}
            </p>
            {!searchTerm && activeFilter === "all" && (
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

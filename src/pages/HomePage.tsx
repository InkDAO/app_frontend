import { useState, useEffect } from "react";
import { HomeCard } from "@/components/HomeCard";
import { HomeCardSkeleton } from "@/components/HomeCardSkeleton";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/context/SearchContext";
import { useAssets } from "@/hooks/useAssets";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { MessageSquare, ArrowRight, Globe, Clock, Search, Megaphone, Gift, Star, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { admin } from "@/contracts/dXmaster";

const POSTS_PER_PAGE = 9;

type FilterType = "just-created" | "top-reads" | "announcements" | "free";

const FILTER_OPTIONS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: "just-created", label: "Just Created", icon: Clock },
  { id: "top-reads", label: "Top Reads", icon: Star },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "free", label: "Free Posts", icon: Gift },
];

const HomePage = () => {
  const { searchTerm, setSearchTerm } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("just-created");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
    } else if (activeFilter === "top-reads") {
      // Could be based on number of purchases or revenue in the future
      posts = [...posts];
    } else if (activeFilter === "announcements") {
      posts = posts.filter(asset => {
        return asset.author.toLowerCase() === admin.toLowerCase();
      });
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
    if (isLoadingMore) return; // Prevent multiple calls
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleCount(prev => prev + POSTS_PER_PAGE);
      setIsLoadingMore(false);
    }, 800);
  };

  // Infinite scroll hook
  useInfiniteScroll({
    hasMore,
    isLoading: isAllAssetLoading || isLoadingMore,
    onLoadMore: handleViewMore,
    threshold: 300, // Trigger when 300px from bottom
  });

  return (
    <div className="px-4 sm:px-8 py-6 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        {/* Hero Section with Punchline */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-8 mb-6 border border-border/50">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-700/25" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 shadow-lg">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Discover Posts
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground font-medium mb-2">
                  Explore decentralized content, <span className="text-foreground font-semibold">own your knowledge</span>
                </p>
                <p className="text-sm sm:text-base text-muted-foreground/80 font-medium">
                  Pay once. Access forever. <span className="text-foreground/70">No subscriptions.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter Bar and Search Bar Container */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 mb-4">
          {/* Horizontal Scrollable Filter Card */}
          <div className="-mx-4 sm:mx-0 w-[100vw] sm:w-fit bg-muted/50 border-y sm:border sm:border-border sm:rounded-xl h-10">
            <div className="overflow-x-auto scrollbar-hide px-0 h-full flex items-center">
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
                          ? 'text-foreground bg-background shadow-md border border-border/50 scale-[1.02]' 
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

          {/* Search Bar */}
          <div className="w-full sm:w-auto sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 h-10 w-full rounded-xl border-2 border-black dark:border-white focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted/50"
              />
            </div>
          </div>
        </div>
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
            
            {/* Loading indicator for infinite scroll */}
            {hasMore && (
              <div className="flex justify-center pt-8 pb-4">
                {isLoadingMore ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-base font-medium text-muted-foreground">Loading more posts...</span>
                  </div>
                ) : (
                  <div className="h-20" /> // Spacer for scroll trigger
                )}
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
            {!searchTerm && activeFilter === "just-created" && (
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

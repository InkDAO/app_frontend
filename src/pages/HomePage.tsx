import { useState, useEffect } from "react";
import { HomeCard } from "@/components/HomeCard";
import { HomeCardSkeleton } from "@/components/HomeCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/context/SearchContext";
import { useAssets } from "@/hooks/useAssets";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { handleGetFilesByTags } from "@/services/pinataService";
import { Clock, Search, Megaphone, Gift, Star, Loader2, X, Edit3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { admin } from "@/contracts/marketPlace";
import { useReadContracts } from "wagmi";
import { marketPlaceContract } from "@/contracts/marketPlace";

const POSTS_PER_PAGE = 9;

type FilterType = "just-created" | "top-reads" | "announcements" | "free";

const FILTER_OPTIONS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: "just-created", label: "Just Created", icon: Clock },
  { id: "top-reads", label: "Top Reads", icon: Star },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "free", label: "Free Posts", icon: Gift },
];

const HomePage = () => {
  const { searchTerm, setSearchTerm, selectedTags, setSelectedTags } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("just-created");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [tagFilteredCids, setTagFilteredCids] = useState<string[]>([]);
  const [assetSupplies, setAssetSupplies] = useState<Record<string, number>>({});
  
  // Batch read all totalSupply values
  // @ts-ignore - Type instantiation depth issue with dynamic contract array
  const { data: totalSupplyData } = useReadContracts({
    contracts: allAssets.map((asset) => ({
      address: marketPlaceContract.address as `0x${string}`,
      abi: marketPlaceContract.abi,
      functionName: 'totalSupply',
      args: [asset.postId],
    })),
  });

  // Update asset supplies when data is loaded
  useEffect(() => {
    if (totalSupplyData && allAssets.length > 0) {
      const supplies: Record<string, number> = {};
      allAssets.forEach((asset, index) => {
        const result = totalSupplyData[index];
        if (result && result.status === 'success' && result.result !== undefined) {
          supplies[asset.postId] = Number(result.result);
        } else {
          supplies[asset.postId] = 0;
        }
      });
      setAssetSupplies(supplies);
    }
  }, [totalSupplyData, allAssets]);

  // Fetch files by tags when tags are selected
  useEffect(() => {
    const fetchByTags = async () => {
      if (selectedTags.length > 0) {
        try {
          const tagFiles = await handleGetFilesByTags(selectedTags);
          const cids = tagFiles.map((file: any) => file.cid).filter(Boolean);
          setTagFilteredCids(cids);
        } catch (error) {
          console.error('Error fetching files by tags:', error);
          setTagFilteredCids([]);
        }
      } else {
        setTagFilteredCids([]);
      }
    };
    
    fetchByTags();
  }, [selectedTags]);

  // Get the posts to display based on title search, tags, and active filter
  const getPostsToDisplay = () => {
    let posts = allAssets;
    
    // Apply tag filter first (if any tags selected)
    if (selectedTags.length > 0 && tagFilteredCids.length > 0) {
      posts = posts.filter(asset => tagFilteredCids.includes(asset.postCid));
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      posts = posts.filter(asset => 
        asset.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filter
    if (activeFilter === "free") {
      posts = posts.filter(asset => {
        const cost = asset.priceInNative || "0";
        const costInEth = parseFloat(cost) / 1e18;
        return costInEth === 0;
      });
      // Reverse to show new posts first
      return [...posts].reverse();
    } else if (activeFilter === "just-created") {
      // Show newest posts first (already reversed below)
      // Reverse to show new posts first
      return [...posts].reverse();
    } else if (activeFilter === "top-reads") {
      // Sort by totalSupply (number of mints) in descending order
      return [...posts].sort((a, b) => {
        const supplyA = assetSupplies[a.postId] || 0;
        const supplyB = assetSupplies[b.postId] || 0;
        return supplyB - supplyA; // Descending order
      });
    } else if (activeFilter === "announcements") {
      posts = posts.filter(asset => {
        return asset.author.toLowerCase() === admin.toLowerCase();
      });
      // Reverse to show new posts first
      return [...posts].reverse();
    }
    
    // Default: reverse to show new posts first
    return [...posts].reverse();
  };

  const filteredPosts = getPostsToDisplay();

  // Get visible posts
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [searchTerm, activeFilter, selectedTags]);

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

  // Get hero content based on active filter
  const getHeroContent = () => {
    switch (activeFilter) {
      case "just-created":
        return {
          title: "Just Created",
          gradient: "from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-pink-950/40",
          titleGradient: "from-blue-600 via-purple-600 to-pink-600 dark:from-blue-300 dark:via-purple-300 dark:to-pink-300",
          iconGradient: "from-blue-500 via-purple-600 to-pink-600",
          iconShadow: "shadow-blue-500/50",
          blobGradient1: "from-blue-400/30 to-purple-400/30",
          blobGradient2: "from-pink-400/20 to-rose-400/20",
          icon: Clock,
          subtitle: "Fresh content from our community, <span class='text-foreground font-semibold'>hot off the press</span>",
          tagline: "New posts. Fresh insights. Latest knowledge."
        };
      case "top-reads":
        return {
          title: "Top Reads",
          gradient: "from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/40 dark:to-orange-950/40",
          titleGradient: "from-amber-600 via-yellow-600 to-orange-600 dark:from-amber-300 dark:via-yellow-300 dark:to-orange-300",
          iconGradient: "from-amber-500 via-yellow-600 to-orange-600",
          iconShadow: "shadow-amber-500/50",
          blobGradient1: "from-amber-400/30 to-yellow-400/30",
          blobGradient2: "from-orange-400/20 to-red-400/20",
          icon: Star,
          subtitle: "Most popular posts, <span class='text-foreground font-semibold'>loved by readers</span>",
          tagline: "Trending content. Quality reads. Community favorites."
        };
      case "announcements":
        return {
          title: "Announcements",
          gradient: "from-red-50 via-rose-50 to-pink-50 dark:from-red-950/40 dark:via-rose-950/40 dark:to-pink-950/40",
          titleGradient: "from-red-600 via-rose-600 to-pink-600 dark:from-red-300 dark:via-rose-300 dark:to-pink-300",
          iconGradient: "from-red-500 via-rose-600 to-pink-600",
          iconShadow: "shadow-red-500/50",
          blobGradient1: "from-red-400/30 to-rose-400/30",
          blobGradient2: "from-pink-400/20 to-fuchsia-400/20",
          icon: Megaphone,
          subtitle: "Official updates and platform news, <span class='text-foreground font-semibold'>stay informed</span>",
          tagline: "Platform updates. Important notices. Community news."
        };
      case "free":
        return {
          title: "Free Posts",
          gradient: "from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40",
          titleGradient: "from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300",
          iconGradient: "from-emerald-500 via-teal-600 to-cyan-600",
          iconShadow: "shadow-emerald-500/50",
          blobGradient1: "from-emerald-400/30 to-teal-400/30",
          blobGradient2: "from-cyan-400/20 to-blue-400/20",
          icon: Gift,
          subtitle: "Explore free content, <span class='text-foreground font-semibold'>no cost to access</span>",
          tagline: "Free access. Zero cost. Open knowledge."
        };
    }
  };

  const heroContent = getHeroContent();
  const HeroIcon = heroContent.icon;

  // Get empty state icon based on active filter
  const getEmptyStateIcon = () => {
    switch (activeFilter) {
      case "just-created":
        return Clock;
      case "top-reads":
        return Star;
      case "announcements":
        return Megaphone;
      case "free":
        return Gift;
      default:
        return Sparkles;
    }
  };

  // Get empty state title
  const getEmptyStateTitle = () => {
    if (selectedTags.length > 0) {
      return "No Posts Found";
    }
    if (searchTerm) {
      return "No Results Found";
    }
    switch (activeFilter) {
      case "just-created":
        return "No Posts Yet";
      case "top-reads":
        return "No Popular Posts";
      case "announcements":
        return "No Announcements";
      case "free":
        return "No Free Posts";
      default:
        return "No Posts Yet";
    }
  };

  // Get empty state description
  const getEmptyStateDescription = () => {
    if (selectedTags.length > 0) {
      return "No posts found with the selected tags. Try different tags or clear the filter.";
    }
    if (searchTerm && activeFilter === "free") {
      return `No free posts found matching "${searchTerm}". Try a different search term or explore other filters.`;
    }
    if (searchTerm) {
      return `No posts found matching "${searchTerm}". Try a different search term or browse all posts.`;
    }
    switch (activeFilter) {
      case "just-created":
        return "Be the first to share your knowledge! Create a post and start earning from your content.";
      case "top-reads":
        return "No popular posts available yet. Check back soon or be the first to create trending content!";
      case "announcements":
        return "No official announcements at this time. Stay tuned for platform updates and news!";
      case "free":
        return "No free posts available yet. Explore paid posts or create your own free content!";
      default:
        return "No posts have been published yet. Be the first to share your expertise!";
    }
  };

  return (
    <div className="px-4 sm:px-8 py-6 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
      <div className="mb-8 sm:mb-10">
        {/* Hero Section with Dynamic Content */}
        <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${heroContent.gradient} p-4 sm:p-6 lg:p-8 mb-6 border-0 shadow-2xl dark:shadow-primary/10`}>
          {/* Animated Background Blobs */}
          <div className={`absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br ${heroContent.blobGradient1 || 'from-blue-400/30 to-indigo-400/30'} rounded-full blur-3xl animate-pulse`} />
          <div className={`absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br ${heroContent.blobGradient2 || 'from-purple-400/20 to-pink-400/20'} rounded-full blur-3xl animate-pulse delay-1000`} />
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${heroContent.iconGradient} shadow-lg sm:shadow-xl ${heroContent.iconShadow || 'shadow-blue-500/50'} flex-shrink-0 transform hover:scale-105 transition-transform duration-300`}>
                <HeroIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight mb-1.5 sm:mb-2 bg-gradient-to-r ${heroContent.titleGradient} bg-clip-text text-transparent drop-shadow-sm`}>
                  {heroContent.title}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground font-semibold mb-2 sm:mb-2.5" dangerouslySetInnerHTML={{ __html: heroContent.subtitle }} />
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground/80 font-medium">
                  {heroContent.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Selected Tags Display */}
        {selectedTags.length > 0 && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">Filtering by tags:</span>
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="flex items-center gap-1 cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                >
                  #{tag}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
        
        {/* Filter Bar and Search Bar Container */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 mb-4">
          {/* Horizontal Scrollable Filter Card */}
          <div className="-mx-4 sm:mx-0 w-[100vw] sm:w-fit bg-white/70 dark:bg-black/30 backdrop-blur-md border-y sm:border border-white/20 dark:border-white/10 sm:rounded-xl h-10 shadow-lg shadow-black/5 dark:shadow-black/20">
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
                          ? 'text-foreground bg-white/80 dark:bg-white/10 backdrop-blur-sm shadow-md border border-white/30 dark:border-white/20 scale-[1.02]' 
                          : 'text-muted-foreground hover:text-foreground/80 hover:bg-white/40 dark:hover:bg-white/5'
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
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <HomeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {visiblePosts.map((post, index) => (
                <HomeCard 
                  key={post.postCid || index} 
                  asset={post}
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
          <EmptyState
            icon={getEmptyStateIcon()}
            title={getEmptyStateTitle()}
            description={getEmptyStateDescription()}
            actionLabel={!searchTerm && !selectedTags.length ? "Create First Post" : undefined}
            onAction={!searchTerm && !selectedTags.length ? () => navigate('/app/editor') : undefined}
            gradient={heroContent.gradient}
            iconGradient={heroContent.iconGradient}
            iconShadow={heroContent.iconShadow}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;

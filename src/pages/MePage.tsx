import { useState, useEffect } from "react";
import { HomeCard } from "@/components/HomeCard";
import { HomeCardSkeleton } from "@/components/HomeCardSkeleton";
import { LibraryCard } from "@/components/LibraryCard";
import { LibraryCardSkeleton } from "@/components/LibraryCardSkeleton";
import { SavedPostCard } from "@/components/SavedPostCard";
import { SavedPostCardSkeleton } from "@/components/SavedPostCardSkeleton";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, RefreshCw, ChevronLeft, ChevronRight, User2, Sparkles, BookOpen, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAssets } from "@/hooks/useAssets";
import { useUserAssets } from "@/hooks/useUserAssets";
import { useAccount } from "wagmi";
import { useSearch } from "@/context/SearchContext";
import { fetchSavedPosts, fetchSavedPostsByNextPageToken } from "@/services/dXService";
import { useAuth } from "@/hooks/useAuth";

type TabType = "my-posts" | "library" | "drafts";

const TAB_OPTIONS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "my-posts", label: "My Posts", icon: Sparkles },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "drafts", label: "Drafts", icon: FileText },
];

const POSTS_PER_PAGE = 9;

export const MePage = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { isAuthenticated } = useAuth();
  const { searchTerm } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();
  const { allUserAssets, isAllUserAssetLoading } = useUserAssets();
  
  const [activeTab, setActiveTab] = useState<TabType>("my-posts");
  
  // View more state for my-posts and library tabs
  const [myPostsVisibleCount, setMyPostsVisibleCount] = useState(POSTS_PER_PAGE);
  const [libraryVisibleCount, setLibraryVisibleCount] = useState(POSTS_PER_PAGE);
  
  // Drafts state
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isSavedPostsLoading, setIsSavedPostsLoading] = useState(false);
  const [savedPostsError, setSavedPostsError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<{token: string | null, page: number}[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Filter my assets from all assets (for My Posts)
  const filterMyAssets = () => {
    if (!address) return [];
    return allAssets.filter((asset) => {
      return asset.author.toLowerCase() === address?.toLowerCase();
    });
  };

  // Get filtered My Posts based on search term
  const getFilteredMyPosts = () => {
    const myAssets = filterMyAssets();
    let posts = myAssets;
    
    if (searchTerm.trim()) {
      posts = posts.filter(asset => 
        asset.assetTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Reverse to show new posts first
    return [...posts].reverse();
  };

  // Get filtered Library posts based on search term
  const getFilteredLibraryPosts = () => {
    let posts = allUserAssets;
    
    if (searchTerm.trim()) {
      posts = posts.filter(asset => 
        asset.assetTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Reverse to show new posts first
    return [...posts].reverse();
  };

  const filteredMyPosts = getFilteredMyPosts();
  const filteredLibraryPosts = getFilteredLibraryPosts();

  // Get visible posts for my posts
  const visibleMyPosts = filteredMyPosts.slice(0, myPostsVisibleCount);
  const myPostsHasMore = myPostsVisibleCount < filteredMyPosts.length;

  // Get visible posts for library
  const visibleLibraryPosts = filteredLibraryPosts.slice(0, libraryVisibleCount);
  const libraryHasMore = libraryVisibleCount < filteredLibraryPosts.length;

  // Reset visible count when search term changes
  useEffect(() => {
    setMyPostsVisibleCount(POSTS_PER_PAGE);
    setLibraryVisibleCount(POSTS_PER_PAGE);
  }, [searchTerm]);

  // Reset visible count when tab changes
  useEffect(() => {
    setMyPostsVisibleCount(POSTS_PER_PAGE);
    setLibraryVisibleCount(POSTS_PER_PAGE);
  }, [activeTab]);

  // Handle view more for my posts
  const handleMyPostsViewMore = () => {
    setMyPostsVisibleCount(prev => prev + POSTS_PER_PAGE);
  };

  // Handle view more for library
  const handleLibraryViewMore = () => {
    setLibraryVisibleCount(prev => prev + POSTS_PER_PAGE);
  };

  // Fetch saved posts when component mounts or tab changes
  const handleFetchSavedPosts = async () => {
    if (!address) return;
    
    setIsSavedPostsLoading(true);
    setSavedPostsError(null);
    
    try {
      const result = await fetchSavedPosts(address);
      
      setSavedPosts(result.posts);
      setNextPageToken(result.nextPageToken || null);
      setPageHistory([{token: null, page: 0}]);
      setCurrentPage(0);
    } catch (error) {
      console.error('Failed to fetch saved posts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch saved posts';
      
      if (errorMessage.includes('Access forbidden')) {
        setIsLoggingOut(true);
        setSavedPosts([]);
        setNextPageToken(null);
        setPageHistory([]);
        setCurrentPage(0);
        setSavedPostsError(null);
      } else {
        setSavedPostsError(errorMessage);
      }
    } finally {
      setIsSavedPostsLoading(false);
    }
  };

  // Fetch next page of saved posts
  const handleFetchNextPage = async () => {
    if (!address || !nextPageToken) return;
    
    setIsSavedPostsLoading(true);
    setSavedPostsError(null);
    
    try {
      setPageHistory(prev => {
        const newHistory = [...prev, {token: nextPageToken, page: currentPage + 1}];
        return newHistory;
      });
      
      const result = await fetchSavedPostsByNextPageToken(address, nextPageToken);
      
      setSavedPosts(result.posts);
      setNextPageToken(result.nextPageToken || null);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to fetch next page of saved posts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch next page';
      
      if (errorMessage.includes('Access forbidden')) {
        setIsLoggingOut(true);
        setSavedPosts([]);
        setNextPageToken(null);
        setPageHistory([]);
        setCurrentPage(0);
        setSavedPostsError(null);
      } else {
        setSavedPostsError(errorMessage);
      }
    } finally {
      setIsSavedPostsLoading(false);
    }
  };

  // Fetch previous page of saved posts
  const handleFetchPreviousPage = async () => {
    if (!address || currentPage === 0) return;
    
    setIsSavedPostsLoading(true);
    setSavedPostsError(null);
    
    try {
      const newPageHistory = [...pageHistory];
      newPageHistory.pop();
      setPageHistory(newPageHistory);
      
      const previousPageInfo = newPageHistory[newPageHistory.length - 1];
      
      if (previousPageInfo) {
        if (previousPageInfo.token === null) {
          const result = await fetchSavedPosts(address);
          setSavedPosts(result.posts);
          setNextPageToken(result.nextPageToken || null);
          setCurrentPage(0);
        } else {
          const result = await fetchSavedPostsByNextPageToken(address, previousPageInfo.token);
          setSavedPosts(result.posts);
          setNextPageToken(result.nextPageToken || null);
          setCurrentPage(previousPageInfo.page);
        }
      }
    } catch (error) {
      console.error('Failed to fetch previous page of saved posts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch previous page';
      
      if (errorMessage.includes('Access forbidden')) {
        setIsLoggingOut(true);
        setSavedPosts([]);
        setNextPageToken(null);
        setPageHistory([]);
        setCurrentPage(0);
        setSavedPostsError(null);
      } else {
        setSavedPostsError(errorMessage);
      }
    } finally {
      setIsSavedPostsLoading(false);
    }
  };

  // Handle deletion of a saved post
  const handleDeleteSavedPost = (deletedCid: string) => {
    setSavedPosts(prevPosts => 
      prevPosts.filter(post => post.cid !== deletedCid)
    );
  };

  // Reset logout state when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoggingOut(false);
    }
  }, [isAuthenticated]);

  // Fetch saved posts when drafts tab is active
  useEffect(() => {
    if (address && isAuthenticated && activeTab === "drafts") {
      handleFetchSavedPosts();
    }
  }, [address, isAuthenticated, activeTab]);

  // Get tab configuration
  const getTabConfig = () => {
    switch (activeTab) {
      case "my-posts":
        return {
          title: "My Posts",
          description: "Your published posts and assets",
          icon: Sparkles,
          gradient: "from-violet-500 to-purple-600"
        };
      case "library":
        return {
          title: "Library",
          description: "Your personal collection of assets and posts",
          icon: BookOpen,
          gradient: "from-emerald-500 to-teal-600"
        };
      case "drafts":
        return {
          title: "Drafts",
          description: "Your saved posts and drafts",
          icon: FileText,
          gradient: "from-amber-500 to-orange-600"
        };
    }
  };

  const tabConfig = getTabConfig();
  const TabIcon = tabConfig.icon;

  // Render content based on active tab
  const renderContent = () => {
    // My Posts Tab
    if (activeTab === "my-posts") {
      if (isAllAssetLoading) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <HomeCardSkeleton key={i} />
            ))}
          </div>
        );
      }

      if (filteredMyPosts.length > 0) {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {visibleMyPosts.map((asset, index) => (
                <HomeCard 
                  key={asset.assetCid || index} 
                  asset={asset}
                />
              ))}
            </div>
            
            {/* View More Button */}
            {myPostsHasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleMyPostsViewMore}
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-base font-medium bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200"
                >
                  View More
                </Button>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
            <MessageSquare className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
            <h2 className="text-2xl font-semibold">No Posts Yet</h2>
          </div>
          <p className="text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000">
            Your published posts will appear here when you have any
          </p>
          <div 
            onClick={() => navigate('/app/editor')}
            className="flex items-center gap-2 text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000 cursor-pointer hover:text-foreground transition-colors"
          >
            <p>Create your first post to get started</p>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      );
    }

    // Library Tab
    if (activeTab === "library") {
      if (isAllUserAssetLoading) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <LibraryCardSkeleton key={i} />
            ))}
          </div>
        );
      }

      if (filteredLibraryPosts.length > 0) {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {visibleLibraryPosts.map((asset, index) => (
                <LibraryCard 
                  key={asset.assetCid || index} 
                  asset={asset}
                />
              ))}
            </div>
            
            {/* View More Button */}
            {libraryHasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleLibraryViewMore}
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-base font-medium bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200"
                >
                  View More
                </Button>
              </div>
            )}
          </div>
        );
      }

      return (
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
      );
    }

    // Drafts Tab
    if (activeTab === "drafts") {
      if (isSavedPostsLoading || isLoggingOut) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SavedPostCardSkeleton key={i} />
            ))}
          </div>
        );
      }

      if (savedPostsError) {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-red-500 mb-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Error Loading Drafts</h2>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              {savedPostsError}
            </p>
            <Button onClick={handleFetchSavedPosts} variant="outline">
              Try Again
            </Button>
          </div>
        );
      }

      if (savedPosts.length > 0) {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {[...savedPosts].reverse().map((savedPost, index) => (
                <SavedPostCard 
                  key={savedPost.cid || index} 
                  savedPost={savedPost}
                  onDelete={handleDeleteSavedPost}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                onClick={handleFetchPreviousPage}
                disabled={isSavedPostsLoading || currentPage === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Page {currentPage + 1}</span>
                {isSavedPostsLoading && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
              </div>
              
              <Button
                onClick={handleFetchNextPage}
                disabled={isSavedPostsLoading || !nextPageToken}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
            <FileText className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
            <h2 className="text-2xl font-semibold">No Drafts</h2>
          </div>
          <p className="text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000">
            Your saved posts will appear here when you have any
          </p>
          <div 
            onClick={() => navigate('/app/editor')}
            className="flex items-center gap-2 text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000 cursor-pointer hover:text-foreground transition-colors"
          >
            <p>Start writing your first post</p>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      );
    }
  };

  return (
    <AuthGuard>
      <div className="px-4 sm:px-8 py-6 lg:px-12 xl:px-16 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${tabConfig.gradient}`}>
              <TabIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              My Content
            </h1>
          </div>
          
          {/* Horizontal Scrollable Tab Card */}
          <div className="-mx-4 sm:mx-0 w-[100vw] sm:w-auto bg-muted/50 border-y sm:border sm:border-border sm:rounded-xl">
            <div className="overflow-x-auto scrollbar-hide px-4 py-2">
              <div className="flex gap-3">
                {TAB_OPTIONS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground mt-4">{tabConfig.description}</p>
        </div>
        
        <div className="w-full">
          {renderContent()}
        </div>
      </div>
    </AuthGuard>
  );
};


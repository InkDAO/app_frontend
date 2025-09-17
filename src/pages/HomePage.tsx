import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { PostCard } from "@/components/PostCard";
import { TagSearch } from "@/components/TagSearch";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Hash, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosts } from "@/hooks/usePosts";
import { handleGetFilesByTags } from "@/services/pinataService";
import { Post } from "@/types";

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchMode, setSearchMode] = useState<'title' | 'tags'>('title');
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [isTagSearchLoading, setIsTagSearchLoading] = useState(false);
  const [hasSelectedTags, setHasSelectedTags] = useState(false);
  const [activeTab, setActiveTab] = useState("just-created");
  const { allPosts, isAllPostLoading } = usePosts();

  // Filter posts that haven't expired yet
  const activePosts = allPosts.filter(post => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds
    return !post.archived && currentTimestamp < parseInt(post.endTime);
  });

  // Handle tag search
  const handleTagSearch = async (tags: string[]) => {
    setHasSelectedTags(tags.length > 0);
    
    if (tags.length === 0) {
      setTaggedPosts([]);
      return;
    }

    setIsTagSearchLoading(true);
    try {
      const fileMetadataList = await handleGetFilesByTags(tags);
      
      // Convert file metadata to posts by matching CIDs
      const matchedPosts = allPosts.filter(post => 
        fileMetadataList.some(file => file.cid === post.postCid)
      );
      
      setTaggedPosts(matchedPosts);
    } catch (error) {
      console.error('Failed to search by tags:', error);
      setTaggedPosts([]);
    } finally {
      setIsTagSearchLoading(false);
    }
  };

  // Get the posts to display based on search mode
  const getPostsToDisplay = () => {
    if (searchMode === 'tags') {
      // If no tags selected, show all active posts
      if (!hasSelectedTags) {
        return activePosts;
      }
      // If tags selected but no matches found, show empty array
      // If tags selected and matches found, filter tagged posts that are also active
      return taggedPosts.filter(post => {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        return !post.archived && currentTimestamp < parseInt(post.endTime);
      });
    } else {
      // Filter posts based on search term (title search)
      return activePosts.filter(post => 
        post.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  };

  const filteredPosts = getPostsToDisplay();

  // Sort posts based on active tab
  const sortedAndFilteredPosts = filteredPosts.sort((a, b) => {
    if (activeTab === "just-created") {
      // Sort by post ID (assuming higher IDs are newer) - newest first
      const idA = parseInt(a.postId);
      const idB = parseInt(b.postId);
      return idB - idA; // Newest first
    } else if (activeTab === "top-reads") {
      // Sort by expiration time (endTime) - longest lasting first (more popular)
      const timeA = parseInt(a.endTime);
      const timeB = parseInt(b.endTime);
      return timeB - timeA; // Longest lasting first
    }
    return 0;
  });

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleModeSwitch = (mode: 'title' | 'tags') => {
    setSearchMode(mode);
    if (mode === 'title') {
      setTaggedPosts([]);
    } else {
      setSearchTerm('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-2 lg:px-8 md:py-6 max-w-7xl">
        <div className="mb-6">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-sm w-fit">
              <button
                onClick={() => setActiveTab("just-created")}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "just-created"
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Just Created</span>
              </button>
              <button
                onClick={() => setActiveTab("top-reads")}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === "top-reads"
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Top Reads</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "just-created" && (
          <div>
            {/* Search Mode Toggle */}
            <div className="flex gap-2 mb-4">
          <Button
            variant={searchMode === 'title' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeSwitch('title')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search by Title
          </Button>
          <Button
            variant={searchMode === 'tags' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeSwitch('tags')}
            className="flex items-center gap-2"
          >
            <Hash className="h-4 w-4" />
            Search by Tags
          </Button>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          {searchMode === 'title' ? (
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search posts by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 sm:w-10 p-0 hover:bg-transparent flex-shrink-0"
                onClick={toggleSort}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TagSearch
                  onTagSearch={handleTagSearch}
                  isLoading={isTagSearchLoading}
                  placeholder="Enter tags to search posts (e.g., tech, web3, design)..."
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 sm:w-10 p-0 hover:bg-transparent flex-shrink-0"
                onClick={toggleSort}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

            {/* Results */}
            {(isAllPostLoading || isTagSearchLoading) ? (
              <div className="flex justify-center items-center py-2 md:py-4">
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
            ) : sortedAndFilteredPosts.length > 0 ? (
              sortedAndFilteredPosts.map((post) => (
                <PostCard key={post.postId} post={post} />
              ))
            ) : (searchTerm || searchMode === 'tags') ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">
                  {searchMode === 'tags' 
                    ? 'No active posts found with the selected tags'
                    : 'No active posts match your search'
                  }
                </p>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">No active posts found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "top-reads" && (
          <div>
            {/* Search Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={searchMode === 'title' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeSwitch('title')}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search by Title
              </Button>
              <Button
                variant={searchMode === 'tags' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeSwitch('tags')}
                className="flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                Search by Tags
              </Button>
            </div>

            {/* Search Section */}
            <div className="mb-6">
              {searchMode === 'title' ? (
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search posts by title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 sm:w-10 p-0 hover:bg-transparent flex-shrink-0"
                    onClick={toggleSort}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <TagSearch
                      onTagSearch={handleTagSearch}
                      isLoading={isTagSearchLoading}
                      placeholder="Enter tags to search posts (e.g., tech, web3, design)..."
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 sm:w-10 p-0 hover:bg-transparent flex-shrink-0"
                    onClick={toggleSort}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Results */}
            {(isAllPostLoading || isTagSearchLoading) ? (
              <div className="flex justify-center items-center py-2 md:py-4">
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
            ) : sortedAndFilteredPosts.length > 0 ? (
              sortedAndFilteredPosts.map((post) => (
                <PostCard key={post.postId} post={post} />
              ))
            ) : (searchTerm || searchMode === 'tags') ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">
                  {searchMode === 'tags' 
                    ? 'No active posts found with the selected tags'
                    : 'No active posts match your search'
                  }
                </p>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">No active posts found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;

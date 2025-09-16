import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { PostCard } from "@/components/PostCard";
import { SavedPostCard } from "@/components/SavedPostCard";
import { TagSearch } from "@/components/TagSearch";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, ArrowUpDown, Wallet, MessageSquare, ArrowRight, Hash, Bookmark, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePosts } from "@/hooks/usePosts";
import { handleGetFilesByTags } from "@/services/pinataService";
import { fetchSavedPosts } from "@/services/dXService";
import { Post } from "@/types";

export const MyPostsPage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchMode, setSearchMode] = useState<'title' | 'tags'>('title');
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [isTagSearchLoading, setIsTagSearchLoading] = useState(false);
  const [hasSelectedTags, setHasSelectedTags] = useState(false);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isSavedPostsLoading, setIsSavedPostsLoading] = useState(false);
  const [savedPostsError, setSavedPostsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("my-posts");
  const { allPosts, isAllPostLoading } = usePosts();

  const myPosts = allPosts.filter((post) => {
    return post.owner.toLowerCase() === address?.toLowerCase();
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
      
      // Convert file metadata to posts by matching CIDs and filter by owner
      const matchedPosts = myPosts.filter(post => 
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
      // If no tags selected, show all my posts
      if (!hasSelectedTags) {
        return myPosts;
      }
      // If tags selected but no matches found, show empty array
      // If tags selected and matches found, show tagged posts
      return taggedPosts;
    } else {
      // Filter posts based on search term (title search)
      return myPosts.filter(post => 
        post.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  };

  const filteredPosts = getPostsToDisplay();

  // Sort posts based on expiration time
  const sortedAndFilteredPosts = filteredPosts.sort((a, b) => {
    const timeA = parseInt(a.endTime);
    const timeB = parseInt(b.endTime);
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
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

  // Fetch saved posts when tab switches to saved posts
  const handleFetchSavedPosts = async () => {
    if (!address) return;
    
    setIsSavedPostsLoading(true);
    setSavedPostsError(null);
    
    try {
      const savedPostsData = await fetchSavedPosts(address);
      setSavedPosts(savedPostsData);
    } catch (error) {
      console.error('Failed to fetch saved posts:', error);
      setSavedPostsError(error instanceof Error ? error.message : 'Failed to fetch saved posts');
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

  // Fetch saved posts when tab changes to saved posts
  useEffect(() => {
    if (activeTab === 'saved-posts' && address && isConnected) {
      handleFetchSavedPosts();
    }
  }, [activeTab, address, isConnected]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Posts</h1>
          </div>
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
              <Wallet className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
              <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000">
              Connect wallet to view your posts
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="my-posts" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Posts
              </TabsTrigger>
              <TabsTrigger value="saved-posts" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Posts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-posts" className="mt-6">
              {isAllPostLoading ? (
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
              ) : myPosts.length > 0 ? (
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
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search your posts by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-transparent"
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
                            placeholder="Search your posts by tags..."
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-transparent"
                          onClick={toggleSort}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Posts Results */}
                  {(isTagSearchLoading) ? (
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
                  ) : sortedAndFilteredPosts.length > 0 ? (
                    sortedAndFilteredPosts.map((post) => (
                      <PostCard key={post.postId} post={post} />
                    ))
                  ) : (searchTerm || searchMode === 'tags') ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground mb-4">
                        {searchMode === 'tags' 
                          ? 'No posts found with the selected tags'
                          : 'No posts match your search'
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
                    <MessageSquare className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
                    <h2 className="text-2xl font-semibold">No Posts Yet</h2>
                  </div>
                  <div 
                    onClick={() => navigate('/app')}
                    className="flex items-center gap-2 text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000 cursor-pointer hover:text-foreground transition-colors"
                  >
                    <p>Write your first post to get started</p>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              )}
            </TabsContent>
              
            <TabsContent value="saved-posts" className="mt-6">
                {isSavedPostsLoading ? (
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
                ) : savedPostsError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-red-500 mb-4">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <h2 className="text-xl font-semibold">Error Loading Saved Posts</h2>
                    </div>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      {savedPostsError}
                    </p>
                    <Button onClick={handleFetchSavedPosts} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : savedPosts.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {savedPosts.length} saved post{savedPosts.length !== 1 ? 's' : ''} found
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Content loaded from IPFS via CID
                        </p>
                      </div>
                      <Button onClick={handleFetchSavedPosts} variant="outline" size="sm">
                        Refresh
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                      {savedPosts.map((savedPost, index) => (
                        <SavedPostCard 
                          key={savedPost.cid || index} 
                          savedPost={savedPost}
                          onDelete={handleDeleteSavedPost}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-2 animate-in fade-in-50 zoom-in-50 duration-700">
                      <Bookmark className="h-8 w-8 animate-[float_3s_ease-in-out_infinite]" />
                      <h2 className="text-2xl font-semibold">No Saved Posts</h2>
                    </div>
                    <p className="text-muted-foreground mb-6 max-w-md animate-in fade-in-50 slide-in-from-bottom-2 duration-1000">
                      Your saved posts will appear here when you have any
                    </p>
                    <Button onClick={handleFetchSavedPosts} variant="outline">
                      Refresh
                    </Button>
                  </div>
                )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

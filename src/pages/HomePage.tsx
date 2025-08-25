import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { PostForm } from "@/components/PostForm";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePosts } from "@/hooks/usePosts";

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { allPosts, isAllPostLoading, refetchPosts } = usePosts();

  // Filter posts that haven't expired yet
  const activePosts = allPosts.filter(post => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds
    return !post.archived && currentTimestamp < parseInt(post.endTime);
  });

  // Filter posts based on search term
  const filteredPosts = activePosts.filter(post => 
    post.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort posts based on expiration time
  const sortedAndFilteredPosts = filteredPosts.sort((a, b) => {
    const timeA = parseInt(a.endTime);
    const timeB = parseInt(b.endTime);
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-2 lg:px-8 md:py-6 max-w-7xl">
        <PostForm onPostAdded={refetchPosts} />

        <h2 className="text-xl sm:text-2xl font-bold mb-4">Active Posts</h2>

        <div className="relative mb-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
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

        {isAllPostLoading ? (
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
        ) : searchTerm ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">No active posts match your search</p>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">No active posts found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;

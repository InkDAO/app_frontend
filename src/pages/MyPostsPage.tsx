import { useState } from "react";
import Navbar from "@/components/Navbar";
import { PostCard } from "@/components/PostCard";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Wallet, MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePosts } from "@/hooks/usePosts";

export const MyPostsPage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { allPosts, isAllPostLoading } = usePosts();

  const myPosts = allPosts.filter((post) => {
    return post.owner.toLowerCase() === address?.toLowerCase();
  })

  // Filter posts based on search term
  const filteredPosts = myPosts.filter(post => 
    post.postTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.postBody.toLowerCase().includes(searchTerm.toLowerCase())
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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Posts</h1>
          <p className="text-muted-foreground mt-2">View and manage all your posts in one place</p>
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
        ) : isAllPostLoading ? (
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
          <div>
            <div className="relative mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search posts..."
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
            {sortedAndFilteredPosts.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))}
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
      </main>
    </div>
  );
};
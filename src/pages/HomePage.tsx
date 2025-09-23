import { useState, useEffect } from "react";
import { SavedPostCard } from "@/components/SavedPostCard";
import { EmptyState } from "@/components/EmptyState";
import { useSearch } from "@/context/SearchContext";
import { useAssets } from "@/hooks/useAssets";
import { fetchFileContentByCid } from "@/services/dXService";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const { searchTerm } = useSearch();
  const { allAssets, isAllAssetLoading } = useAssets();
  const navigate = useNavigate();
  const [assetsWithContent, setAssetsWithContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch content for assets
  const fetchAssetsContent = async (assets: any[]) => {
    setIsLoading(true);
    try {
      const assetsWithContent = await Promise.allSettled(
        assets.map(async (asset) => {
          try {
            console.log('fetching content for asset', asset);
            const content = await fetchFileContentByCid(asset.assetCid);
            return {
              ...asset,
              content,
              contentError: null
            };
          } catch (error) {
            console.error(`Failed to fetch content for asset ${asset.assetCid}:`, error);
            return {
              ...asset,
              content: null,
              contentError: error instanceof Error ? error.message : 'Failed to fetch content'
            };
          }
        })
      );

      const successfulAssets = assetsWithContent
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`Failed to process asset ${index}:`, result.reason);
            return null;
          }
        })
        .filter(Boolean);

      setAssetsWithContent(successfulAssets);
    } catch (error) {
      console.error('Error fetching assets content:', error);
      setError('Failed to load asset content');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the posts to display based on title search only
  const getPostsToDisplay = () => {
    if (!searchTerm.trim()) return assetsWithContent;
    
    return assetsWithContent.filter(asset => 
      asset.assetTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPosts = getPostsToDisplay();

  // Update assets with content when allAssets changes
  useEffect(() => {
    if (allAssets.length > 0) {
      fetchAssetsContent(allAssets);
    }
  }, [allAssets]);

  return (
    <div className="px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">All Posts</h1>
        <p className="text-muted-foreground">Discover content from the community</p>
      </div>
      <div className="w-full">
        {(isAllAssetLoading || isLoading) ? (
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-red-500 mb-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Error Loading Posts</h2>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              {error}
            </p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {filteredPosts.map((asset, index) => (
                <SavedPostCard 
                  key={asset.assetCid || index} 
                  savedPost={{
                    cid: asset.assetCid,
                    name: asset.assetTitle,
                    content: asset.content,
                    created_at: new Date().toISOString(),
                    keyvalues: {},
                    contentError: asset.contentError
                  }}
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

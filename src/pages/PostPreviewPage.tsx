import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, User, Copy, FileImage } from "lucide-react";
import EditorPreview from "@/components/EditorPreview";
import { fetchFileContentByCid, useAssetCidByAddress, useAssetData } from "@/services/dXService";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import '../styles/editor.css';

export const PostPreviewPage = () => {
  const { assetAddress } = useParams<{ assetAddress: string }>();
  const { cid: assetCid, isLoading: isCidLoading, isError: isCidError } = useAssetCidByAddress(assetAddress || '');
  const { assetData, isLoading: isAssetDataLoading, isError: isAssetDataError } = useAssetData(assetCid || '');
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string>("");
  const [postImage, setPostImage] = useState<string | null>(null);

  // Update post title when asset data is loaded
  useEffect(() => {
    if (assetData && assetData.assetTitle) {
      setPostTitle(assetData.assetTitle);
    }
  }, [assetData]);

  // Fetch content when asset CID is available
  useEffect(() => {
    const fetchContent = async () => {
      if (!assetCid) {
        if (isCidError) {
          setContentError("Failed to load asset CID");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setContentError(null);
        
        console.log('Fetching content for CID:', assetCid);
        const contentData = await fetchFileContentByCid(assetCid);
        
        if (contentData) {
          try {
            // Parse the JSON response that contains title and content (same as editor)
            const parsedResponse = typeof contentData === 'string' ? JSON.parse(contentData) : contentData;
            
            if (parsedResponse.content) {
              // Set the title
              if (parsedResponse.title) {
                setPostTitle(parsedResponse.title);
              }
              
              // Set preview data for EditorPreview component
              setPreviewData(parsedResponse.content);
              
              // Extract image from EditorJS content for header display
              if (parsedResponse.content.blocks) {
                const imageBlock = parsedResponse.content.blocks.find((block: any) => 
                  block.type === 'image' && block.data && (block.data.file?.url || block.data.url)
                );
                if (imageBlock) {
                  setPostImage(imageBlock.data.file?.url || imageBlock.data.url);
                }
              }
            } else {
              // Fallback to the original content if structure is different
              setPreviewData(contentData);
              setPostTitle("Untitled");
            }
          } catch (error) {
            // If parsing fails, use the content as-is
            setPreviewData(contentData);
            setPostTitle("Untitled");
          }
        } else {
          setContentError("No content found for this CID");
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setContentError(error instanceof Error ? error.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [assetCid, isCidError]);

  const handleCopyCid = async () => {
    if (assetCid) {
      try {
        await navigator.clipboard.writeText(assetCid);
        toast.success("CID copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy CID");
      }
    }
  };

  if (isLoading || isCidLoading || isAssetDataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading content...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (contentError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <FileImage className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Content Not Found</h2>
                <p className="text-muted-foreground mb-6">{contentError}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{postTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Published recently</span>
              </div>
              <div className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                <button 
                  onClick={handleCopyCid}
                  className="hover:text-foreground transition-colors"
                >
                  Copy CID
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">
                  {assetAddress?.slice(0, 6)}...{assetAddress?.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="tab-content">
          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
              </div>
            </div>
          ) : previewData ? (
            <EditorPreview 
              data={previewData}
              className="min-h-[400px]"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileImage className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No content available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

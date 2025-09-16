import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, User, ExternalLink, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { deleteFileById } from "@/services/dXService";
import EditorJSRenderer from "@/components/EditorJSRenderer";

interface SavedPostCardProps {
  savedPost: {
    id?: string;
    name?: string;
    cid?: string;
    size?: number;
    created_at?: string;
    keyvalues?: Record<string, string>;
    content?: any;
    contentError?: string | null;
  };
  onDelete?: (cid: string) => void;
}

export const SavedPostCard = ({ savedPost, onDelete }: SavedPostCardProps) => {
  const { name, cid, size, created_at, keyvalues, content, contentError } = savedPost;
  const [isDeleting, setIsDeleting] = useState(false);
  const { address } = useAccount();
  const { toast } = useToast();

  // Parse content if it exists
  let parsedContent = null;
  let postTitle = name || 'Untitled Post';
  let postBody = null;

  if (content && !contentError) {
    try {
      // The content might be a JSON string or already parsed
      const contentData = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Handle nested structure where actual content is under content.content
      if (contentData.title) {
        postTitle = contentData.title;
      }
      
      // Check for EditorJS content in different possible locations
      let editorContent = null;
      
      if (contentData.content && contentData.content.blocks) {
        // Content is nested under content.content
        editorContent = contentData.content;
      } else if (contentData.blocks) {
        // Content is directly available with blocks
        editorContent = contentData;
      } else if (contentData.content && typeof contentData.content === 'object') {
        // Try to parse content.content if it's a string
        try {
          const nestedContent = typeof contentData.content === 'string' 
            ? JSON.parse(contentData.content) 
            : contentData.content;
          if (nestedContent.blocks) {
            editorContent = nestedContent;
          }
        } catch (e) {
          console.warn('Failed to parse nested content:', e);
        }
      }
      
      if (editorContent && editorContent.blocks) {
        postBody = editorContent;
      } else {
        // Try to extract any text content from the structure
        let extractedText = '';
        const extractTextFromObject = (obj: any): string => {
          if (typeof obj === 'string' && obj.trim()) {
            return obj;
          }
          if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
              const result = extractTextFromObject(value);
              if (result) return result;
            }
          }
          return '';
        };
        
        extractedText = extractTextFromObject(contentData);
        if (extractedText) {
          postBody = extractedText;
        }
      }
      
    } catch (error) {
      console.error('Failed to parse content:', error);
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openInIPFS = () => {
    if (cid) {
      // Open the IPFS link in a new tab
      window.open(`https://gateway.pinata.cloud/ipfs/${cid}`, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!cid || !address) {
      toast({
        title: "Error",
        description: "Missing file CID or wallet address",
        variant: "destructive"
      });
      return;
    }

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      await deleteFileById(cid, address);
      
      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      // Call the onDelete callback to update the parent component
      if (onDelete) {
        onDelete(cid);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
              {postTitle}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(created_at)}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {formatSize(size)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {cid && (
              <Button
                variant="outline"
                size="sm"
                onClick={openInIPFS}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                IPFS
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || !cid}
              className="flex items-center gap-1 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:border-red-800 dark:hover:text-red-400"
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {contentError ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load content: {contentError}</span>
          </div>
        ) : postBody ? (
          <div className="space-y-4">
            {/* Handle different content formats */}
            {postBody && postBody.blocks && Array.isArray(postBody.blocks) ? (
              // EditorJS format - use comprehensive renderer
              <div>
                <div className="text-xs text-muted-foreground mb-2 opacity-50">
                  EditorJS Content ({postBody.blocks.length} block{postBody.blocks.length !== 1 ? 's' : ''})
                </div>
                <EditorJSRenderer data={postBody} />
              </div>
            ) : typeof postBody === 'string' ? (
              // Plain text content
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{postBody}</div>
              </div>
            ) : postBody && typeof postBody === 'object' ? (
              // Try to detect if it's EditorJS format in any form
              postBody.time && postBody.version ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 opacity-50">
                    Legacy EditorJS Format (v{postBody.version})
                  </div>
                  <EditorJSRenderer data={postBody} />
                </div>
              ) : (
                // Try to extract readable content from the object
                (() => {
                  // Attempt to extract text from various object structures
                  const extractText = (obj: any): string => {
                    if (typeof obj === 'string') return obj;
                    if (typeof obj !== 'object' || !obj) return '';
                    
                    let text = '';
                    if (obj.text) text += obj.text + '\n';
                    if (obj.content) text += extractText(obj.content) + '\n';
                    if (obj.blocks && Array.isArray(obj.blocks)) {
                      obj.blocks.forEach((block: any) => {
                        if (block.data && block.data.text) {
                          text += block.data.text + '\n';
                        }
                      });
                    }
                    return text.trim();
                  };

                  const extractedText = extractText(postBody);
                  
                  return extractedText ? (
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground mb-2 opacity-50">
                        Extracted Text Content
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{extractedText}</div>
                      </div>
                      <details className="cursor-pointer">
                        <summary className="text-xs text-primary hover:text-primary/80">
                          View raw data structure
                        </summary>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto bg-muted/20 p-2 rounded border max-h-40 overflow-y-auto mt-2">
                          {JSON.stringify(postBody, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    // Fallback to formatted JSON display
                    <div className="bg-muted/30 p-3 rounded border-l-4 border-yellow-500">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Unknown content format:</p>
                      <details className="cursor-pointer">
                        <summary className="text-xs text-primary hover:text-primary/80 mb-2">
                          Click to view raw JSON data
                        </summary>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto bg-background p-2 rounded border max-h-40 overflow-y-auto">
                          {JSON.stringify(postBody, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                })()
              )
            ) : (
              // Completely unknown format
              <div className="bg-muted/30 p-3 rounded border-l-4 border-red-500">
                <p className="text-xs text-muted-foreground">Unsupported content format</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-muted-foreground text-sm italic">
              No content preview available
            </div>
            {/* Debug information for troubleshooting */}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Debug Info (Click to expand)
              </summary>
              <div className="mt-2 p-2 bg-muted/20 rounded">
                <p><strong>Content Error:</strong> {contentError || 'None'}</p>
                <p><strong>Raw Content:</strong></p>
                <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto max-h-32 overflow-y-auto">
                  {JSON.stringify(content, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2 mb-3">
            {keyvalues && Object.entries(keyvalues).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {value}
              </Badge>
            ))}
          </div>
          
          {cid && (
            <div className="text-xs text-muted-foreground font-mono">
              CID: {cid}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

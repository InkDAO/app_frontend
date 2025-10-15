import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Edit, FileImage, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { deleteFileById } from "@/services/dXService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { name, cid, content, contentError } = savedPost;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Parse content and extract title, image, and preview
  let postTitle = (name && name.trim()) ? name.trim() : 'Untitled';
  let postImage: string | null = null;
  let postPreview: string | null = null;
  let editorContent = null;

  if (content && !contentError) {
    try {
      // The content might be a JSON string or already parsed
      const contentData = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Extract title
      if (contentData.title && contentData.title.trim()) {
        postTitle = contentData.title.trim();
      } else {
        postTitle = 'Untitled';
      }
      
      // Extract EditorJS content from various possible locations
      if (contentData.content && contentData.content.blocks) {
        editorContent = contentData.content;
      } else if (contentData.blocks) {
        editorContent = contentData;
      } else if (contentData.content && typeof contentData.content === 'object') {
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

      // Extract first image from EditorJS blocks
      if (editorContent && editorContent.blocks && Array.isArray(editorContent.blocks)) {
        const imageBlock = editorContent.blocks.find((block: any) => 
          block.type === 'image' && block.data && (block.data.file?.url || block.data.url)
        );
        if (imageBlock) {
          postImage = imageBlock.data.file?.url || imageBlock.data.url;
        }
      }

      // Extract preview text from EditorJS blocks
      if (editorContent && editorContent.blocks && Array.isArray(editorContent.blocks)) {
        let previewText = '';
        
        for (const block of editorContent.blocks) {
          if (previewText.length >= 200) break; // Stop when we have enough text
          
          let blockText = '';
          
          switch (block.type) {
            case 'paragraph':
              blockText = block.data?.text || '';
              break;
            case 'header':
              blockText = block.data?.text || '';
              break;
            case 'quote':
              blockText = block.data?.text || '';
              break;
            case 'list':
              if (block.data?.items && Array.isArray(block.data.items)) {
                blockText = block.data.items
                  .map((item: any) => {
                    if (typeof item === 'string') return item;
                    return item.content || item.text || item.value || '';
                  })
                  .join(', ');
              }
              break;
            case 'code':
              blockText = block.data?.code || '';
              break;
            default:
              // For other block types, try to extract any text
              if (block.data?.text) {
                blockText = block.data.text;
              }
              break;
          }
          
          // Clean HTML tags and add to preview
          if (blockText) {
            const cleanText = blockText
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .trim();
            
            if (cleanText) {
              if (previewText) previewText += ' ';
              previewText += cleanText;
            }
          }
        }
        
        // Truncate to approximately 200 characters with word boundary
        if (previewText.length > 200) {
          const truncated = previewText.substring(0, 200);
          const lastSpace = truncated.lastIndexOf(' ');
          postPreview = lastSpace > 160 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
        } else if (previewText.trim()) {
          postPreview = previewText.trim();
        }
      }
      
    } catch (error) {
      console.error('Failed to parse content:', error);
    }
  }

  const handleDeleteClick = () => {
    if (!cid || !address) {
      toast({
        title: "Error",
        description: "Missing file CID or wallet address",
        variant: "destructive"
      });
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!cid || !address) return;
    
    setShowDeleteDialog(false);
    setIsDeleting(true);

    try {
      await deleteFileById(cid, address, signMessageAsync);
      
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

  const handleViewMore = () => {
    if (!content || !cid) {
      toast({
        title: "Error",
        description: "No content or CID available to edit",
        variant: "destructive"
      });
      return;
    }

    try {
      // Parse and prepare content for editor
      const contentData = typeof content === 'string' ? JSON.parse(content) : content;
            
      if (editorContent) {
        // localStorage removed - no need to store content
      } else if (contentData.blocks) {
        // localStorage removed - no need to store content
      } else if (contentData.content) {
        // Try to use nested content
        const nestedContent = typeof contentData.content === 'string' 
          ? JSON.parse(contentData.content) 
          : contentData.content;
        // localStorage removed - no need to store content
      } else {
        console.warn('⚠️ No suitable content structure found for editor');
      }

      // Navigate to editor with CID in URL and refresh to ensure clean state
      window.location.href = `/app/editor/${cid}`;
      
      toast({
        title: "Opening Editor",
        description: "Loading content for editing...",
      });
    } catch (error) {
      console.error('Failed to prepare content for editor:', error);
      toast({
        title: "Error",
        description: "Failed to prepare content for editing",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-all duration-200 group overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-muted/30 overflow-hidden flex items-center justify-center">
        {postImage ? (
          <img 
            src={postImage} 
            alt={postTitle}
            className="group-hover:scale-105 transition-transform duration-300 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80">
            <FileImage className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Action Buttons Overlay */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewMore}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 shadow-lg backdrop-blur-sm border-0"
            title="Edit post"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDeleteClick}
            disabled={isDeleting || !cid}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-red-50 dark:bg-gray-900/90 dark:hover:bg-red-950/50 shadow-lg backdrop-blur-sm border-0 hover:text-red-600 dark:hover:text-red-400"
            title={isDeleting ? "Deleting..." : "Delete post"}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <div className="mb-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {postTitle}
          </h3>
        </div>

        {/* Content Preview */}
        {postPreview && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5">
              {postPreview}
            </p>
          </div>
        )}

        {/* Error state */}
        {contentError && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            Failed to load content
          </div>
        )}
      </CardContent>

      {/* Custom Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl">Delete Post?</AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-base pt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{postTitle}"</span>? 
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium mt-2 inline-block">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel 
              onClick={() => setShowDeleteDialog(false)}
              className="sm:flex-1"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 sm:flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

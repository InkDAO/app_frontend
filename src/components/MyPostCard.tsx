import { Card, CardContent } from "@/components/ui/card";
import { FileImage } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MyPostCardProps {
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
  assetAddress?: string;
}

export const MyPostCard = ({ savedPost, assetAddress }: MyPostCardProps) => {
  const { name, cid, content, contentError } = savedPost;
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
                    if (item.content) return item.content;
                    return item.text || item;
                  })
                  .join(' ');
              }
              break;
            case 'code':
              blockText = block.data?.code || '';
              break;
            default:
              // For other block types, try to extract text from common properties
              if (block.data?.text) {
                blockText = block.data.text;
              } else if (block.data?.content) {
                blockText = block.data.content;
              }
          }
          
          if (blockText.trim()) {
            previewText += (previewText ? ' ' : '') + blockText.trim();
          }
        }
        
        postPreview = previewText || null;
      }
    } catch (error) {
      console.warn('Failed to parse content for preview:', error);
    }
  }

  const handleCardClick = () => {
    if (!assetAddress) return;
    
    // Navigate to the post preview page to view the content
    navigate(`/app/post/${assetAddress}`);
  };

  return (
    <Card 
      className="w-full max-w-sm hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
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
        
        {/* Overlay gradient for better text readability on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
    </Card>
  );
};

import React from "react";
// edjsHTML transforms editor js blocks to html
import edjsHTML from "editorjs-html";
// this function parses strings (html elements) to html
import parse from "html-react-parser";

type EditorData = {
  time?: number;
  blocks?: any[];
  version?: string;
};

const edjsParser = edjsHTML();

interface EditorTextParserProps {
  data: EditorData;
}

export default function EditorTextParser({ data }: EditorTextParserProps) {
  // Manually render image blocks to include stretched, withBorder, withBackground properties
  const renderBlock = (block: any) => {
    if (block.type === 'image') {
      const imageData = block.data;
      const url = imageData.file?.url || imageData.url;
      const caption = imageData.caption || '';
      const stretched = imageData.stretched || false;
      const withBorder = imageData.withBorder || false;
      const withBackground = imageData.withBackground || false;
      const customWidth = imageData.customWidth;
      const customHeight = imageData.customHeight;
      
      // Build class list
      const classList = [];
      if (stretched) classList.push('stretched');
      if (withBorder) classList.push('withBorder');
      if (withBackground) classList.push('withBackground');
      
      // Build style for custom dimensions
      // Only apply width to maintain aspect ratio across different screens
      const styles: React.CSSProperties = {};
      if (customWidth) {
        styles.width = `${customWidth}px`;
        styles.height = 'auto'; // Let height adjust automatically
      } else if (customHeight) {
        // If only height is specified, still apply it but this is less common
        styles.height = `${customHeight}px`;
        styles.width = 'auto';
      }
      
      // Build data attributes
      const dataAttrs: any = {};
      if (stretched) dataAttrs['data-stretched'] = 'true';
      if (withBorder) dataAttrs['data-border'] = 'true';
      if (withBackground) dataAttrs['data-background'] = 'true';
      
      return (
        <div key={block.id} className={classList.join(' ')}>
          <img 
            src={url} 
            alt={caption} 
            style={Object.keys(styles).length > 0 ? styles : undefined}
            {...dataAttrs}
          />
          {caption && (
            <div className="image-tool__caption" style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', marginTop: '8px' }}>
              {caption}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Render blocks
  const renderContent = () => {
    if (!data || !data.blocks) return null;

    return data.blocks.map((block, index) => {
      // Handle image blocks specially
      if (block.type === 'image') {
        return renderBlock(block);
      }
      
      // For other blocks, use the default edjsHTML parser
      const html = edjsParser.parse({ blocks: [block] });
      return <div key={index}>{parse(html.join(""))}</div>;
    });
  };

  return <div className="text-container">{renderContent()}</div>;
}


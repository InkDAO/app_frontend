import React from "react";

type EditorData = {
  time?: number;
  blocks?: any[];
  version?: string;
};

interface EditorTextParserProps {
  data: EditorData;
}

export default function EditorTextParser({ data }: EditorTextParserProps) {
  if (!data || !data.blocks) return null;

  // Helper function to render LaTeX using KaTeX
  const renderLatex = (latex: string, displayMode: boolean = false): string => {
    try {
      // @ts-ignore - katex is loaded from CDN
      if (typeof window !== 'undefined' && window.katex) {
        // @ts-ignore
        return window.katex.renderToString(latex, {
          displayMode: displayMode,
          throwOnError: false,
          output: 'html'
        });
      }
    } catch (err) {
      console.error('Error rendering LaTeX:', err);
    }
    return latex;
  };

  // Function to convert plain text URLs to anchor tags
  const linkifyText = (text: string): string => {
    if (!text) return text;
    
    // Regular expression to match URLs starting with https://, http://, or www.
    // This regex avoids matching URLs that are already inside href attributes
    const urlRegex = /(?<!href=["'])(?<!href=)\b((?:https?:\/\/|www\.)[^\s<>"]+)/gi;
    
    return text.replace(urlRegex, (url) => {
      // Don't linkify if already inside an anchor tag
      const beforeUrl = text.substring(0, text.indexOf(url));
      const openTags = (beforeUrl.match(/<a\b[^>]*>/gi) || []).length;
      const closeTags = (beforeUrl.match(/<\/a>/gi) || []).length;
      
      // If we're inside an anchor tag, don't linkify
      if (openTags > closeTags) {
        return url;
      }
      
      // Add protocol if missing (for www. links)
      const href = url.startsWith('www.') ? `https://${url}` : url;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  };

  const renderBlock = (block: any, index: number) => {
    const key = block.id || index;

    switch (block.type) {
      case 'header':
        const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
        let headerText = block.data.text || '';
        // Convert newline characters to <br /> tags
        headerText = headerText.replace(/\n/g, '<br />');
        const linkedHeaderText = linkifyText(headerText);
        return <HeaderTag key={key} dangerouslySetInnerHTML={{ __html: linkedHeaderText }} />;

      case 'paragraph':
        // Convert newline characters to <br /> tags for proper line break display
        let paragraphText = block.data.text || '';
        // Replace \n with <br /> tags
        paragraphText = paragraphText.replace(/\n/g, '<br />');
        const linkedText = linkifyText(paragraphText);
        return <p key={key} dangerouslySetInnerHTML={{ __html: linkedText }} />;

      case 'list':
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
        return (
          <ListTag key={key}>
            {block.data.items.map((item: any, i: number) => {
              let content = typeof item === 'string' ? item : (item.content || item.text || '');
              // Convert newline characters to <br /> tags for proper line break display in lists
              content = content.replace(/\n/g, '<br />');
              const linkedContent = linkifyText(content);
              return <li key={i} dangerouslySetInnerHTML={{ __html: linkedContent }} />;
            })}
          </ListTag>
        );

      case 'checklist':
        return (
          <div key={key} className="cdx-checklist">
            {block.data.items.map((item: any, i: number) => {
              let checklistText = item.text || '';
              // Convert newline characters to <br /> tags
              checklistText = checklistText.replace(/\n/g, '<br />');
              const linkedChecklistText = linkifyText(checklistText);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', margin: '0.5em 0' }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    readOnly
                    style={{ marginRight: '0.5em', marginTop: '0.3em' }}
                  />
                  <span dangerouslySetInnerHTML={{ __html: linkedChecklistText }} />
                </div>
              );
            })}
          </div>
        );

      case 'quote':
        let quoteText = block.data.text || '';
        let quoteCaption = block.data.caption || '';
        // Convert newline characters to <br /> tags
        quoteText = quoteText.replace(/\n/g, '<br />');
        quoteCaption = quoteCaption.replace(/\n/g, '<br />');
        const linkedQuoteText = linkifyText(quoteText);
        const linkedQuoteCaption = quoteCaption ? linkifyText(quoteCaption) : '';
        return (
          <blockquote key={key}>
            <p dangerouslySetInnerHTML={{ __html: linkedQuoteText }} />
            {block.data.caption && (
              <cite dangerouslySetInnerHTML={{ __html: linkedQuoteCaption }} />
            )}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={key}>
            <code>{block.data.code}</code>
          </pre>
        );

      case 'delimiter':
        return <hr key={key} />;

      case 'raw':
        return <div key={key} dangerouslySetInnerHTML={{ __html: block.data.html }} style={{ maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word' }} />;

      case 'table':
        return (
          <table key={key}>
            <tbody>
              {block.data.content?.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell: string, cellIndex: number) => {
                    let cellContent = cell || '';
                    // Convert newline characters to <br /> tags
                    cellContent = cellContent.replace(/\n/g, '<br />');
                    const linkedCell = linkifyText(cellContent);
                    return <td key={cellIndex} dangerouslySetInnerHTML={{ __html: linkedCell }} />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'warning':
        let warningTitle = block.data.title || '';
        let warningMessage = block.data.message || '';
        // Convert newline characters to <br /> tags
        warningTitle = warningTitle.replace(/\n/g, '<br />');
        warningMessage = warningMessage.replace(/\n/g, '<br />');
        const linkedWarningTitle = linkifyText(warningTitle);
        const linkedWarningMessage = linkifyText(warningMessage);
        return (
          <div key={key} className="cdx-warning">
            <div dangerouslySetInnerHTML={{ __html: linkedWarningTitle }} style={{ fontWeight: 'bold' }} />
            <div dangerouslySetInnerHTML={{ __html: linkedWarningMessage }} />
          </div>
        );

      case 'embed':
        return (
          <div key={key} style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <iframe
              src={block.data.embed}
              width={block.data.width || '100%'}
              height={block.data.height || 400}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ maxWidth: '100%' }}
            />
            {block.data.caption && (
              <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', marginTop: '8px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {block.data.caption}
              </div>
            )}
          </div>
        );

      case 'image':
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
        const styles: React.CSSProperties = {};
        if (customWidth) {
          styles.width = `${customWidth}px`;
          styles.height = 'auto';
          styles.maxWidth = '100%'; // Ensure it doesn't overflow container
        } else if (customHeight) {
          styles.height = `${customHeight}px`;
          styles.width = 'auto';
          styles.maxWidth = '100%'; // Ensure it doesn't overflow container
        }

        // Build data attributes
        const dataAttrs: any = {};
        if (stretched) dataAttrs['data-stretched'] = 'true';
        if (withBorder) dataAttrs['data-border'] = 'true';
        if (withBackground) dataAttrs['data-background'] = 'true';

        return (
          <div key={key} className={classList.join(' ')}>
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

      case 'linkTool':
      case 'link':
        return (
          <div key={key} style={{ border: '1px solid #e0e0e0', padding: '1em', margin: '1em 0', borderRadius: '4px', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <a href={block.data.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5em', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{block.data.meta?.title || block.data.link}</div>
              {block.data.meta?.description && (
                <div style={{ fontSize: '0.9em', color: '#666', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{block.data.meta.description}</div>
              )}
            </a>
          </div>
        );

      case 'simpleImage':
        return (
          <div key={key} style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <img src={block.data.url} alt={block.data.caption || ''} style={{ maxWidth: '100%', height: 'auto' }} />
            {block.data.caption && (
              <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', marginTop: '8px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {block.data.caption}
              </div>
            )}
          </div>
        );

      case 'Math':
        // Handle LaTeX rendering
        const latexText = block.data.text || block.data.latex || block.data.math || '';
        let renderedLatex = block.data.html || '';
        
        // If we have LaTeX text but no HTML, try to render it
        if (latexText && !renderedLatex) {
          renderedLatex = renderLatex(latexText, true);
        }
        
        // If still no content, don't render anything
        if (!renderedLatex && !latexText) {
          return null;
        }
        
        return (
          <div key={key} className="latex-block" dangerouslySetInnerHTML={{ __html: renderedLatex }} />
        );

      default:
        // For unknown block types, try to render as paragraph if there's text
        if (block.data?.text) {
          return <p key={key} dangerouslySetInnerHTML={{ __html: block.data.text }} />;
        }
        console.warn(`Unknown block type: ${block.type}`, block);
        return null;
    }
  };

  return (
    <div className="text-container">
      {data.blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}


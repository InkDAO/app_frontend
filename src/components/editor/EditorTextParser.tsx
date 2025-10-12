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

  const renderBlock = (block: any, index: number) => {
    const key = block.id || index;

    switch (block.type) {
      case 'header':
        const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
        return <HeaderTag key={key} dangerouslySetInnerHTML={{ __html: block.data.text }} />;

      case 'paragraph':
        return <p key={key} dangerouslySetInnerHTML={{ __html: block.data.text }} />;

      case 'list':
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
        return (
          <ListTag key={key}>
            {block.data.items.map((item: any, i: number) => {
              const content = typeof item === 'string' ? item : (item.content || item.text || '');
              return <li key={i} dangerouslySetInnerHTML={{ __html: content }} />;
            })}
          </ListTag>
        );

      case 'checklist':
        return (
          <div key={key} className="cdx-checklist">
            {block.data.items.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', margin: '0.5em 0' }}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  style={{ marginRight: '0.5em', marginTop: '0.3em' }}
                />
                <span dangerouslySetInnerHTML={{ __html: item.text }} />
              </div>
            ))}
          </div>
        );

      case 'quote':
        return (
          <blockquote key={key}>
            <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
            {block.data.caption && (
              <cite dangerouslySetInnerHTML={{ __html: block.data.caption }} />
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
        return <div key={key} dangerouslySetInnerHTML={{ __html: block.data.html }} />;

      case 'table':
        return (
          <table key={key}>
            <tbody>
              {block.data.content?.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell: string, cellIndex: number) => (
                    <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'warning':
        return (
          <div key={key} className="cdx-warning">
            <div dangerouslySetInnerHTML={{ __html: block.data.title }} style={{ fontWeight: 'bold' }} />
            <div dangerouslySetInnerHTML={{ __html: block.data.message }} />
          </div>
        );

      case 'embed':
        return (
          <div key={key}>
            <iframe
              src={block.data.embed}
              width={block.data.width || '100%'}
              height={block.data.height || 400}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {block.data.caption && (
              <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', marginTop: '8px' }}>
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
        } else if (customHeight) {
          styles.height = `${customHeight}px`;
          styles.width = 'auto';
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
          <div key={key} style={{ border: '1px solid #e0e0e0', padding: '1em', margin: '1em 0', borderRadius: '4px' }}>
            <a href={block.data.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5em' }}>{block.data.meta?.title || block.data.link}</div>
              {block.data.meta?.description && (
                <div style={{ fontSize: '0.9em', color: '#666' }}>{block.data.meta.description}</div>
              )}
            </a>
          </div>
        );

      case 'simpleImage':
        return (
          <div key={key}>
            <img src={block.data.url} alt={block.data.caption || ''} style={{ maxWidth: '100%', height: 'auto' }} />
            {block.data.caption && (
              <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', marginTop: '8px' }}>
                {block.data.caption}
              </div>
            )}
          </div>
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


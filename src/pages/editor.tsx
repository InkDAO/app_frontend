import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Navbar from "@/components/Navbar";
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import Table from '@editorjs/table';
import Image from '@editorjs/image';
import Link from '@editorjs/link';
import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';
import Delimiter from '@editorjs/delimiter';
import '../styles/editor.css';

const EditorPage = () => {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [documentTitle, setDocumentTitle] = useState('');

  useEffect(() => {
    if (!holderRef.current) return;

    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder: "Write '/' for commands...",
      autofocus: true,
      tools: {
        header: {
          class: Header,
          config: {
            placeholder: 'Heading...',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 1
          },
          shortcut: 'CMD+SHIFT+H'
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
          config: {
            placeholder: "Write '/' for commands..."
          }
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          },
          shortcut: 'CMD+SHIFT+L'
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote\'s author'
          },
          shortcut: 'CMD+SHIFT+O'
        },
        code: {
          class: Code,
          config: {
            placeholder: 'Enter your code...'
          },
          shortcut: 'CMD+SHIFT+C'
        },
        inlineCode: {
          class: InlineCode,
          shortcut: 'CMD+SHIFT+M'
        },
        table: {
          class: Table as any,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3
          }
        },
        image: {
          class: Image,
          config: {
            uploader: {
              uploadByFile: (file: File) => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    resolve({
                      success: 1,
                      file: {
                        url: reader.result as string
                      }
                    });
                  };
                  reader.readAsDataURL(file);
                });
              },
              uploadByUrl: (url: string) => {
                return Promise.resolve({
                  success: 1,
                  file: { url }
                });
              }
            },
            captionPlaceholder: 'Image caption'
          }
        },
        linkTool: {
          class: Link,
          config: {
            endpoint: 'https://api.allorigins.win/get?url='
          }
        },
        marker: {
          class: Marker,
          shortcut: 'CMD+SHIFT+M'
        },
        underline: {
          class: Underline,
          shortcut: 'CMD+U'
        },
        delimiter: {
          class: Delimiter
        }
      },
      onChange: () => {
        console.log('Content changed');
      },
      onReady: () => {
        console.log('Editor.js is ready to work!');
        // Delay initialization to ensure DOM is ready
        setTimeout(() => {
          initializeImageResizing();
        }, 500);
      }
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
      }
    };
  }, []);

  const initializeImageResizing = () => {
    console.log('Initializing image resizing...');
    
    // Function to scan for all images and add resize handles
    const scanAndAddHandles = () => {
      if (!holderRef.current) return;
      
      const imageSelectors = [
        '.ce-image img',
        '.image-tool img', 
        '[data-tool="image"] img',
        '.ce-block img',
        'img'
      ];
      
      let foundImages = 0;
      const processedImages = new Set();
      
      imageSelectors.forEach(selector => {
        const images = holderRef.current!.querySelectorAll(selector);
        images.forEach(img => {
          // Use a unique identifier to avoid processing the same image twice
          const imgSrc = (img as HTMLImageElement).src || (img as HTMLImageElement).getAttribute('data-src') || img.outerHTML;
          const imgId = `${imgSrc}_${(img as HTMLImageElement).offsetWidth}_${(img as HTMLImageElement).offsetHeight}`;
          
          if (!processedImages.has(imgId) && !img.closest('.image-resize-wrapper')) {
            processedImages.add(imgId);
            addResizeHandles(img);
            foundImages++;
          }
        });
      });
      
      console.log(`Scan found ${foundImages} new images to add handles to`);
      return foundImages;
    };
    
    // Observer to watch for new blocks (images, quotes, code blocks)
    const observer = new MutationObserver((mutations) => {
      let hasImageChanges = false;
      let hasQuoteChanges = false;
      let hasCodeChanges = false;
      
      mutations.forEach((mutation) => {
        // Check for added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check for images
            if (element.querySelector('img') || element.tagName === 'IMG') {
              hasImageChanges = true;
            }
            
            // Check for quotes
            if (element.querySelector('.cdx-quote') || element.classList.contains('cdx-quote') ||
                element.querySelector('[data-tool="quote"]') || element.getAttribute('data-tool') === 'quote') {
              hasQuoteChanges = true;
            }
            
            // Check for code blocks
            if (element.querySelector('.ce-code') || element.classList.contains('ce-code') ||
                element.querySelector('[data-tool="code"]') || element.getAttribute('data-tool') === 'code') {
              hasCodeChanges = true;
            }
          }
        });
        
        // Check for attribute changes
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          
          if ((mutation.attributeName === 'src' || mutation.attributeName === 'class') &&
              (target.tagName === 'IMG' || target.querySelector('img'))) {
            hasImageChanges = true;
          }
        }
      });
      
      if (hasImageChanges) {
        setTimeout(() => scanAndAddHandles(), 200);
      }
      
      if (hasQuoteChanges) {
        setTimeout(() => ensureQuoteCaptions(), 50); // Much faster for quotes
      }
      
      if (hasCodeChanges) {
        setTimeout(() => autoResizeCodeBlocks(), 100);
      }
    });

    // Start observing
    if (holderRef.current) {
      observer.observe(holderRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'class', 'style']
      });

      // Initial scan with retries
      const initialScanWithRetry = (attempts = 0) => {
        const foundImages = scanAndAddHandles();
        
        // Retry up to 5 times with increasing delays
        if (attempts < 5) {
          setTimeout(() => initialScanWithRetry(attempts + 1), 500 * (attempts + 1));
        }
      };
      
      initialScanWithRetry();
      
      // More frequent periodic scan to catch any missed elements
      const periodicScan = setInterval(() => {
        scanAndAddHandles();
        ensureQuoteCaptions(); // Ensure quote captions are visible
        autoResizeCodeBlocks(); // Handle code block auto-resize
      }, 1000); // Reduced from 3000ms to 1000ms
      
      // Clean up periodic scan after 30 seconds
      setTimeout(() => {
        clearInterval(periodicScan);
      }, 30000);
      
      // Initial quote caption setup with multiple attempts
      setTimeout(() => ensureQuoteCaptions(), 100);
      setTimeout(() => ensureQuoteCaptions(), 500);
      setTimeout(() => ensureQuoteCaptions(), 1000);
      setTimeout(() => ensureQuoteCaptions(), 2000);
      
      // Initial code block auto-resize setup
      setTimeout(() => autoResizeCodeBlocks(), 1000);
    }

    return () => observer.disconnect();
  };

  const addResizeHandles = (img: Element) => {
    const imageElement = img as HTMLImageElement;
    
    // Create a wrapper div specifically for the image and handles
    if (imageElement.parentElement?.classList.contains('image-resize-wrapper')) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'image-resize-wrapper';
    wrapper.style.cssText = `
      position: relative !important;
      display: inline-block !important;
      margin: 0 auto !important;
    `;
    
    // Insert wrapper and move image into it
    imageElement.parentElement?.insertBefore(wrapper, imageElement);
    wrapper.appendChild(imageElement);
    
    console.log('Adding resize handles to image:', imageElement);

    // Create resize handles
    const leftHandle = document.createElement('div');
    leftHandle.className = 'resize-handle left';
     leftHandle.style.cssText = `
       position: absolute !important;
       top: 50% !important;
       left: 2px !important;
       transform: translateY(-50%) !important;
       width: 8px !important;
       height: 100px !important;
       background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%) !important;
       border: 2px solid #ffffff !important;
       border-radius: 4px !important;
       cursor: ew-resize !important;
       opacity: 0 !important;
       transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
       z-index: 10000 !important;
       pointer-events: auto !important;
       display: block !important;
       visibility: visible !important;
       box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5), 0 2px 8px rgba(0,0,0,0.3) !important;
     `;
    
    const rightHandle = document.createElement('div');
    rightHandle.className = 'resize-handle right';
    rightHandle.style.cssText = `
      position: absolute !important;
      top: 50% !important;
      right: 2px !important;
      transform: translateY(-50%) !important;
      width: 8px !important;
      height: 100px !important;
      background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%) !important;
      border: 2px solid #ffffff !important;
      border-radius: 4px !important;
      cursor: ew-resize !important;
      opacity: 0 !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      z-index: 10000 !important;
      pointer-events: auto !important;
      display: block !important;
      visibility: visible !important;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5), 0 2px 8px rgba(0,0,0,0.3) !important;
    `;

    wrapper.appendChild(leftHandle);
    wrapper.appendChild(rightHandle);

     // Show handles on hover - multiple event targets
     const showHandles = () => {
       leftHandle.style.opacity = '1';
       rightHandle.style.opacity = '1';
     };
     
     const hideHandles = () => {
       leftHandle.style.opacity = '0';
       rightHandle.style.opacity = '0';
     };

     // Add hover events to wrapper and image
     wrapper.addEventListener('mouseenter', showHandles);
     wrapper.addEventListener('mouseleave', hideHandles);
     imageElement.addEventListener('mouseenter', showHandles);
     imageElement.addEventListener('mouseleave', hideHandles);

    // Add resize functionality
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let originalAspectRatio = 0;

    const startResize = (e: MouseEvent, handle: HTMLElement) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = imageElement.offsetWidth;
      originalAspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      e.preventDefault();
    };

    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      let newWidth = startWidth + deltaX;
      
       // Constrain width between 100px and container width
       const container = wrapper.closest('.ce-block__content') || wrapper.closest('.ce-block');
       const maxWidth = container ? (container as HTMLElement).clientWidth - 40 : 800;
      newWidth = Math.max(100, Math.min(newWidth, maxWidth));

      // Maintain aspect ratio
      const newHeight = newWidth / originalAspectRatio;

      imageElement.style.width = `${newWidth}px`;
      imageElement.style.height = `${newHeight}px`;
      imageElement.style.maxWidth = 'none';
    };

    const stopResize = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };

    leftHandle.addEventListener('mousedown', (e) => startResize(e, leftHandle));
    rightHandle.addEventListener('mousedown', (e) => startResize(e, rightHandle));
  };

  const ensureQuoteCaptions = () => {
    if (!holderRef.current) return;

    // Target the exact quote caption elements
    const quoteCaptions = holderRef.current.querySelectorAll(
      '.cdx-input.cdx-quote__caption, .cdx-input[data-placeholder="Quote\'s author"]'
    );
    
    quoteCaptions.forEach(captionElement => {
      const htmlCaptionElement = captionElement as HTMLElement;
        
      // Ensure it has the proper styling and placeholder
      htmlCaptionElement.style.textAlign = 'right';
      htmlCaptionElement.style.fontStyle = 'italic';
      htmlCaptionElement.style.fontSize = '14px';
      htmlCaptionElement.style.color = '#666';
      htmlCaptionElement.style.border = 'none';
      htmlCaptionElement.style.outline = 'none';
      htmlCaptionElement.style.background = 'transparent';
      htmlCaptionElement.style.display = 'block';
      htmlCaptionElement.style.width = '100%';
      htmlCaptionElement.style.setProperty('margin', '8px 0 0 0', 'important');
      htmlCaptionElement.style.setProperty('padding', '0', 'important');
      htmlCaptionElement.style.setProperty('position', 'relative', 'important');
      htmlCaptionElement.style.setProperty('z-index', '1', 'important');
      
      // Add event listeners to maintain spacing on focus changes
      const enforceSpacing = () => {
        // Apply immediately without setTimeout for instant response
        htmlCaptionElement.style.setProperty('margin', '8px 0 0 0', 'important');
        htmlCaptionElement.style.setProperty('padding', '0', 'important');
        htmlCaptionElement.style.setProperty('position', 'relative', 'important');
        htmlCaptionElement.style.setProperty('z-index', '1', 'important');
      };
      
      // Remove existing listeners if they exist
      htmlCaptionElement.removeEventListener('focus', enforceSpacing);
      htmlCaptionElement.removeEventListener('blur', enforceSpacing);
      htmlCaptionElement.removeEventListener('input', enforceSpacing);
      
      // Add listeners to enforce spacing
      htmlCaptionElement.addEventListener('focus', enforceSpacing);
      htmlCaptionElement.addEventListener('blur', enforceSpacing);
      htmlCaptionElement.addEventListener('input', enforceSpacing);
      
      // Ensure placeholder is set
      htmlCaptionElement.setAttribute('data-placeholder', "Quote's author");
    });
  };

  const autoResizeCodeBlocks = () => {
    if (!holderRef.current) return;

    // Find all code block textareas with exact selectors
    const codeTextareas = holderRef.current.querySelectorAll(
      '.cdx-block.ce-code .ce-code__textarea.cdx-input, .ce-code__textarea.cdx-input'
    );

    codeTextareas.forEach(textarea => {
      const textareaElement = textarea as HTMLTextAreaElement;
      
      // Auto-resize function with aggressive styling override
      const autoResize = () => {
        // Reset height to get proper scrollHeight
        textareaElement.style.setProperty('height', 'auto', 'important');
        
        // Calculate new height
        const newHeight = Math.max(60, textareaElement.scrollHeight);
        
        // Set new height with important priority
        textareaElement.style.setProperty('height', `${newHeight}px`, 'important');
        
        // Also ensure overflow is hidden
        textareaElement.style.setProperty('overflow', 'hidden', 'important');
        textareaElement.style.setProperty('overflow-y', 'hidden', 'important');
      };

      // Initial resize
      autoResize();

      // Remove existing listeners to avoid duplicates
      textareaElement.removeEventListener('input', autoResize);
      textareaElement.removeEventListener('keyup', autoResize);
      textareaElement.removeEventListener('paste', autoResize);
      textareaElement.removeEventListener('change', autoResize);
      
      // Add event listeners for auto-resize
      textareaElement.addEventListener('input', autoResize);
      textareaElement.addEventListener('keyup', autoResize);
      textareaElement.addEventListener('change', autoResize);
      textareaElement.addEventListener('paste', () => {
        setTimeout(autoResize, 10); // Delay for paste content to be processed
      });

      // Force multiple resize attempts with delays to override EditorJS
      setTimeout(autoResize, 100);
      setTimeout(autoResize, 500);
      setTimeout(autoResize, 1000);
      
      // Monitor for changes in content
      const observer = new MutationObserver(() => {
        autoResize();
      });
      
      observer.observe(textareaElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      {/* Simple title input */}
      <div className="max-w-4xl mx-auto px-8 pt-12 pb-4">
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          className="text-5xl font-bold bg-transparent border-none outline-none w-full text-gray-900 dark:text-gray-100 placeholder-gray-400"
          placeholder="Untitled"
        />
      </div>

      {/* Main editor */}
      <div className="max-w-4xl mx-auto px-8">
        <div 
          ref={holderRef}
          className="min-h-[800px] focus:outline-none"
          style={{
            minHeight: '800px'
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
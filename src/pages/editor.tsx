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

const STORAGE_KEY = 'editorjs-content';
const TITLE_STORAGE_KEY = 'editorjs-title';
const IMAGE_SIZES_KEY = 'editorjs-image-sizes';

const EditorPage = () => {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load saved content from localStorage
  const loadSavedContent = () => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEY);
      const savedTitle = localStorage.getItem(TITLE_STORAGE_KEY);
      
      if (savedTitle) {
        setDocumentTitle(savedTitle);
      }
      
      return savedContent ? JSON.parse(savedContent) : null;
    } catch (error) {
      console.error('Error loading saved content:', error);
      return null;
    }
  };

  // Image size management functions
  const getImageSizes = () => {
    try {
      const sizes = localStorage.getItem(IMAGE_SIZES_KEY);
      return sizes ? JSON.parse(sizes) : {};
    } catch (error) {
      console.error('Error loading image sizes:', error);
      return {};
    }
  };

  const saveImageSize = (imageId: string, width: number, height: number) => {
    try {
      const sizes = getImageSizes();
      sizes[imageId] = { width, height };
      localStorage.setItem(IMAGE_SIZES_KEY, JSON.stringify(sizes));
      console.log(`Saved image size for ${imageId}:`, { width, height });
    } catch (error) {
      console.error('Error saving image size:', error);
    }
  };

  const getImageId = (img: HTMLImageElement) => {
    // Create a unique identifier using image src and some context
    const src = img.src || img.getAttribute('data-src') || '';
    const alt = img.alt || '';
    const parent = img.closest('.ce-block');
    const blockIndex = parent ? Array.from(parent.parentElement?.children || []).indexOf(parent) : 0;
    return `${src}_${alt}_${blockIndex}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  };

  const applySavedImageSizes = () => {
    if (!holderRef.current) return;
    
    const sizes = getImageSizes();
    const images = holderRef.current.querySelectorAll('img');
    
    images.forEach(img => {
      const imageElement = img as HTMLImageElement;
      const imageId = getImageId(imageElement);
      
      if (sizes[imageId]) {
        const { width, height } = sizes[imageId];
        imageElement.style.width = `${width}px`;
        imageElement.style.height = `${height}px`;
        imageElement.style.maxWidth = 'none';
        console.log(`Applied saved size to image ${imageId}:`, { width, height });
      }
    });
  };

  // Save content to localStorage
  const saveContent = async () => {
    if (!editorRef.current) return;
    
    try {
      const outputData = await editorRef.current.save();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(outputData));
      localStorage.setItem(TITLE_STORAGE_KEY, documentTitle);
      
      const now = new Date().toLocaleTimeString();
      setLastSaved(`Last saved at ${now}`);
      
      console.log('Content saved successfully', outputData);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  // Auto-save with debouncing
  const autoSave = () => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      saveContent();
    }, 2000);
    
    setAutoSaveTimeout(timeout);
  };

  useEffect(() => {
    if (!holderRef.current) return;

    // Load saved content
    const savedData = loadSavedContent();

    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder: "Write '/' for commands...",
      autofocus: true,
      data: savedData || undefined,
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
        console.log('Content changed - triggering auto-save');
        autoSave();
      },
      onReady: () => {
        console.log('Editor.js is ready to work!');
        // Delay initialization to ensure DOM is ready
        setTimeout(() => {
          initializeImageResizing();
          // Apply saved image sizes after initialization
          setTimeout(() => {
            applySavedImageSizes();
          }, 200);
        }, 500);
      }
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
      }
      // Clear auto-save timeout on cleanup
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, []);

  // Save title when it changes (with debouncing)
  useEffect(() => {
    if (documentTitle) {
      localStorage.setItem(TITLE_STORAGE_KEY, documentTitle);
    }
  }, [documentTitle]);

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
            
            // Apply saved size to this image
            const imageElement = img as HTMLImageElement;
            const imageId = getImageId(imageElement);
            const sizes = getImageSizes();
            if (sizes[imageId]) {
              const { width, height } = sizes[imageId];
              imageElement.style.width = `${width}px`;
              imageElement.style.height = `${height}px`;
              imageElement.style.maxWidth = 'none';
              console.log(`Applied saved size to new image ${imageId}:`, { width, height });
            }
            
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
        setTimeout(() => {
          scanAndAddHandles();
          // Also apply saved sizes to any new images
          applySavedImageSizes();
        }, 200);
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
        applySavedImageSizes(); // Apply saved sizes to all images
        
        // Retry up to 5 times with increasing delays
        if (attempts < 5) {
          setTimeout(() => initialScanWithRetry(attempts + 1), 500 * (attempts + 1));
        }
      };
      
      initialScanWithRetry();
      
      // More frequent periodic scan to catch any missed elements
      const periodicScan = setInterval(() => {
        scanAndAddHandles();
        applySavedImageSizes(); // Restore image sizes
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
      
      // Save the new image size when resize is complete
      const imageId = getImageId(imageElement);
      const currentWidth = parseInt(imageElement.style.width) || imageElement.offsetWidth;
      const currentHeight = parseInt(imageElement.style.height) || imageElement.offsetHeight;
      saveImageSize(imageId, currentWidth, currentHeight);
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
      
      {/* Title input and auto-save indicator */}
      <div className="max-w-4xl mx-auto px-8 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="text-5xl font-bold bg-transparent border-none outline-none flex-1 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder="Untitled"
          />
          {lastSaved && (
            <div className="ml-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {lastSaved}
              </span>
            </div>
          )}
        </div>
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
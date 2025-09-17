import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Navbar from "@/components/Navbar";
import EditorPreview from "@/components/EditorPreview";
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import Table from '@editorjs/table';
import Image from '@editorjs/image';
import CustomImageTool from '@/components/CustomImageTool';
import Link from '@editorjs/link';
import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';
import Delimiter from '@editorjs/delimiter';
import { Edit3, Eye } from 'lucide-react';
import { useAccount } from 'wagmi';
import { createGroupPost, updateFileById, signMessageWithMetaMask } from '@/services/dXService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  // Image resize state management
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    activeImage: HTMLImageElement | null;
    startX: number;
    startWidth: number;
    originalAspectRatio: number;
    animationFrame: number | null;
    lastResizeTime: number;
  }>({
    isResizing: false,
    activeImage: null,
    startX: 0,
    startWidth: 0,
    originalAspectRatio: 0,
    animationFrame: null,
    lastResizeTime: 0
  });
  
  const { address } = useAccount();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { ensureAuthenticated, isAuthenticated } = useAuth();

  // Get CID from URL parameters if present (for editing existing posts)
  const getCidFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('cid');
  };

  // Handle image resize events with useEffect
  useEffect(() => {
    if (!resizeState.isResizing || !resizeState.activeImage) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Throttle resize events to 60fps
      const now = performance.now();
      if (now - resizeState.lastResizeTime < 16) return; // ~60fps
      
      setResizeState(prev => ({ ...prev, lastResizeTime: now }));

      // Cancel previous animation frame
      if (resizeState.animationFrame) {
        cancelAnimationFrame(resizeState.animationFrame);
      }

      const animationFrame = requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeState.startX;
        let newWidth = resizeState.startWidth + deltaX;
        
        // Constrain width between 100px and container width
        const container = resizeState.activeImage?.closest('.ce-block__content') || 
                        resizeState.activeImage?.closest('.ce-block');
        const maxWidth = container ? (container as HTMLElement).clientWidth - 40 : 800;
        newWidth = Math.max(100, Math.min(newWidth, maxWidth));

        // Maintain aspect ratio
        const newHeight = newWidth / resizeState.originalAspectRatio;

        if (resizeState.activeImage) {
          // Apply all styles at once to prevent flickering
          resizeState.activeImage.style.cssText = `
            width: ${newWidth}px !important;
            height: ${newHeight}px !important;
            max-width: none !important;
            object-fit: contain !important;
            transition: none !important;
            will-change: width, height !important;
            transform: translateZ(0) !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
          `;
        }
      });

      setResizeState(prev => ({ ...prev, animationFrame }));
    };

    const handleMouseUp = () => {
      if (!resizeState.activeImage) return;

      // Cancel any pending animation frame
      if (resizeState.animationFrame) {
        cancelAnimationFrame(resizeState.animationFrame);
      }

      // Remove resizing class
      const wrapper = resizeState.activeImage.closest('.image-resize-wrapper');
      wrapper?.classList.remove('resizing');
      
      // Restore image styles
      resizeState.activeImage.style.transition = '';
      resizeState.activeImage.style.willChange = '';
      resizeState.activeImage.style.transform = '';
      
      // Restore body styles
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.style.pointerEvents = '';
      
      // Save the new image size when resize is complete
      const imageId = getImageId(resizeState.activeImage);
      const currentWidth = parseInt(resizeState.activeImage.style.width) || resizeState.activeImage.offsetWidth;
      const currentHeight = parseInt(resizeState.activeImage.style.height) || resizeState.activeImage.offsetHeight;
      saveImageSize(imageId, currentWidth, currentHeight);
      
      // Force a reflow to ensure the final size is applied
      resizeState.activeImage.offsetHeight;

      // Reset resize state
      setResizeState({
        isResizing: false,
        activeImage: null,
        startX: 0,
        startWidth: 0,
        originalAspectRatio: 0,
        animationFrame: null,
        lastResizeTime: 0
      });
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (resizeState.animationFrame) {
        cancelAnimationFrame(resizeState.animationFrame);
      }
    };
  }, [resizeState.isResizing, resizeState.activeImage, resizeState.startX, resizeState.startWidth, resizeState.originalAspectRatio, resizeState.lastResizeTime, resizeState.animationFrame]);

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
        // console.log(`Applied saved size to image ${imageId}:`, { width, height });
      }
    });
  };

  // Debounce function to prevent excessive calls
  let imageSizeApplicationTimeout: NodeJS.Timeout | null = null;
  let hasAppliedImageSizes = false;
  
  // Apply image sizes from EditorJS block data (for loaded saved content)
  const applyImageSizesFromBlockData = async () => {
    if (!editorRef.current || !holderRef.current) {
      return;
    }
    
    // Don't apply if we've already applied recently
    if (hasAppliedImageSizes) {
      return;
    }
    
    // Debounce to prevent excessive calls
    if (imageSizeApplicationTimeout) {
      clearTimeout(imageSizeApplicationTimeout);
    }
    
    imageSizeApplicationTimeout = setTimeout(async () => {
      try {
        console.log('🔍 Starting image size application from block data...');
        
        // Get images directly from DOM instead of calling save()
        const images = holderRef.current!.querySelectorAll('img');
      
        console.log('📊 Found', images.length, 'images in DOM');
      
      // Get block data from localStorage instead of calling save()
      const storedContent = localStorage.getItem(STORAGE_KEY);
      if (!storedContent) {
        console.log('⚠️ No stored content found');
        return;
      }
      
      let parsedContent;
      try {
        parsedContent = JSON.parse(storedContent);
        console.log('💾 localStorage content blocks:', parsedContent.blocks?.length || 0);
        console.log('🖼️ Image blocks in localStorage:', 
          parsedContent.blocks?.filter((b: any) => b.type === 'image').map((b: any, i: number) => ({
            index: i,
            url: b.data?.file?.url || b.data?.url,
            customWidth: b.data?.customWidth,
            customHeight: b.data?.customHeight,
            width: b.data?.width,
            height: b.data?.height
          }))
        );
      } catch (e) {
        console.warn('Failed to parse localStorage content:', e);
        return;
      }
      
      let imageIndex = 0;
      let sizesApplied = 0;
      
      // Iterate through blocks to find image blocks with custom dimensions
      parsedContent.blocks?.forEach((block: any, blockIndex: number) => {
        if (block.type === 'image' && block.data) {
          const imageElement = images[imageIndex] as HTMLImageElement;
          
          console.log(`🔍 Processing image block ${blockIndex}:`, {
            blockType: block.type,
            hasImageElement: !!imageElement,
            imageElementSrc: imageElement?.src,
            blockData: {
              url: block.data.file?.url || block.data.url,
              customWidth: block.data.customWidth,
              customHeight: block.data.customHeight,
              width: block.data.width,
              height: block.data.height,
              file: block.data.file
            }
          });
          
          if (imageElement) {
            // Extract custom dimensions from block data with fallbacks
            const customWidth = block.data.customWidth || block.data.width || block.data.file?.width;
            const customHeight = block.data.customHeight || block.data.height || block.data.file?.height;
            
            console.log(`🖼️ Image ${imageIndex} dimension analysis:`, {
              customWidth,
              customHeight,
              currentElementWidth: imageElement.offsetWidth,
              currentElementHeight: imageElement.offsetHeight,
              currentStyleWidth: imageElement.style.width,
              currentStyleHeight: imageElement.style.height
            });
            
            if (customWidth && customHeight) {
              // Force application with !important style properties
              imageElement.style.setProperty('width', `${customWidth}px`, 'important');
              imageElement.style.setProperty('height', `${customHeight}px`, 'important');
              imageElement.style.setProperty('max-width', 'none', 'important');
              imageElement.style.setProperty('object-fit', 'contain', 'important');
              
              // Also try setting attributes as backup
              imageElement.setAttribute('width', customWidth.toString());
              imageElement.setAttribute('height', customHeight.toString());
              
              // Force a reflow to ensure the changes take effect
              imageElement.offsetHeight;
              
              // Save to localStorage for consistency with resize handles
              const imageId = getImageId(imageElement);
              saveImageSize(imageId, customWidth, customHeight);
              
              sizesApplied++;
              
              console.log(`✅ Applied forced size to image ${imageIndex}:`, { 
                width: customWidth, 
                height: customHeight,
                imageId,
                newStyleWidth: imageElement.style.width,
                newStyleHeight: imageElement.style.height
              });
              
              // Trigger a reflow to ensure changes are applied
              imageElement.offsetHeight;
            } else {
              console.log(`⚠️ No custom dimensions found for image ${imageIndex}`);
            }
          } else {
            console.log(`⚠️ No image element found for block ${blockIndex}`);
          }
          
          imageIndex++;
        }
      });
      
        console.log(`🎯 Finished applying image sizes: ${sizesApplied}/${imageIndex} images processed`);
        
        // Mark as applied to prevent repeated calls
        hasAppliedImageSizes = true;
        
        // If no sizes were applied, try again with localStorage content
        if (sizesApplied === 0) {
          console.log('🔄 Retrying with localStorage content...');
          setTimeout(() => {
            applyImageSizesFromStoredContent();
          }, 500);
        }
        
      } catch (error) {
        console.error('❌ Error applying image sizes from block data:', error);
      }
    }, 200); // Debounce for 200ms
  };

  // Fallback function to apply sizes from localStorage content
  const applyImageSizesFromStoredContent = () => {
    try {
      const storedContent = localStorage.getItem(STORAGE_KEY);
      if (!storedContent || !holderRef.current) return;
      
      const parsedContent = JSON.parse(storedContent);
      const images = holderRef.current.querySelectorAll('img');
      
      console.log('🔄 Applying sizes from stored content fallback...');
      
      let imageIndex = 0;
      let sizesApplied = 0;
      
      parsedContent.blocks?.forEach((block: any, blockIndex: number) => {
        if (block.type === 'image' && block.data) {
          const imageElement = images[imageIndex] as HTMLImageElement;
          
          if (imageElement) {
            const customWidth = block.data.customWidth || block.data.width || block.data.file?.width;
            const customHeight = block.data.customHeight || block.data.height || block.data.file?.height;
            
            if (customWidth && customHeight) {
              imageElement.style.setProperty('width', `${customWidth}px`, 'important');
              imageElement.style.setProperty('height', `${customHeight}px`, 'important');
              imageElement.style.setProperty('max-width', 'none', 'important');
              imageElement.style.setProperty('object-fit', 'contain', 'important');
              
              const imageId = getImageId(imageElement);
              saveImageSize(imageId, customWidth, customHeight);
              
              sizesApplied++;
              
              console.log(`✅ Fallback applied size to image ${imageIndex}:`, { 
                width: customWidth, 
                height: customHeight
              });
            }
          }
          
          imageIndex++;
        }
      });
      
      console.log(`🎯 Fallback finished: ${sizesApplied}/${imageIndex} images processed`);
      
    } catch (error) {
      console.error('❌ Error in fallback image size application:', error);
    }
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

  // Check if content has meaningful changes
  const hasContentChanged = async () => {
    if (!editorRef.current) return false;
    
    try {
      const currentData = await editorRef.current.save();
      const savedData = loadSavedContent();
      
      // Check if title is different
      const savedTitle = localStorage.getItem(TITLE_STORAGE_KEY) || '';
      if (documentTitle !== savedTitle) return true;
      
      // Check if content is different (simple comparison)
      const currentBlocks = currentData?.blocks || [];
      const savedBlocks = savedData?.blocks || [];
      
      if (currentBlocks.length !== savedBlocks.length) return true;
      
      // Check if any blocks have non-empty content
      const hasNonEmptyContent = currentBlocks.some(block => {
        if (block.type === 'paragraph' && block.data?.text?.trim()) return true;
        if (block.type === 'header' && block.data?.text?.trim()) return true;
        if (block.type === 'list' && block.data?.items?.length > 0) return true;
        if (block.type === 'quote' && (block.data?.text?.trim() || block.data?.caption?.trim())) return true;
        if (block.type === 'code' && block.data?.code?.trim()) return true;
        return false;
      });
      
      return hasNonEmptyContent;
    } catch (error) {
      console.error('Error checking content changes:', error);
      return false;
    }
  };

  // Inject current image sizes into EditorJS blocks
  const injectImageSizes = async (outputData: any) => {
    if (!outputData?.blocks || !holderRef.current) {
      return outputData;
    }

    console.log('🖼️ Injecting image sizes into blocks...');
    console.log('📊 Original blocks before injection:', outputData.blocks?.map((b: any, i: number) => ({
      index: i,
      type: b.type,
      hasCustomWidth: !!b.data?.customWidth,
      hasCustomHeight: !!b.data?.customHeight,
      customWidth: b.data?.customWidth,
      customHeight: b.data?.customHeight
    })));
    
    // Create a copy of the output data
    const enhancedData = JSON.parse(JSON.stringify(outputData));
    
    // Find all image elements in the editor
    const imageElements = holderRef.current.querySelectorAll('img');
    console.log('🖼️ Found', imageElements.length, 'image elements in DOM');
    let imageIndex = 0;
    
    // Process each block
    enhancedData.blocks = enhancedData.blocks.map((block: any, blockIndex: number) => {
      if (block.type === 'image') {
        // Find the corresponding image element
        const imageElement = imageElements[imageIndex] as HTMLImageElement;
        
        if (imageElement) {
          // Get current dimensions from the DOM
          const computedStyle = window.getComputedStyle(imageElement);
          const currentWidth = parseInt(computedStyle.width);
          const currentHeight = parseInt(computedStyle.height);
          
          // Get stored sizes from localStorage as fallback
          const imageId = getImageId(imageElement);
          const storedSizes = getImageSizes();
          const storedSize = storedSizes[imageId];
          
          console.log(`🔍 Block ${blockIndex} dimension analysis:`, {
            currentDOM: { width: currentWidth, height: currentHeight },
            storedSize: storedSize,
            blockData: {
              customWidth: block.data.customWidth,
              customHeight: block.data.customHeight,
              width: block.data.width,
              height: block.data.height
            },
            imageId
          });
          
          // Prioritize stored dimensions over current DOM dimensions to preserve user's intended size
          const finalWidth = storedSize?.width || (currentWidth > 0 ? currentWidth : block.data.customWidth);
          const finalHeight = storedSize?.height || (currentHeight > 0 ? currentHeight : block.data.customHeight);
          
          if (finalWidth && finalHeight) {
            block.data.customWidth = finalWidth;
            block.data.customHeight = finalHeight;
            
            console.log(`📐 Block ${blockIndex}: Added size ${finalWidth}x${finalHeight} to image`, {
              url: block.data.file?.url,
              imageId
            });
          }
        }
        
        imageIndex++;
      }
      
      return block;
    });
    
    console.log('✅ Image size injection completed');
    console.log('📊 Enhanced blocks after injection:', enhancedData.blocks?.map((b: any, i: number) => ({
      index: i,
      type: b.type,
      hasCustomWidth: !!b.data?.customWidth,
      hasCustomHeight: !!b.data?.customHeight,
      customWidth: b.data?.customWidth,
      customHeight: b.data?.customHeight
    })));
    
    return enhancedData;
  };

  // Save content to API
  const saveToAPI = async () => {
    if (!editorRef.current || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet to save.",
        variant: "destructive"
      });
      return false;
    }

    // Ensure user is authenticated before saving
    const authenticated = await ensureAuthenticated();
    if (!authenticated) {
      toast({
        title: "Authentication Required",
        description: "Please authenticate with your wallet to save content.",
        variant: "destructive"
      });
      return false;
    }
    
    setIsSaving(true);
    try {
      const outputData = await editorRef.current.save();
      
      // Inject current image sizes into the blocks before saving
      const enhancedOutputData = await injectImageSizes(outputData);
      
      // Check if we're updating an existing post or creating a new one
      const cidFromUrl = getCidFromUrl();
      
      if (cidFromUrl) {
        // UPDATE EXISTING POST
        console.log('🔄 Updating existing post with CID:', cidFromUrl);
        console.log('   - Title:', documentTitle);
        console.log('   - Content structure:', Object.keys(enhancedOutputData || {}));
        
        await updateFileById(cidFromUrl, enhancedOutputData, documentTitle, address);
        
        toast({
          title: "Success", 
          description: "Content updated successfully! Reloading page...",
        });
        
        // Reload the page to get the latest saved content
        // Don't clear localStorage before reload - let the reloaded page load fresh content from server
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Small delay to show the success message
        
        return true;
        
      } else {
        // CREATE NEW POST
        console.log('✨ Creating new post');
        
        // Generate salt (current timestamp in seconds)
        const timestamp = Math.floor(Date.now() / 1000);
        const salt = timestamp.toString();
        
        console.log('=== SIGNING PROCESS START ===');
        console.log('1. Generated salt (timestamp):', salt);
        console.log('   - Salt type:', typeof salt);
        console.log('   - Salt value as number:', parseInt(salt));
        console.log('2. User address from wagmi:', address);
        console.log('3. About to sign salt with MetaMask...');
        
        // Sign the salt directly (API requirement)
        const signature = await signMessageWithMetaMask(salt);
        
        console.log('4. Received signature:', signature);
        console.log('5. API payload will be:', {
          salt,
          address,
          signature
        });
        console.log('=== SIGNING PROCESS END ===');
        
        // Post to API
        await createGroupPost(enhancedOutputData, documentTitle, address, signature, salt);
        
        // Handle successful save (this will clear localStorage and redirect)
        handleSuccessfulSave();
        
        return true;
      }
      
    } catch (error: any) {
      console.error('Error saving to API:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save content.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save action from dialog
  const handleSave = async () => {
    const success = await saveToAPI();
    // Success handling is already done in saveToAPI via handleSuccessfulSave
    if (pendingNavigation && success) {
      setPendingNavigation(null);
    }
  };

  // Clear all editor-related local storage
  const clearEditorStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TITLE_STORAGE_KEY);
    localStorage.removeItem(IMAGE_SIZES_KEY);
    console.log('✅ Editor storage cleared');
  };

  // Handle successful save - clear storage and redirect
  const handleSuccessfulSave = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    clearEditorStorage();
    
    toast({
      title: "Success", 
      description: "Content saved! Redirecting to My Posts...",
    });
    
    // Navigate to my posts page
    setTimeout(() => {
      navigate('/app/my-posts');
    }, 1000); // Small delay to show the success message
  };

  // Handle discard action from dialog
  const handleDiscard = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  // Toggle between edit and preview modes
  const togglePreview = async () => {
    if (isPreviewMode) {
      // Switch back to edit mode - useEffect will handle editor recreation
      setIsPreviewMode(false);
    } else {
      // Switch to preview mode - save current content first
      if (editorRef.current) {
        try {
          const outputData = await editorRef.current.save();
          setPreviewData(outputData);
          // Also save to localStorage as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(outputData));
          setIsPreviewMode(true);
        } catch (error) {
          console.error('Error saving content for preview:', error);
        }
      }
    }
  };

  // Force apply image dimensions - more aggressive approach
  const forceApplyImageDimensions = async () => {
    if (!editorRef.current || !holderRef.current) {
      console.log('⚠️ Editor or holder not ready for force image dimension application');
      return;
    }

    try {
      console.log('🔧 Force applying image dimensions...');
      
      // Get current editor data
      const outputData = await editorRef.current.save();
      const images = holderRef.current.querySelectorAll('img');
      
      console.log('🔧 Found', images.length, 'images for force application');
      
      let imageIndex = 0;
      let appliedCount = 0;
      
      // Process each image block
      outputData.blocks?.forEach((block: any, blockIndex: number) => {
        if (block.type === 'image' && block.data) {
          const imageElement = images[imageIndex] as HTMLImageElement;
          
          if (imageElement) {
            // Get custom dimensions from block data
            const customWidth = block.data.customWidth || block.data.width || block.data.file?.width;
            const customHeight = block.data.customHeight || block.data.height || block.data.file?.height;
            
            console.log(`🔧 Force applying to image ${imageIndex}:`, {
              customWidth,
              customHeight,
              currentWidth: imageElement.offsetWidth,
              currentHeight: imageElement.offsetHeight
            });
            
            if (customWidth && customHeight) {
              // Force apply with !important and multiple methods
              imageElement.style.setProperty('width', `${customWidth}px`, 'important');
              imageElement.style.setProperty('height', `${customHeight}px`, 'important');
              imageElement.style.setProperty('max-width', 'none', 'important');
              imageElement.style.setProperty('object-fit', 'contain', 'important');
              
              // Set attributes
              imageElement.setAttribute('width', customWidth.toString());
              imageElement.setAttribute('height', customHeight.toString());
              
              // Force reflow
              imageElement.offsetHeight;
              
              appliedCount++;
              console.log(`✅ Force applied dimensions to image ${imageIndex}:`, { customWidth, customHeight });
            }
          }
          
          imageIndex++;
        }
      });
      
      console.log(`🔧 Force application completed: ${appliedCount}/${images.length} images processed`);
    } catch (error) {
      console.error('❌ Error in force apply image dimensions:', error);
    }
  };

  // Load existing post content from IPFS when editing
  useEffect(() => {
    const loadExistingPostContent = async () => {
      const cidFromUrl = getCidFromUrl();
      if (!cidFromUrl) return;

      setIsLoadingContent(true);
      try {
        console.log('🔄 Loading existing post content from IPFS for CID:', cidFromUrl);
        
        // Import fetchFromIPFS here to avoid circular dependency
        const { fetchFromIPFS } = await import('@/services/pinataService');
        
        const result = await fetchFromIPFS(cidFromUrl);
        if (result.success && result.content) {
          try {
            // Parse the JSON response that contains title and content
            const parsedResponse = JSON.parse(result.content);
            if (parsedResponse.content) {
              // Debug: Log the loaded content to check for image size data
              console.log('🔍 Loaded content structure:', {
                hasBlocks: !!parsedResponse.content.blocks,
                blockCount: parsedResponse.content.blocks?.length || 0,
                imageBlocks: parsedResponse.content.blocks?.filter((b: any) => b.type === 'image').map((b: any, i: number) => ({
                  index: i,
                  url: b.data?.file?.url || b.data?.url,
                  customWidth: b.data?.customWidth,
                  customHeight: b.data?.customHeight,
                  width: b.data?.width,
                  height: b.data?.height,
                  fileWidth: b.data?.file?.width,
                  fileHeight: b.data?.file?.height
                })) || []
              });
              
              // Set the content as preview data to be loaded into editor
              setPreviewData(parsedResponse.content);
              // Also set the title
              if (parsedResponse.title) {
                setDocumentTitle(parsedResponse.title);
              }
              console.log('✅ Successfully loaded existing post content from IPFS');
              
              // Store the loaded content in localStorage as well for consistency
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedResponse.content));
              
              // Clear any old localStorage data after loading fresh content from server
              // This ensures we're working with the latest server content
              const urlParams = new URLSearchParams(window.location.search);
              const cidFromUrl = urlParams.get('cid');
              if (cidFromUrl) {
                // Clear old data to ensure fresh content is used
                localStorage.removeItem('editorjs-image-sizes');
                console.log('🧹 Cleared old localStorage data after loading fresh content from server');
              }
            } else {
              // Fallback to the original content if structure is different
              setPreviewData(result.content);
              console.log('✅ Loaded existing post content (fallback structure)');
            }
          } catch (error) {
            // If parsing fails, use the content as-is
            setPreviewData(result.content);
            console.log('✅ Loaded existing post content (raw format)');
          }
        } else {
          console.error('❌ Failed to load existing post content:', result.error);
        }
      } catch (error) {
        console.error('❌ Error loading existing post content from IPFS:', error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadExistingPostContent();
  }, []); // Run once on mount

  useEffect(() => {
    if (!holderRef.current || isPreviewMode || isLoadingContent) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Destroy existing editor if it exists
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }

      // Load saved content
      const savedData = loadSavedContent();
      
      // Use preview data if available, otherwise use saved data
      const initialData = previewData || savedData;

      const editor = new EditorJS({
      holder: holderRef.current,
      placeholder: "Write '/' for commands...",
      autofocus: true,
      data: initialData || undefined,
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
          class: CustomImageTool,
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
      onChange: async () => {
        console.log('Content changed - triggering auto-save');
        autoSave();
        // Check if content has meaningful changes
        const hasChanges = await hasContentChanged();
        setHasUnsavedChanges(hasChanges);
      },
      onReady: () => {
        console.log('Editor.js is ready to work!');
        // Delay initialization to ensure DOM is ready
        setTimeout(() => {
          initializeImageResizing();
          // Apply saved image sizes after initialization
          setTimeout(() => {
            applySavedImageSizes();
            // If editing existing content, also apply sizes from block data with multiple retries
            const cidFromUrl = getCidFromUrl();
            if (cidFromUrl) {
              console.log('🔄 Detected CID in URL, will apply saved image sizes with retries...');
              
              // Immediate attempt - try right away
              console.log('🔄 Immediate attempt: Applying image sizes from block data...');
              applyImageSizesFromBlockData();
              
              // Multiple attempts with increasing delays to ensure images are fully loaded
              setTimeout(() => {
                console.log('🔄 Attempt 1: Applying image sizes from block data...');
                applyImageSizesFromBlockData();
              }, 300);
              setTimeout(() => {
                console.log('🔄 Attempt 2: Applying image sizes from block data...');
                applyImageSizesFromBlockData();
              }, 800);
              setTimeout(() => {
                console.log('🔄 Attempt 3: Applying image sizes from block data...');
                applyImageSizesFromBlockData();
              }, 1500);
              setTimeout(() => {
                console.log('🔄 Attempt 4: Applying image sizes from block data...');
                applyImageSizesFromBlockData();
              }, 3000);
              
              // Additional aggressive approach - force apply dimensions after editor is fully loaded
              setTimeout(() => {
                console.log('🔄 Final attempt: Force applying image dimensions...');
                forceApplyImageDimensions();
              }, 5000);
            }
          }, 100);
        }, 300);
      }
    });

      editorRef.current = editor;
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
      }
      // Clear auto-save timeout on cleanup
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [isPreviewMode, previewData, isLoadingContent]);

  // Save title when it changes (with debouncing)
  useEffect(() => {
    if (documentTitle) {
      localStorage.setItem(TITLE_STORAGE_KEY, documentTitle);
    }
  }, [documentTitle]);

  // Set up custom dialog triggers (NO browser native dialogs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When tab becomes hidden, show our custom dialog if there are unsaved changes
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        console.log('Tab hidden with unsaved changes - showing dialog');
        setShowUnsavedDialog(true);
      }
    };

    // When user returns to tab, show dialog if there are unsaved changes
    const handleWindowFocus = () => {
      if (hasUnsavedChanges && !showUnsavedDialog) {
        console.log('Window focused with unsaved changes - showing dialog');
        setShowUnsavedDialog(true);
      }
    };

    // Detection for tab close attempts - show ONLY our custom dialog
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+W (close tab), Ctrl+Shift+W (close window), Alt+F4, Cmd+Q
      if (hasUnsavedChanges && !showUnsavedDialog) {
        const isCloseAttempt = 
          ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W')) || // Ctrl/Cmd+W
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'w' || e.key === 'W')) || // Ctrl/Cmd+Shift+W
          (e.altKey && e.key === 'F4') || // Alt+F4
          (e.metaKey && e.key === 'q'); // Cmd+Q on Mac
          
        if (isCloseAttempt) {
          console.log('Close attempt detected via keyboard shortcut - showing CUSTOM dialog only');
          e.preventDefault();
          setShowUnsavedDialog(true);
        }
      }
    };

    // Detect mouse movement towards close button area (experimental)
    const handleMouseMove = (e: MouseEvent) => {
      if (hasUnsavedChanges && !showUnsavedDialog) {
        // Check if mouse is moving towards top-right area (where close button usually is)
        const { clientX, clientY } = e;
        const { innerWidth } = window;
        
        // Close button area: top 50px, right 100px
        const isNearCloseButton = clientX > (innerWidth - 100) && clientY < 50;
        
        if (isNearCloseButton) {
          console.log('Mouse near close button with unsaved changes - showing dialog');
          setShowUnsavedDialog(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasUnsavedChanges, showUnsavedDialog]);

  // Show dialog after user is idle with unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges && !showUnsavedDialog) {
      // Clear existing timer
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      
      // Show dialog after 15 seconds of inactivity with unsaved changes (reduced from 30s)
      const timer = setTimeout(() => {
        console.log('User idle with unsaved changes - showing dialog');
        setShowUnsavedDialog(true);
      }, 15000); // 15 seconds
      
      setIdleTimer(timer);
    } else if (idleTimer) {
      clearTimeout(idleTimer);
      setIdleTimer(null);
    }
    
    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
    };
  }, [hasUnsavedChanges, showUnsavedDialog]);

  // Check for changes when title changes
  useEffect(() => {
    const checkChanges = async () => {
      const hasChanges = await hasContentChanged();
      setHasUnsavedChanges(hasChanges);
    };
    checkChanges();
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
      
      // console.log(`Scan found ${foundImages} new images to add handles to`);
      return foundImages;
    };
    
    // Efficient mutation observer that handles all changes without periodic scanning
    let mutationTimeout: NodeJS.Timeout | null = null;
    const throttledMutationHandler = (mutations: MutationRecord[]) => {
      if (mutationTimeout) return;
      
      mutationTimeout = setTimeout(() => {
        let hasImageChanges = false;
        let hasQuoteChanges = false;
        let hasCodeChanges = false;
        
        mutations.forEach((mutation) => {
          // Check for added nodes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check for images - more comprehensive detection
              if (element.querySelector('img') || element.tagName === 'IMG' || 
                  element.classList.contains('ce-image') || element.classList.contains('image-tool')) {
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
          
          // Check for attribute changes that might affect images
          if (mutation.type === 'attributes') {
            const target = mutation.target as Element;
            
            if ((mutation.attributeName === 'src' || mutation.attributeName === 'class' || 
                 mutation.attributeName === 'style') &&
                (target.tagName === 'IMG' || target.querySelector('img') || 
                 target.classList.contains('ce-image') || target.classList.contains('image-tool'))) {
              hasImageChanges = true;
            }
          }
        });
        
        if (hasImageChanges) {
          // Process images immediately when detected
          setTimeout(() => {
            scanAndAddHandles();
            applySavedImageSizes();
            
            // For editing existing content, also apply block data sizes
            const cidFromUrl = getCidFromUrl();
            if (cidFromUrl) {
              // Only apply if we haven't already applied recently
              if (!imageSizeApplicationTimeout) {
                applyImageSizesFromBlockData();
              }
            }
          }, 50); // Faster response for images
        }
        
        if (hasQuoteChanges) {
          setTimeout(() => ensureQuoteCaptions(), 25);
        }
        
        if (hasCodeChanges) {
          setTimeout(() => autoResizeCodeBlocks(), 50);
        }
        
        mutationTimeout = null;
      }, 50); // Reduced throttle to 50ms for better responsiveness
    };

    // Observer to watch for new blocks (images, quotes, code blocks)
    const observer = new MutationObserver(throttledMutationHandler);

    // Start observing
    if (holderRef.current) {
      observer.observe(holderRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'class', 'style']
      });

      // Initial scan - only retry if no images found initially
      const initialScanWithRetry = (attempts = 0) => {
        const foundImages = scanAndAddHandles();
        applySavedImageSizes(); // Apply saved sizes to all images
        
        // If editing existing content, also apply sizes from block data
        const cidFromUrl = getCidFromUrl();
        if (cidFromUrl) {
          applyImageSizesFromBlockData();
        }
        
        // Only retry if no images were found and we haven't tried too many times
        if (foundImages === 0 && attempts < 3) {
          setTimeout(() => initialScanWithRetry(attempts + 1), 1000 * (attempts + 1));
        }
      };
      
      initialScanWithRetry();
      
      // No periodic scanning needed - mutation observer handles all changes
      // The mutation observer will detect new images and apply handles/sizes as needed
      
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
    
    // Insert wrapper and move image into it
    imageElement.parentElement?.insertBefore(wrapper, imageElement);
    wrapper.appendChild(imageElement);
    
    // Ensure image has proper styling for smooth resizing
    imageElement.style.display = 'block';
    imageElement.style.margin = '0';
    imageElement.style.padding = '0';
    imageElement.style.border = 'none';
    imageElement.style.outline = 'none';
    
    // console.log('Adding resize handles to image:', imageElement);

    // Create resize handles
    const leftHandle = document.createElement('div');
    leftHandle.className = 'resize-handle left';
    
    const rightHandle = document.createElement('div');
    rightHandle.className = 'resize-handle right';

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

    // Add resize functionality using React state
    const startResize = (e: MouseEvent, handle: HTMLElement) => {
      const startX = e.clientX;
      const startWidth = imageElement.offsetWidth;
      const originalAspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
      
      // Update React state to trigger useEffect
      setResizeState({
        isResizing: true,
        activeImage: imageElement,
        startX,
        startWidth,
        originalAspectRatio,
        animationFrame: null,
        lastResizeTime: 0
      });
      
      // Disable all transitions and optimizations
      imageElement.style.transition = 'none';
      imageElement.style.willChange = 'width, height';
      imageElement.style.transform = 'translateZ(0)'; // Force hardware acceleration
      
      // Prevent text selection and other interactions
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
      document.body.style.pointerEvents = 'none';
      
      // Add class to wrapper for styling
      wrapper.classList.add('resizing');
      
      e.preventDefault();
      e.stopPropagation();
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
    <AuthGuard requireAuth={false}>
      <div className={`min-h-screen bg-white dark:bg-gray-900 ${isPreviewMode ? 'preview-mode' : ''}`}>
        <Navbar />
      
      {/* Title input and auto-save indicator */}
      <div className="max-w-4xl mx-auto px-8 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="text-5xl font-bold bg-transparent border-none outline-none flex-1 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder="Untitled"
            disabled={isPreviewMode}
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-2">
          <nav className="flex justify-between items-center" aria-label="Tabs">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => {
                  if (isPreviewMode) {
                    setIsPreviewMode(false);
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  !isPreviewMode
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={togglePreview}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  isPreviewMode
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main editor or preview */}
      <div className="max-w-4xl mx-auto px-8 pb-20">
        <div className="tab-content">
          {isLoadingContent ? (
            <div className="min-h-[800px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
              </div>
            </div>
          ) : isPreviewMode ? (
            <EditorPreview 
              data={previewData}
              className="min-h-[800px]"
            />
          ) : (
            <div 
              ref={holderRef}
              className="min-h-[800px] focus:outline-none"
              style={{
                minHeight: '800px'
              }}
            />
          )}
        </div>
      </div>

      {/* CSS for smooth image resizing */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .image-resize-wrapper {
            position: relative !important;
            display: inline-block !important;
            margin: 0 auto !important;
            overflow: hidden !important;
            contain: layout style !important;
          }
          
          .image-resize-wrapper.resizing {
            contain: layout style paint !important;
          }
          
          .image-resize-wrapper.resizing img {
            image-rendering: auto !important;
            backface-visibility: hidden !important;
            perspective: 1000px !important;
          }
          
          .resize-handle {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            width: 8px !important;
            height: 100px !important;
            background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%) !important;
            border: 2px solid #ffffff !important;
            border-radius: 4px !important;
            cursor: ew-resize !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
            z-index: 10000 !important;
            pointer-events: auto !important;
            display: block !important;
            visibility: visible !important;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5), 0 2px 8px rgba(0,0,0,0.3) !important;
          }
          
          .resize-handle.left {
            left: 2px !important;
          }
          
          .resize-handle.right {
            right: 2px !important;
          }
          
          .image-resize-wrapper:hover .resize-handle {
            opacity: 1 !important;
          }
        `
      }} />

      {/* Save and Post Buttons - Fixed at bottom right */}
      <div className="fixed bottom-6 right-6 flex items-center space-x-3 z-50">
        {/* Save Button */}
        <button
          onClick={saveToAPI}
          disabled={isSaving || !address}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          title={!isAuthenticated ? "Authentication required to save" : "Save content to blockchain"}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        
        {/* Post Button */}
        <button
          onClick={saveToAPI}
          disabled={isSaving || !address}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          title={!isAuthenticated ? "Authentication required to post" : "Post content to blockchain"}
        >
          {isSaving ? 'Posting...' : 'Post'}
        </button>
      </div>

      </div>
    </AuthGuard>
  );
};

export default EditorPage;
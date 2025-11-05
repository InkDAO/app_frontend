import React, { useRef, useCallback, useEffect } from "react";

// import tools for editor config
import { EDITOR_JS_TOOLS } from "./tools";

// create editor instance
import { createReactEditorJS } from "react-editor-js";

type EditorData = {
  time?: number;
  blocks?: any[];
  version?: string;
};

interface EditorProps {
  data?: EditorData;
  setData: (data: EditorData) => void;
  editorInstanceRef?: React.MutableRefObject<any>;
}

export default function Editor({ data, setData, editorInstanceRef }: EditorProps) {
  const editorCore = useRef<any>(null);
  const pasteHandlerRef = useRef<((event: Event) => void) | null>(null);
  const ReactEditorJS = createReactEditorJS();

  const handlePaste = useCallback(async (event: Event) => {
    const clipboardEvent = event as ClipboardEvent;
    const clipboardData = clipboardEvent.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text/plain');
    
    // Check if the pasted text contains newlines
    if (pastedText && pastedText.includes('\n')) {
      // Check if we're pasting into a textarea or input element
      const target = event.target as HTMLElement;
      if (target && (
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'INPUT' ||
        target.closest('.editorjs-latex') ||
        target.closest('.ce-code') ||
        target.closest('.cdx-warning') ||
        target.closest('.cdx-list') ||
        target.classList.contains('cdx-warning__title') ||
        target.classList.contains('cdx-warning__message') ||
        target.classList.contains('cdx-list__item-content') ||
        (target.isContentEditable && target.closest('.cdx-warning')) ||
        (target.isContentEditable && target.closest('.cdx-list'))
      )) {
        // Let the native element or block handle the paste
        return;
      }

      // Get the current editor instance
      const editor = editorCore.current;
      if (!editor || !editor._editorJS) return;

      try {
        await editor._editorJS.isReady;
        
        const blocks = editor._editorJS.blocks;
        const currentIndex = blocks.getCurrentBlockIndex();
        const currentBlock = blocks.getBlockByIndex(currentIndex);
        
        // Don't intercept paste for blocks that handle multiline content natively
        const blockTypesToSkip = ['code', 'raw', 'quote', 'table', 'warning', 'embed', 'Math', 'math', 'list'];
        if (currentBlock && blockTypesToSkip.includes(currentBlock.name)) {
          // Let the block handle its own paste event
          return;
        }
        
        // Only intercept for paragraph blocks
        event.preventDefault();
        event.stopPropagation();

        // Split text by newlines
        const lines = pastedText.split('\n');
        
        // Delete the current block
        blocks.delete(currentIndex);
        
        // Insert each line as a new paragraph block
        for (let i = 0; i < lines.length; i++) {
          await blocks.insert(
            'paragraph',
            { text: lines[i] },
            {},
            currentIndex + i,
            i === lines.length - 1 // focus on the last block
          );
        }
        
        // Trigger a save to update the undo history
        await editor._editorJS.save();
      } catch (error) {
        console.error('Error handling paste:', error);
      }
    }
  }, []);

  const handleInitialize = useCallback((instance: any) => {
    // await instance._editorJS.isReady;
    instance._editorJS.isReady
      .then(() => {
        // set reference to editor
        editorCore.current = instance;
        // Expose editor instance to parent if ref provided
        if (editorInstanceRef) {
          editorInstanceRef.current = instance;
        }

        // Add custom paste handler to handle multi-line text
        const editorElement = document.querySelector('.codex-editor');
        if (editorElement) {
          pasteHandlerRef.current = handlePaste;
          editorElement.addEventListener('paste', handlePaste as EventListener);
        }

        // Auto-expand code block textareas
        const autoExpandTextarea = (textarea: HTMLTextAreaElement) => {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        };

        // Setup auto-expand for existing and new code blocks
        const setupCodeBlockAutoExpand = () => {
          const codeTextareas = document.querySelectorAll('.ce-code__textarea');
          codeTextareas.forEach((textarea) => {
            const textareaElement = textarea as HTMLTextAreaElement;
            // Set initial height
            autoExpandTextarea(textareaElement);
            
            // Add input event listener
            textareaElement.addEventListener('input', () => autoExpandTextarea(textareaElement));
          });
        };

        // Initial setup
        setupCodeBlockAutoExpand();

        // Watch for new code blocks being added
        const observer = new MutationObserver(() => {
          setupCodeBlockAutoExpand();
        });

        observer.observe(editorElement, {
          childList: true,
          subtree: true,
        });

        // Store observer for cleanup
        (instance as any)._codeBlockObserver = observer;
      })
      .catch((err: Error) => console.log("An error occured", err));
  }, [editorInstanceRef, handlePaste]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Remove paste event listener on unmount
      const editorElement = document.querySelector('.codex-editor');
      if (editorElement && pasteHandlerRef.current) {
        editorElement.removeEventListener('paste', pasteHandlerRef.current as EventListener);
      }
      
      // Disconnect mutation observer
      if (editorCore.current && (editorCore.current as any)._codeBlockObserver) {
        (editorCore.current as any)._codeBlockObserver.disconnect();
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!editorCore.current) return;
    // retrieve data inserted
    const savedData = await editorCore.current.save();
    // save data
    setData(savedData);
  }, [setData]);

  return (
    <div className="editor-container">
      <ReactEditorJS
        onInitialize={handleInitialize}
        tools={EDITOR_JS_TOOLS}
        onChange={handleSave}
        defaultValue={data || { blocks: [] }}
        enableReInitialize={true}
      />
    </div>
  );
}


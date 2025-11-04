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

  const handlePaste = useCallback((event: Event) => {
    const clipboardEvent = event as ClipboardEvent;
    const clipboardData = clipboardEvent.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text/plain');
    
    // Check if the pasted text contains newlines
    if (pastedText && pastedText.includes('\n')) {
      event.preventDefault();
      event.stopPropagation();

      // Split text by newlines
      const lines = pastedText.split('\n');
      
      // Get the current editor instance
      const editor = editorCore.current;
      if (!editor || !editor._editorJS) return;

      // Insert blocks for each line
      editor._editorJS.isReady.then(async () => {
        const blocks = editor._editorJS.blocks;
        const currentIndex = blocks.getCurrentBlockIndex();
        
        // Save current state before making changes (for undo/redo)
        const currentData = await editor._editorJS.save();
        
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
      });
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


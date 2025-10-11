import React, { useRef, useCallback } from "react";

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
}

export default function Editor({ data, setData }: EditorProps) {
  const editorCore = useRef<any>(null);
  const ReactEditorJS = createReactEditorJS();

  const handleInitialize = useCallback((instance: any) => {
    // await instance._editorJS.isReady;
    instance._editorJS.isReady
      .then(() => {
        // set reference to editor
        editorCore.current = instance;
      })
      .catch((err: Error) => console.log("An error occured", err));
  }, []);

  const handleSave = useCallback(async () => {
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
      />
    </div>
  );
}


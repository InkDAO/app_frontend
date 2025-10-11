import "../components/editor1/Editor.css";
import React, { useState } from "react";
import Editor from "../components/editor1/editor";
import EditorTextParser from "../components/editor1/EditorTextParser";
import exampleData from "../components/editor1/ExampleData";
import { EditorData } from "../components/editor1/ExampleData";

export default function EditorPage2() {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [data, setData] = useState<EditorData>(exampleData);

  function toggleEditMode() {
    if (isEditMode) {
      setIsEditMode(false);
      console.log("Edit mode is now disabled");
    } else {
      setIsEditMode(true);
      console.log("Edit mode is now enabled");
    }
  }

  return (
    <div className="App">
      <button id="toggle-edit-btn" onClick={toggleEditMode}>
        Toggle Edit Mode
      </button>

      <div className="app-content">
        {isEditMode ? (
          <Editor data={data} setData={setData} />
        ) : (
          <EditorTextParser data={data} />
        )}
      </div>
    </div>
  );
}


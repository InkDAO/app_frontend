import React from "react";
// edjsHTML transforms editor js blocks to html
import edjsHTML from "editorjs-html";
// this function parses strings (html elements) to html
import parse from "html-react-parser";
import { EditorData } from "./ExampleData";

const edjsParser = edjsHTML();

interface EditorTextParserProps {
  data: EditorData;
}

export default function EditorTextParser({ data }: EditorTextParserProps) {
  // array of html elements
  const html = edjsParser.parse(data);

  return <div className="text-container">{parse(html.join(""))}</div>;
}



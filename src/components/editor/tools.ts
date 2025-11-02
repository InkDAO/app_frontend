import Table from "@editorjs/table";
import List from "@editorjs/list";
import Warning from "@editorjs/warning";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import CustomImageTool from "../CustomImageTool";
import Raw from "@editorjs/raw";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import Embed from "@editorjs/embed";
import Paragraph from "@editorjs/paragraph";
import EJLaTeX from 'editorjs-latex';

export const EDITOR_JS_TOOLS = {
  // Configure paragraph tool to preserve line breaks (Shift+Enter)
  paragraph: {
    class: Paragraph,
    config: {
      preserveBlank: true,
    },
  },
  header: Header,
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
  code: Code,
  list: List,
  table: Table,
  warning: Warning,
  linkTool: LinkTool,
  raw: Raw,
  quote: Quote,
  marker: Marker,
  delimiter: Delimiter,
  embed: Embed,
  inlineCode: InlineCode,
  Math: {
    class: EJLaTeX,
    shortcut: 'CMD+SHIFT+M'
  }
};
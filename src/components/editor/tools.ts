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

export const EDITOR_JS_TOOLS = {
  // NOTE: Paragraph is default tool. Declare only when you want to change paragraph option.
  // paragraph: Paragraph,
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
  link: LinkTool,
  raw: Raw,
  quote: Quote,
  marker: Marker,
  delimiter: Delimiter,
};
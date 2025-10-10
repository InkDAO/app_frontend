// edjsHTML tranforms editor js blocks to html
import edjsHTML from "editorjs-html";
// this function parses strings (html elements) to html
import parse from "html-react-parser";
const edjsParser = edjsHTML();

export default function EditorTextParser({ data }) {
  // array of html elements
  console.log('data', data);
  const html = edjsParser.parse(data);
  console.log('html', html);

  // Ensure html is an array before calling join
  const htmlString = Array.isArray(html) ? html.join("") : html || "";
  
  return (
    <div 
      className="text-container" 
      dangerouslySetInnerHTML={{ __html: htmlString }}
    />
  );
}

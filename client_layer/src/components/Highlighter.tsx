// Path: client_layer/src/components/Highlighter.tsx
import Highlighter from "react-highlight-words";

export const SecurityPreview = ({ text, words }: { text: string; words: string[] }) => (
  <div className="mt-4 p-4 border-2 border-red-50 rounded-lg bg-white max-h-64 overflow-auto font-mono text-xs">
    <div className="text-[10px] font-bold text-red-400 mb-2 uppercase tracking-widest border-b pb-1">
      Local Privacy Scan Result (No Data Sent to Cloud)
    </div>
    <Highlighter
      highlightClassName="bg-yellow-200 text-red-800 font-bold px-1 rounded-sm"
      searchWords={words}
      autoEscape={true}
      textToHighlight={text}
    />
  </div>
);
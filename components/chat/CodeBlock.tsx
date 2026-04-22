
import { useState, CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

export const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 border border-gray-700 rounded-xl overflow-hidden text-white">
      <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 border-b border-gray-700">
        <span className="text-[10px] text-gray-400 font-mono uppercase">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-[11px] px-3 py-1 rounded-md transition-all active:scale-95">
          {copied ? <><Check size={14} className="text-green-400" /> <span className="text-green-400 font-bold">Copied!</span></> : <><Copy size={14} className="text-gray-300" /> <span>Copy Code</span></>}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus as { [key: string]: CSSProperties }}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: "0 0 12px 12px", fontSize: "13px", padding: "1.25rem", background: "#1e1e1e" }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};
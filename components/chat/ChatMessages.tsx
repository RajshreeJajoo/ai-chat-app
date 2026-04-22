
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
//   messagesEndRef: React.RefObject<HTMLDivElement> | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>; 
}
export const ChatMessages = ({ messages, error, loading, messagesEndRef }: ChatMessagesProps) => (
  <div className="max-w-3xl mx-auto w-full">
    {messages.map((m: ChatMessage, i: number) => (
      <div key={i} className={`mb-8 flex w-full gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] ${m.role === "user" ? "bg-blue-600 text-white" : "bg-black text-white"}`}>
          {m.role === "user" ? "U" : "AI"}
        </div>
        <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-50 border"}`}>
          {m.role === "user" ? <p>{m.parts[0].text}</p> : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? <CodeBlock language={match[1]} value={String(children).replace(/\n$/, "")} /> : <code>{children}</code>;
              }
            }}>{m.parts[0].text}</ReactMarkdown>
          )}
        </div>
      </div>
    ))}
    {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl mb-4">Error: {error}</div>}
          {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-3 mt-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px]">AI</div>
                  <div className="px-4 py-3 bg-gray-50 rounded-2xl border">Thinking...</div>
                </div>
              )}           
                <div ref={messagesEndRef} />
  </div>
);
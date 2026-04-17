"use client";
import { useState, useEffect, useRef, JSX, CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Plus, 
  MessageSquare, 
  Menu, 
  X, 
  Code, 
  Terminal, 
  Cpu, 
  Lightbulb,
  Check,
  Copy
} from "lucide-react"; 

// ✅ Types
interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// ✅ Strictly Typed CodeBlock to avoid "any" errors
const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="relative my-4 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header bar jahan copy button dikhega */}
      <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 border-b border-gray-700">
        <span className="text-[10px] text-gray-400 font-mono uppercase">{language}</span>
        <button 
          onClick={handleCopy} 
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-[11px] px-3 py-1 rounded-md transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-gray-300" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter 
        style={vscDarkPlus as { [key: string]: CSSProperties }} 
        language={language} 
        PreTag="div" 
        customStyle={{ 
          margin: 0, 
          borderRadius: '0 0 12px 12px', 
          fontSize: '13px', 
          padding: '1.25rem',
          background: '#1e1e1e' 
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default function ChatPage() {
  // UI States
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatHistory] = useState([
    { id: 1, title: "Next.js API Setup" },
    { id: 2, title: "Prisma Schema Help" },
  ]);

  // Chat Logic States
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", parts: [{ text: "Hi! Main aapka AI mentor hoon. Kaise help karun?" }] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateTyping = (fullText: string) => {
    let currentText = "";
    let index = 0;
    setMessages((prev) => [...prev, { role: "model", parts: [{ text: "" }] }]);

    const interval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText[index];
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = { ...updated[lastIndex], parts: [{ text: currentText }] };
          return updated;
        });
        index++;
      } else {
        clearInterval(interval);
        setLoading(false);
      }
    }, 10);
  };

  const startNewChat = () => {
    setMessages([
      { role: "model", parts: [{ text: "Hi! Main aapka AI mentor hoon. Kaise help karun?" }] }
    ]);
    setInput("");
    setError(null);
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].slice(1),
          userProfile: { skills: "Next.js, AI" }, 
        }),
      });

      if (!res.ok) throw new Error("API Connection Failed");
      const data = await res.json();
      if (data.text) simulateTyping(data.text);
      else throw new Error("No response text");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-white text-black font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className={`fixed md:relative z-50 h-full bg-[#171717] text-white p-4 transition-all duration-300 flex flex-col ${isSidebarOpen ? "w-72 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-64"}`}>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute right-4 top-4 text-gray-400">
          <X size={24} />
        </button>

        <button onClick={startNewChat} className="flex items-center gap-2 w-full p-3 border border-gray-700 rounded-xl hover:bg-[#2f2f2f] transition-colors mb-6 font-medium text-sm shadow-sm text-white bg-transparent">
          <Plus size={18} /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          <p className="text-gray-500 text-[11px] font-bold px-2 mb-2 uppercase tracking-widest text-white/50">Recent Chats</p>
          {chatHistory.map((chat) => (
            <div key={chat.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2f2f2f] cursor-pointer group transition-all text-gray-300">
              <MessageSquare size={16} />
              <span className="text-sm truncate font-medium">{chat.title}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-4 mt-auto">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#2f2f2f] cursor-pointer transition-all">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">U</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold italic text-white">Career Mode On</span>
              <span className="text-[10px] text-gray-500 underline uppercase tracking-tighter">Setting Profile</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full bg-white relative">
        <header className="p-4 flex items-center gap-4 md:hidden border-b bg-white">
          <button onClick={() => setSidebarOpen(true)} className="text-black"><Menu size={20}/></button>
          <span className="font-bold text-sm tracking-tight text-black">AI MENTOR</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length <= 1 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl mb-6">A</div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight text-black">Kaise help karun aaj?</h1>
              <p className="text-gray-500 mb-10 text-sm max-w-sm">Apne AI career aur development ke safar ko shuru karte hain.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4 text-black">
                {[
                  { icon: <Code size={18} />, label: "Explain Next.js API Routes" },
                  { icon: <Terminal size={18} />, label: "Debug my useEffect logic" },
                  { icon: <Cpu size={18} />, label: "How LLM context works?" },
                  { icon: <Lightbulb size={18} />, label: "AI Career Roadmap" },
                ].map((item) => (
                  <button key={item.label} onClick={() => setInput(item.label)} className="p-4 bg-white border border-gray-100 rounded-2xl text-left text-sm hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-3 group">
                    <span className="text-gray-400 group-hover:text-black">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {messages.map((m, i) => (
                <div key={i} className={`mb-8 flex w-full gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold shadow-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-black text-white"}`}>
                    {m.role === "user" ? "U" : "AI"}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-50 text-black rounded-tl-none border"}`}>
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white">{m.parts[0].text}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none text-inherit">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          code({ className, children }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            return match ? (
                              <CodeBlock language={match[1]} value={codeString} />
                            ) : (
                              <code className="bg-gray-200 text-red-600 px-1.5 py-0.5 rounded text-[12px] font-mono font-bold">{children}</code>
                            );
                          },
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[14px]">{children}</p>,
                        }}>{m.parts[0].text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-2 animate-pulse font-medium">Error: {error}</div>}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">AI</div>
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="p-4 md:pb-8 max-w-3xl mx-auto w-full bg-white">
          <div className="flex gap-2 bg-white p-2 rounded-[24px] shadow-lg border border-gray-200 items-end focus-within:border-gray-400 transition-all">
            <textarea
              ref={textareaRef}
              disabled={loading}
              rows={1}
              className="flex-1 p-3 outline-none text-black bg-transparent resize-none max-h-40 overflow-y-auto text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Sawal pucho..."
            />
            <button disabled={loading} onClick={sendMessage} className="bg-black text-white px-6 py-2.5 rounded-[18px] h-fit mb-1 hover:bg-gray-800 transition-all disabled:bg-gray-300 font-bold text-sm min-w-[120px] shadow-sm">
              {loading ? "AI Typing..." : "Send"}
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-3">AI Mentor can make mistakes. Check important info.</p>
        </div>
      </main>
    </div>
  );
}
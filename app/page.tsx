"use client";
import { useState, useEffect, useRef, JSX, CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
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
  Copy,
  Square,
  Trash2,
} from "lucide-react";

// ✅ Types
interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface DBMessage {
  _id: string;
  chatId: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
}

const CodeBlock = ({
  language,
  value,
}: {
  language: string;
  value: string;
}) => {
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
    <div className="relative my-4 border border-gray-700 rounded-xl overflow-hidden text-white">
      <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 border-b border-gray-700">
        <span className="text-[10px] text-gray-400 font-mono uppercase">
          {language}
        </span>
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
          borderRadius: "0 0 12px 12px",
          fontSize: "13px",
          padding: "1.25rem",
          background: "#1e1e1e",
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default function ChatPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ _id: string; title: string }[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "model", parts: [{ text: "Hi! Main aapka AI mentor hoon. Kaise help karun?" }], },]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
  }, [messages, loading]);


  useEffect(() => {
  loadHistory();
}, [activeChatId]);

const loadHistory = async () => {
  const res = await fetch("/api/history");
  const data = await res.json();
  if (!data.error) setChatHistory(data);
};

  const stopVisualOnly = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setLoading(false);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopVisualOnly();
  };

  const confirmDelete = (e: React.MouseEvent, chatId: string) => {
  e.stopPropagation(); // Parent click prevent karo
  setChatToDelete(chatId);
  setShowDeleteModal(true);
};

const executeDelete = async () => {
  if (!chatToDelete) return;
  
  try {
    const res = await fetch(`/api/chat/${chatToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setChatHistory((prev) => prev.filter((chat) => chat._id !== chatToDelete));
      if (activeChatId === chatToDelete) {
        setActiveChatId(null);
        setMessages([{ role: "model", parts: [{ text: "Hi! Main aapka AI mentor hoon. Kaise help karun?" }] }]);
      }
    }
  } catch (err) {
    console.error("Delete failed:", err);
  } finally {
    setShowDeleteModal(false);
    setChatToDelete(null);
  }
};
  const simulateTyping = (fullText: string) => {
    let currentText = "";
    let index = 0;
    setMessages((prev) => [...prev, { role: "model", parts: [{ text: "" }] }]);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    typingIntervalRef.current = setInterval(() => {
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
        stopVisualOnly();
      }
    }, 10);
  };

  const loadChatMessages = async (chatId: string) => {
    setLoading(true);
    setMessages([]); // ✅ Purana UI clear logic
    setActiveChatId(chatId);
    setSidebarOpen(false);
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`);
      const data: DBMessage[] = await res.json();
      if (res.ok) {
        const historyMessages: ChatMessage[] = data.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));
        setMessages(historyMessages); 
      }
    } catch (err) {
      console.error("Error loading chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const userMsg: ChatMessage = { role: "user", parts: [{ text: input }] };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userProfile: { skills: "Artificial Intelligence, Machine Learning, Next.js, and React" },
          chatId: activeChatId,
        }),
      });
      if (!res.ok) throw new Error("API Connection Failed");
      const data = await res.json();
      
      // ✅ Active ID update logic
      if (data.chatId && !activeChatId) {
        setActiveChatId(data.chatId);
        await loadHistory();
      }

      if (data.text) simulateTyping(data.text);
      else throw new Error("No response text");
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.name !== "AbortError") {
          setError(e.message);
          setLoading(false);
        }
      } else {
        setError("Something went wrong");
        setLoading(false);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-white text-black font-sans overflow-hidden">
      <aside className={`fixed md:relative z-50 h-full bg-[#171717] text-white p-4 transition-all duration-300 flex flex-col ${isSidebarOpen ? "w-72 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-64"}`}>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute right-4 top-4 text-gray-400"><X size={24} /></button>
        <button
          onClick={() => {
            handleStop();
            setActiveChatId(null); // ✅ Reset active chat
            setMessages([{ role: "model", parts: [{ text: "Hi! Main aapka AI mentor hoon. Kaise help karun?" }] }]);
            setInput("");
            setError(null);
            setSidebarOpen(false);
            loadHistory();
          }}
          className="flex items-center gap-2 w-full p-3 border border-gray-700 rounded-xl hover:bg-[#2f2f2f] transition-colors mb-6 font-medium text-sm text-white"
        >
          <Plus size={18} /> New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          <p className="text-gray-500 text-[11px] font-bold px-2 mb-2 uppercase tracking-widest text-white/50">Recent Chats</p>
          {chatHistory.map((chat) => (
            <div
              key={chat._id}
              onClick={() => loadChatMessages(chat._id)}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all ${activeChatId === chat._id ? "bg-[#2f2f2f] text-white" : "text-gray-400 hover:bg-[#2f2f2f]"}`}
            >
              <div className="flex items-center gap-3 truncate">
                {/* <MessageSquare size={16} /> */}
                <span className="text-sm truncate font-medium">{chat.title}</span>
              </div>
             

              <button 
  onClick={(e) => confirmDelete(e, chat._id)} // ✅ Isse replace karo
  className=" group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
>
  <Trash2 size={14} />
</button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-white relative">
        <header className="p-4 flex items-center gap-4 md:hidden border-b bg-white text-black">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <span className="font-bold text-sm tracking-tight">AI MENTOR</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length <= 1 && !activeChatId ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center text-3xl font-black mb-6">A</div>
              <h1 className="text-3xl font-bold mb-3 tracking-tight text-black">Kaise help karun aaj?</h1>

              <p className="text-gray-500 mb-10 text-sm max-w-sm">Apne AI career aur development ke safar ko shuru karte hain.</p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4 text-black">
               {[
                 { 
    icon: <Cpu size={18} />, 
    label: "RAG Architecture kaise design karein?" 
  },
  { 
    icon: <Terminal size={18} />, 
    label: "Gemini API ke Context Window ko manage karna seekhna hai" 
  },
  { 
    icon: <Code size={18} />, 
    label: "Next.js mein Streaming Responses (AI) kaise implement karein?" 
  },
  { 
    icon: <Lightbulb size={18} />, 
    label: "Vector Database vs Traditional DB: AI projects ke liye kya best hai?" 
  },
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${m.role === "user" ? "bg-blue-600 text-white" : "bg-black text-white"}`}>{m.role === "user" ? "U" : "AI"}</div>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-50 text-black rounded-tl-none border"}`}>
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white">{m.parts[0].text}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none text-inherit">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                          code({ className, children }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeString = String(children).replace(/\n$/, "");
                            return match ? <CodeBlock language={match[1]} value={codeString} /> : <code className="bg-gray-200 text-red-600 px-1.5 py-0.5 rounded text-[12px] font-mono font-bold">{children}</code>;
                          },
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[14px]">{children}</p>,
                        }}>{m.parts[0].text}</ReactMarkdown>
                      </div>
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
          )}
        </div>

        <div className="p-4 md:pb-8 max-w-3xl mx-auto w-full bg-white">
          <div className="flex gap-2 bg-white p-2 rounded-[24px] shadow-lg border border-gray-200 items-end">
            <textarea
              ref={textareaRef}
              disabled={loading && !typingIntervalRef.current}
              rows={1}
              className="flex-1 p-3 outline-none text-black bg-transparent resize-none max-h-40 overflow-y-auto text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Sawal pucho..."
            />
            {/* <button
              onClick={loading ? handleStop : sendMessage}
              className={`${loading ? 'bg-red-500' : 'bg-black'} text-white px-6 py-2.5 rounded-[18px] h-fit mb-1 font-bold text-sm min-w-[120px]`}
            >
              {loading ? "Stop" : "Send"}
            </button> */}

             {loading ? (
              <button
                onClick={handleStop}
                className="bg-red-500 text-white px-6 py-2.5 rounded-[18px] h-fit mb-1 hover:bg-red-600 transition-all font-bold text-sm min-w-[120px] flex items-center justify-center gap-2"
              >
                <Square size={14} fill="white" /> Stop
              </button>
            ) : (
              <button
                onClick={sendMessage}
                className="bg-black text-white px-6 py-2.5 rounded-[18px] h-fit mb-1 hover:bg-gray-800 transition-all disabled:bg-gray-300 font-bold text-sm min-w-[120px]"
              >
                Send
              </button>
            )}

            {showDeleteModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200 border border-gray-100">
    
      <h3 className="text-lg font-bold text-black mb-2 tracking-tight">Chat delete karni hai?</h3>
      <p className="text-gray-500 text-sm mb-6 leading-relaxed">
        Ye chat hamesha ke liye delete ho jayegi. Kya aap sure hain?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-400 text-black rounded-xl font-bold text-sm transition-all"
        >
          Nahi, Rehne do
        </button>
        <button
          onClick={executeDelete}
          className="flex-1 px-4 py-3 bg-red-400 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 transition-all"
        >
          Haan, Delete kar do
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        </div>
      </main>
    </div>
  );
}



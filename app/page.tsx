"use client";
import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { Menu } from "lucide-react";
import { useSpeech } from "./hooks/useSpeech";
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
export default function ChatPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ _id: string; title: string }[]>([]);
  const [messages, setMessages] = useState<{ role: "user" | "model"; parts: { text: string }[] }[]>([
    { role: "model", parts: [{ text: "Hi! Main aapka AI mentor hoon. Kaise help karun?" }] },
  ]);
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
  const { isListening, startListening, speak  , setIsSpeaking , isSpeaking} = useSpeech();
  const [isLastInputVoice, setIsLastInputVoice] = useState(false);
  
  
  useEffect(() => { 
    setMounted(true);
     loadHistory(); }, []);
  
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // useEffect(() => {
  //   setMounted(true);
  // }, []);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);


//   useEffect(() => {
//   loadHistory();
// }, []);

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
    window.speechSynthesis.cancel(); 
    setIsSpeaking(false); // ✅ Yahan reset karein
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopVisualOnly();
  };

  const confirmDelete = (e: React.MouseEvent, chatId: string) => {
  e.stopPropagation(); 
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
  const simulateTyping = (fullText: string, shouldSpeak: boolean) => {
    let currentText = "";
    let index = 0;
    setMessages((prev) => [...prev, { role: "model", parts: [{ text: "" }] }]);
    if (shouldSpeak) {
    speak(fullText, shouldSpeak);
  }
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
        //  speak(fullText, shouldSpeak)
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
    setIsLastInputVoice(false)
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

      if (data.text) simulateTyping(data.text , isLastInputVoice);
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

  const handleVoice = () => {
    setIsLastInputVoice(true)
    setLoading(true)
    // startListening((transcript) => {
    //   setInput((prev) => prev + " " + transcript);
    // });
    startListening((transcript) => {
    setInput((prev) => (prev + " " + transcript).trim());
  });
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-white text-black font-sans overflow-hidden">
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen} 
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        loadChat={loadChatMessages}
         onNewChat={() => {
            handleStop();
            setActiveChatId(null); // ✅ Reset active chat
            setMessages([{ role: "model", parts: [{ text: "Hi! Main aapka AI mentor hoon. Kaise help karun?" }] }]);
            setInput("");
            setError(null);
            setSidebarOpen(false);
            loadHistory();
          }}
        onDelete={confirmDelete}
      />

      <main className="flex-1 flex flex-col h-full bg-white relative">
        <header className="p-4 flex items-center gap-4 md:hidden border-b">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <span className="font-bold text-sm">AI MENTOR</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <ChatMessages 
            messages={messages} 
            error={error} 
            loading={loading} 
            messagesEndRef={messagesEndRef} 
          />
        </div>

        <ChatInput 
          input={input}
          setInput={setInput}
          onSend={sendMessage}
          onStop={handleStop}
          loading={loading}
          textareaRef={textareaRef}
          onVoiceInput={handleVoice}
          isListening={isListening}
          isLastInputVoice={isLastInputVoice}
          isSpeaking={isSpeaking}
        />
        
        {/* Modal remains in the main page for easy overlay control */}
        {showDeleteModal && (
          <DeleteModal 
            onClose={() => setShowDeleteModal(false)} 
            onConfirm={executeDelete} 
          />
        )}
      </main>
    </div>
  );
}

interface DeleteHistory {
onClose : () => void;
onConfirm : () => void;}

const DeleteModal = ({ onClose, onConfirm }: DeleteHistory) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
      <h3 className="text-lg font-bold mb-2">Chat delete karni hai?</h3>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-200 rounded-xl">Nahi</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-400 text-white rounded-xl">Haan</button>
      </div>
    </div>
  </div>
);
"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { Menu, Code, Cpu, Layers } from "lucide-react";
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

type InputMode = "text" | "voice";

const GREETING =
  "Hi! I'm your AI career mentor. Ask me anything about React, Next.js, TypeScript, or AI integration.";

export default function ChatPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ _id: string; title: string }[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", parts: [{ text: GREETING }] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<InputMode>("text");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    isListening,
    startListening,
    speak,
    stopSpeaking,
    stopListening,
    isSpeaking,
    speechError,
    setIsSpeaking,
  } = useSpeech();

  const starterCards = [
    {
      title: "React Concepts",
      description: "State management, custom hooks, and rendering lifecycle optimization.",
      icon: <Code className="w-5 h-5 text-blue-500" />,
      prompt:
        "How can I optimize state management in React using custom hooks? Show a basic example.",
    },
    {
      title: "Next.js 14 / App Router",
      description: "Server Actions, PPR, and Server Components deep dive architecture.",
      icon: <Layers className="w-5 h-5 text-black" />,
      prompt:
        "What is the best production architecture for Server Actions and Server Components in Next.js App Router?",
    },
    {
      title: "AI Integration",
      description: "Gemini API configuration and efficient prompt engineering patterns.",
      icon: <Cpu className="w-5 h-5 text-purple-500" />,
      prompt:
        "How do I set up Gemini API integration in Next.js with dynamic system prompts and streaming?",
    },
  ];

  const handleCardClick = (promptText: string) => {
    setInput(promptText);
    setResponseMode("text");
    textareaRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHistory = async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    if (!data.error) setChatHistory(data);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isSpeaking]);

  useEffect(() => {
    loadHistory().catch((err) => console.error("Failed to load chat history:", err));
  }, []);

  const handleStop = () => {
    stopSpeaking();
    stopListening();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const showResponse = (fullText: string, mode: InputMode) => {
    setLoading(false);

    if (mode === "voice") {
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: [{ text: "🔊 Speaking answer…" }] },
      ]);

      void speak(fullText, () => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "model",
            parts: [{ text: fullText }],
          };
          return updated;
        });
      });
      return;
    }

    setMessages((prev) => [...prev, { role: "model", parts: [{ text: fullText }] }]);
  };

  const sendMessage = async (text: string, mode: InputMode) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    setResponseMode(mode);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: ChatMessage = { role: "user", parts: [{ text: trimmed }] };
    const updatedMessages = activeChatId ? [...messages, userMsg] : [userMsg];

    setMessages((prev) => (activeChatId ? [...prev, userMsg] : [userMsg]));
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: updatedMessages,
          userProfile: {
            skills: "Artificial Intelligence, Machine Learning, Next.js, and React",
          },
          chatId: activeChatId,
        }),
      });

      if (!res.ok) throw new Error("API Connection Failed");

      const data = await res.json();

      if (data.chatId && !activeChatId) {
        setActiveChatId(data.chatId);
        await loadHistory();
      }

      if (data.text) {
        showResponse(data.text, mode);
      } else {
        throw new Error("No response text");
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
        setLoading(false);
      } else if (!(e instanceof Error)) {
        setError("Something went wrong");
        setLoading(false);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSendText = () => {
    setResponseMode("text");
    void sendMessage(input, "text");
  };

  const handleVoice = () => {
    if (loading || isListening) return;

    setResponseMode("voice");
    startListening((transcript) => {
      setInput(transcript);
      void sendMessage(transcript, "voice");
    });
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
          setMessages([{ role: "model", parts: [{ text: GREETING }] }]);
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setShowDeleteModal(false);
      setChatToDelete(null);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    handleStop();
    setLoading(true);
    setMessages([]);
    setActiveChatId(chatId);
    setSidebarOpen(false);
    setResponseMode("text");

    try {
      const res = await fetch(`/api/chat/${chatId}/messages`);
      const data: DBMessage[] = await res.json();
      if (res.ok) {
        setMessages(
          data.map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          }))
        );
      }
    } catch (err) {
      console.error("Error loading chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const isNewChatSession = !activeChatId && messages.length <= 1;
  const isBusy = loading || isListening || isSpeaking;

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
          setActiveChatId(null);
          setMessages([{ role: "model", parts: [{ text: GREETING }] }]);
          setInput("");
          setError(null);
          setResponseMode("text");
          setSidebarOpen(false);
          loadHistory();
        }}
        onDelete={confirmDelete}
      />

      <main className="flex-1 flex flex-col h-full bg-white relative">
        <header className="p-4 flex items-center gap-4 md:hidden border-b">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm">AI MENTOR</span>
          {responseMode === "voice" && (
            <span className="text-xs text-purple-600 font-medium">Voice mode</span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
          {isNewChatSession ? (
            <div className="my-auto max-w-4xl mx-auto w-full px-4 text-center space-y-10">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome to AI Mentor Spaces
                </h1>
                <p className="text-gray-500 max-w-lg mx-auto text-sm md:text-base">
                  Level up your frontend and AI engineering skills.
                </p>
                <p className="text-gray-400 text-xs">
                  Type for text answers · Mic for voice answers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-4">
                {starterCards.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCardClick(card.prompt)}
                    className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group text-left shadow-sm flex flex-col h-full justify-between"
                  >
                    <div className="space-y-3">
                      <div className="p-2.5 bg-white rounded-xl w-fit shadow-sm group-hover:scale-105 transition-transform">
                        {card.icon}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">{card.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{card.description}</p>
                    </div>
                    <div className="text-xs font-semibold text-blue-600 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ask Mentor →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-4xl mx-auto">
              <ChatMessages
                messages={messages}
                error={error ?? speechError}
                loading={loading}
                isListening={isListening}
                isSpeaking={isSpeaking}
                messagesEndRef={messagesEndRef}
              />
            </div>
          )}
        </div>

        <div className="p-4 md:p-8 pt-0 w-full max-w-4xl mx-auto">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSendText}
            onStop={handleStop}
            loading={loading}
            textareaRef={textareaRef}
            onVoiceInput={handleVoice}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isBusy={isBusy}
          />
        </div>

        {showDeleteModal && (
          <DeleteModal onClose={() => setShowDeleteModal(false)} onConfirm={executeDelete} />
        )}
      </main>
    </div>
  );
}

interface DeleteHistory {
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal = ({ onClose, onConfirm }: DeleteHistory) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
      <h3 className="text-lg font-bold mb-2">Delete this chat?</h3>
      <p className="text-sm text-gray-500 mb-4">This action cannot be undone.</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-200 rounded-xl">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl">
          Delete
        </button>
      </div>
    </div>
  </div>
);

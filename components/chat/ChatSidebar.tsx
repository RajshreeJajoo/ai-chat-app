
import { Plus, X, Trash2 } from "lucide-react";
 interface ChatHistoryItem {
  _id: string;
  title: string;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  loadChat: (chatId: string) => Promise<void>;
  onDelete: (e: React.MouseEvent, chatId: string) => void;
  onNewChat: () => void;
}
export const ChatSidebar = ({ 
  isOpen, setIsOpen, chatHistory, activeChatId, loadChat, onNewChat, onDelete 
}: SidebarProps) => (
  <aside className={`fixed md:relative z-50 h-full bg-[#171717] text-white p-4 transition-all duration-300 flex flex-col ${isOpen ? "w-72 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-64"}`}>
    <button onClick={() => setIsOpen(false)} className="md:hidden absolute right-4 top-4 text-gray-400"><X size={24} /></button>
    <button onClick={onNewChat} className="flex items-center gap-2 w-full p-3 border border-gray-700 rounded-xl hover:bg-[#2f2f2f] mb-6 font-medium text-sm">
      <Plus size={18} /> New Chat
    </button>
    <div className="flex-1 overflow-y-auto space-y-1">
      <p className="text-gray-500 text-[11px] font-bold px-2 mb-2 uppercase tracking-widest">Recent Chats</p>
      {chatHistory.map((chat: ChatHistoryItem) => (
        <div key={chat._id} onClick={() => loadChat(chat._id)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${activeChatId === chat._id ? "bg-[#2f2f2f]" : "hover:bg-[#2f2f2f]"}`}>
          <span className="text-sm truncate">{chat.title}</span>
          <button onClick={(e) => onDelete(e, chat._id)} className="p-1 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  </aside>
);
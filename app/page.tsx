'use client'; // Kyunki hum hooks (useState) use kar rahe hain

import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: 'Hi! Main aapka AI mentor hoon. Kaise help karun????' }] }
  ]);

  const [input, setInput] = useState('');
const [loading , setLoading] = useState(false)
  const sendMessage = async () => {
    if (!input.trim()) return;

    // 1. User ka message UI mein add karo
    const userMsg = { role: 'user', parts: [{ text: input }] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    // 2. Backend ko payload bhejo
  
  const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
      'Content-Type': 'application/json', 
    },
  body: JSON.stringify({
    // slice(1) taaki wo pehla "Hi! Main AI mentor hoon" backend ko na jaye
    messages: newMessages.slice(1), 
    userProfile: { experience: '6 years', skills: 'React, JS' }
  }),
});


    // const data = await response.json();
    // setMessages([...newMessages, { 
    //   role: 'model', 
    //   parts: [{ text: data.text }] 
    // }])
  try {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API Error');
  
  setMessages([...newMessages, { role: 'model', parts: [{ text: data.text }] }]);
} catch (err) {
  alert("Opps! Kuch gadbad hui. Check console.");
} finally {
  setLoading(false); // Ye zaroori hai taaki button wapas enable ho jaye
}
  };

  return (
    <div className="p-10 flex flex-col h-screen max-w-2xl mx-auto">
      
    
     <div className="flex-1 overflow-y-auto border p-4 mb-4 rounded shadow-sm">
        {messages.map((m, i) => (
          <div key={i} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
              {m.parts[0].text}
            </span>
          </div>
        ))}
        {loading && <div className="text-left text-gray-400">AI is thinking...</div>}
      </div>
      
      <div className="flex gap-2">
        <input 
          className="flex-1 border p-2 rounded text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="bg-black text-white px-4 py-2 rounded">{loading ? "..." : "Send"}</button>
      </div>

    </div>
  );
}
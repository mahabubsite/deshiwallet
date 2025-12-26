
import React, { useState, useEffect, useRef } from 'react';
import * as Router from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../App';

const { useNavigate } = Router as any;

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "How do I verify my identity?",
  "How do I add a new bank card?",
  "Is my data securely encrypted?",
  "What documents can I store?",
  "How do I contact support?"
];

// Helper to format AI text with basic markdown-like patterns
const formatText = (text: string) => {
  return text.split('\n').map((line, i) => {
    // Bold text handling (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-black text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Check if line is a list item
    if (/^\d+\.\s/.test(line)) {
      return <div key={i} className="ml-2 mb-2 leading-relaxed">{parts}</div>;
    }

    return <p key={i} className={line.trim() === '' ? 'h-4' : 'mb-3'}>{parts}</p>;
  });
};

const DeshiAI: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: `Hello! I am your **DeshiWallet** assistant. How can I help you manage your secure vault today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (query?: string) => {
    const text = query || input;
    if (!text.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: text,
        config: {
          systemInstruction: `You are DeshiWallet AI. Provide clean, professional, and structured replies.
          
          Format Rules:
          1. Use bold text (e.g., **DeshiWallet**) for important terms.
          2. For instructions, use a numbered list where the primary action is in double quotes. 
             Example: 1. "Open the app and go to Document Vault"
          3. Always include a brief security summary at the end of help topics: "Your data is securely encrypted (AES-256) and reviewed manually for safety."
          4. Mention "contact Support from Settings" if the user needs more help.
          5. Keep sentences simple, calm, and human. Avoid emojis or hype.
          
          App Info:
          - Document Vault: IDs, Passports, DL.
          - Wallet: Visa/MasterCard/Amex with custom themes.
          - Identity: Manual admin review required for verification.`
        },
      });

      const aiMessage: Message = {
        role: 'ai',
        text: response.text || "I apologize, I am unable to process that right now. Please rephrase your query.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "System connectivity issue. Please try again or check your network.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen max-w-4xl mx-auto bg-gray-50 dark:bg-dark animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-4 md:p-6 bg-white dark:bg-secondary border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <i className="fas fa-robot"></i>
             </div>
             <div>
                <h1 className="text-sm font-black uppercase tracking-tight">DeshiWallet AI</h1>
                <div className="flex items-center space-x-1.5">
                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
                </div>
             </div>
          </div>
        </div>
        <button onClick={() => setMessages([messages[0]])} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">Clear Chat</button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[90%] md:max-w-[80%] p-5 md:p-6 rounded-[24px] ${
              m.role === 'user' 
                ? 'bg-primary text-white shadow-xl shadow-primary/10 rounded-tr-none' 
                : 'bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 shadow-sm rounded-tl-none text-gray-700 dark:text-gray-300'
            }`}>
              <div className="text-sm leading-relaxed">
                {m.role === 'ai' ? formatText(m.text) : m.text}
              </div>
              <div className={`text-[8px] mt-3 font-black uppercase tracking-widest opacity-40 ${m.role === 'user' ? 'text-white' : 'text-gray-400'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-secondary p-4 rounded-[24px] rounded-tl-none shadow-sm flex space-x-1 border border-gray-50 dark:border-gray-800">
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Chips */}
      {messages.length < 4 && !isTyping && (
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar pb-4">
          {SUGGESTIONS.map((s, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(s)}
              className="px-4 py-2 bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-primary hover:text-primary whitespace-nowrap transition-all shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-secondary border-t border-gray-100 dark:border-gray-800 pb-24 md:pb-6">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <input 
            type="text"
            className="w-full pl-6 pr-16 py-4 bg-gray-50 dark:bg-dark border border-transparent focus:border-primary/20 rounded-2xl outline-none font-bold text-sm transition-all"
            placeholder="Type a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`absolute right-2 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${input.trim() && !isTyping ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-300'}`}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
        <p className="text-[8px] text-center mt-3 text-gray-400 font-black uppercase tracking-[0.3em]">AES-256 bit encryption active</p>
      </div>
    </div>
  );
};

export default DeshiAI;

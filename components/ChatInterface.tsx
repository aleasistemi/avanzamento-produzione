import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Sparkles } from 'lucide-react';
import { Operatore, Commessa, AIResponse } from '../types';
import { processUserCommand } from '../services/geminiService';

interface ChatInterfaceProps {
  user: Operatore;
  commesse: Commessa[];
  onAction: (action: AIResponse) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, commesse, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Ciao ${user.Nome}, come posso aiutarti oggi in ${user.Reparto}?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await processUserCommand(userMsg, user, commesse);
      
      setMessages(prev => [...prev, { role: 'assistant', text: response.message }]);
      
      if (response.status === 'ok') {
        onAction(response);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Mi dispiace, ho avuto un problema di connessione." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-alea-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-alea-500 transition-transform transform hover:scale-105 z-50"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-alea-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h3 className="font-semibold">Alea Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] p-3 rounded-lg text-sm ${
              msg.role === 'user'
                ? 'bg-alea-100 text-alea-900 ml-auto rounded-br-none'
                : 'bg-white border border-gray-200 text-gray-800 mr-auto rounded-bl-none shadow-sm'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-xs ml-2">
            <Loader2 className="animate-spin" size={14} /> Elaborazione...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 rounded-b-xl flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un comando..."
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-alea-500 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-2 bg-alea-600 text-white rounded-lg hover:bg-alea-500 disabled:opacity-50 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
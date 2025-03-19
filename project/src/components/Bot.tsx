import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MessageSquare, Send, Trash2, RefreshCw } from 'lucide-react';
import { getAIResponse } from '../services/ai';
import { useChatStore } from '../store/chat';
import { marked } from 'marked';

interface BotProps {
  section: string;
  context: string;
}

export function Bot({ section, context }: BotProps) {
  const { isConnected } = useAccount();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, clearHistory } = useChatStore();
  const sectionMessages = messages[section] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sectionMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMessage = {
      role: 'user' as const,
      content: input,
      context,
    };
    
    addMessage(section, userMessage);
    setInput('');

    try {
      const response = await getAIResponse([userMessage], context);
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: response,
        context,
      };
      
      addMessage(section, assistantMessage);
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage(section, {
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        context,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessage = (message: { role: string; content: string; timestamp: number }) => {
    const isUser = message.role === 'user';
    const bgColorClass = isUser ? 'bg-blue-600' : 'bg-white/20';
    
    return (
      <div
        key={message.timestamp}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] rounded-2xl p-4 ${bgColorClass}`}>
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: marked(message.content, { breaks: true })
            }}
          />
          <div className="mt-2 text-xs opacity-60">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
        <MessageSquare className="w-12 h-12 text-white mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-300">
          Please connect your wallet to access the AI chatbot and interact with Sonic Blaze.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          AI Assistant
        </h3>
        {sectionMessages.length > 0 && (
          <button
            onClick={() => clearHistory(section)}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      <div className="h-[400px] overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {sectionMessages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          sectionMessages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about trading, NFTs, governance, or get AI investment advice..."
          className="w-full bg-white/20 text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isProcessing}
        />
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-white p-2 rounded-lg transition-all ${
            isProcessing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-white/10'
          }`}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
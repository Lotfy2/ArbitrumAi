import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: string;
}

interface ChatState {
  messages: Record<string, Message[]>;
  addMessage: (section: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearHistory: (section: string) => void;
  clearAllHistory: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: {},
      addMessage: (section, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [section]: [
              ...(state.messages[section] || []),
              {
                ...message,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
              },
            ],
          },
        })),
      clearHistory: (section) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [section]: [],
          },
        })),
      clearAllHistory: () => set({ messages: {} }),
    }),
    {
      name: 'arbitrum-chat-storage',
    }
  )
);
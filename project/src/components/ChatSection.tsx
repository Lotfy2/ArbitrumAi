import React from 'react';
import { Bot } from './Bot';

interface ChatSectionProps {
  section: string;
  context: string;
}

export function ChatSection({ section, context }: ChatSectionProps) {
  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <Bot section={section} context={context} />
    </div>
  );
}
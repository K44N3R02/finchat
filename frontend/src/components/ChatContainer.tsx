import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { ChatBubble } from './ChatBubble';

interface ChatContainerProps {
  messages: Message[];
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 bg-[#efeae2] relative w-full h-full flex flex-col">
      {/* Background pattern similar to WhatsApp */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: '400px'
        }}
      />
      
      <div className="flex-1 w-full max-w-4xl mx-auto z-10 flex flex-col pt-4">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};

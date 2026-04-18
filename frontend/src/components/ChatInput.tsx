import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="bg-[#f0f2f5] p-2 flex items-end border-t border-gray-300 relative">
      <form onSubmit={handleSubmit} className="flex w-full items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 bg-white rounded-2xl md:rounded-3xl border border-gray-300 shadow-sm overflow-hidden flex items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            className="w-full bg-transparent px-4 py-3 outline-none resize-none max-h-32 text-[15px] text-gray-800"
            rows={1}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`p-3 rounded-full flex items-center justify-center transition-colors ${
            input.trim() && !isLoading
              ? 'bg-[#00a884] text-white hover:bg-[#008f6f]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
        </button>
      </form>
    </div>
  );
};

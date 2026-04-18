import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';
import { InlineChart } from './InlineChart';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      // In React-Markdown 10, the code component is used for both inline and block code
      const content = String(children).replace(/\n$/, '');
      
      // More robust check for chart data (AI sometimes outputs "chartData" with variations)
      const isChart = /"chart\s*Data"|'chart\s*Data'/i.test(content);
      
      if (isChart) {
        try {
          // Clean potential corruption
          let cleaned = content
            .replace(/(\d)\s+(\d)/g, '$1$2')
            .replace(/"\s+chart\s+Data\s+"/i, '"chartData"');
          
          // AI sometimes prefixes with 'json' inside the code block
          cleaned = cleaned.replace(/^json\s*/i, '').trim();
          
          // Find the actual JSON structure { ... } if there's surrounding text
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.chartData) {
              return <InlineChart symbol={parsed.symbol} data={parsed.chartData} />;
            }
          }
        } catch (e) {
          console.error('Chart Parse Error:', e, content);
        }
      }
      
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  // Pre-process: wrap any JSON block containing chartData in triple backticks if it's not already wrapped
  // This is a more aggressive catch-all for AI variations
  let processedContent = message.content;
  
  // Find all JSON blocks that contain chartData but are NOT inside backticks
  // We use a simpler regex that just looks for { ... chartData ... }
  const rawJsonRegex = /(?<!`)\s*(\{\s*[\s\S]*?['"]chart\s*Data['"][\s\S]*?\})\s*(?!`)/gi;
  processedContent = processedContent.replace(rawJsonRegex, (match, p1) => {
    return `\n\n\`\`\`json\n${p1.trim()}\n\`\`\`\n\n`;
  });

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 pb-3 shadow-sm ${
          isUser
            ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-sm'
            : 'bg-white text-gray-800 rounded-tl-sm'
        }`}
      >
        <div className="break-words text-[15px] leading-relaxed">
          {message.role === 'assistant' && message.content === '' ? (
            <div className="flex items-center h-5 pt-1 px-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          ) : (
            <ReactMarkdown components={components}>
              {processedContent}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

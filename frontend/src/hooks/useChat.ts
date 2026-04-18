import { useState, useEffect } from 'react';
import type { Message } from '../types';
import { createChatStreamUrl, sendEchoMessage } from '../services/api';

const STORAGE_KEY = 'finchat_messages';
const USE_ECHO_FOR_TEST = false; // Set to false to use the real AI

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: convert old chartData to new charts array
        return parsed.map((m: any) => {
          if (m.chartData && !m.charts) {
            return {
              ...m,
              charts: [{ symbol: 'Unknown', data: m.chartData }],
              chartData: undefined
            };
          }
          return m;
        });
      } catch (e) {
        console.error('Failed to parse cached messages', e);
      }
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! I am FinChat. How can I help you with the market today?',
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: 'assistant', content: '' },
    ]);

    try {
      if (USE_ECHO_FOR_TEST) {
        const response = await sendEchoMessage(content);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessageId
              ? { ...m, content: `Echo: ${response.echo}` }
              : m
          )
        );
      } else {
        // Build conversation history for API
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        history.push({ role: 'user', content: userMessage.content });

        const response = await fetch(createChatStreamUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let streamedContent = '';
        let buffer = '';

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            // Buffer the incoming chunks to handle 'data: ' lines cut in half
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataContent = line.slice(6).replace(/\r/g, '');
                streamedContent += dataContent;
                
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMessageId
                      ? { ...m, content: streamedContent }
                      : m
                  )
                );
              }
            }
          }
        }
        
        // Process any remaining data in the buffer
        if (buffer && buffer.startsWith('data: ')) {
          const dataContent = buffer.slice(6).replace(/\r/g, '');
          streamedContent += dataContent;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId
                ? { ...m, content: streamedContent }
                : m
            )
          );
        }

        // After streaming finishes, attempt to extract all chart JSON blocks for metadata if needed
        // but DO NOT strip them from content so they can be rendered inline
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === botMessageId) {
              const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```|(\{\s*"chartData"[\s\S]*\})/g;
              const matches = Array.from(m.content.matchAll(jsonBlockRegex));
              
              if (matches.length > 0) {
                const charts: { symbol: string; data: [number, number][] }[] = [];

                for (const match of matches) {
                  const rawJson = match[1] || match[2];
                  if (rawJson) {
                    try {
                      const cleanedJson = rawJson
                        .replace(/(\d)\s+(\d)/g, '$1$2')
                        .replace(/"\s+chart\s+Data\s+"/i, '"chartData"');
                      
                      const parsed = JSON.parse(cleanedJson);
                      if (parsed.chartData) {
                        charts.push({
                          symbol: parsed.symbol || 'Unknown',
                          data: parsed.chartData,
                        });
                      }
                    } catch (e) {
                      // Silent fail for inline parsing
                    }
                  }
                }

                return {
                  ...m,
                  charts,
                };
              }
            }
            return m;
          })
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! I am FinChat. How can I help you with the market today?',
      },
    ]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    sendMessage,
    isLoading,
    clearHistory,
  };
};

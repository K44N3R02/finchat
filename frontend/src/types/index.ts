export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  charts?: { symbol: string; data: [number, number][] }[];
}

export interface ChatRequestPayload {
  messages: { role: Role; content: string }[];
}

import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { useChat } from './hooks/useChat';
import { BarChart2, Trash2 } from 'lucide-react';

function App() {
  const { messages, sendMessage, isLoading, clearHistory } = useChat();

  return (
    <div className="flex flex-col h-screen w-full bg-[#efeae2] overflow-hidden fixed inset-0">
      {/* Header */}
      <header className="bg-[#00a884] text-white p-3 sm:px-4 flex items-center justify-between shadow-md z-20 flex-none">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full flex items-center justify-center">
            <BarChart2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-wide">FinChat</h1>
            <p className="text-xs text-white/80">AI Financial Assistant</p>
          </div>
        </div>
        <button 
          onClick={clearHistory}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Clear Chat"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent w-full">
        <ChatContainer messages={messages} />
        <div className="flex-none">
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}

export default App;

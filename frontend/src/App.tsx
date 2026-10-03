import { useState, useEffect, useRef } from 'react';
import { Database, MessageSquarePlus, PanelLeft, MessageSquare, Moon, Sun } from 'lucide-react';
import { AddContent } from './components/AddContent';
import { ItemList } from './components/ItemList';
import { QuestionBox } from './components/QuestionBox';
import { AnswerCard } from './components/AnswerCard';
import { getItems, deleteItem, queryKnowledge } from './services/api';
import type { SavedItem, ChatMessage } from './types';

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  updatedAt: number;
}

function App() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [view, setView] = useState<'chat' | 'knowledge'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_inbox_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch (e) {
        console.error('Failed to parse sessions');
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ai_inbox_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Update sessions list whenever current messages change
  useEffect(() => {
    if (messages.length === 0) return;
    
    setSessions(prev => {
      const existing = prev.find(s => s.id === currentSessionId);
      if (existing) {
        return prev.map(s => s.id === currentSessionId ? { ...s, messages, updatedAt: Date.now() } : s).sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        return [{ id: currentSessionId, messages, updatedAt: Date.now() }, ...prev].sort((a, b) => b.updatedAt - a.updatedAt);
      }
    });
  }, [messages, currentSessionId]);

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      await fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, queryLoading]);

  const handleAskQuestion = async (question: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQueryLoading(true);

    try {
      const result = await queryKnowledge(question);
      
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to query knowledge:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I encountered an error trying to process that request. Please try again.",
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setQueryLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(crypto.randomUUID());
    setMessages([]);
    setView('chat');
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setView('chat');
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-[#ededed] font-sans flex relative overflow-hidden bg-[#F5F5F7] dark:bg-[#050505] transition-colors">
      <div className="mesh-bg"></div>

      {/* Sidebar (Chat History / Navigation) */}
      <aside className={`fixed lg:relative z-40 h-screen transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-white/[0.04] bg-white/95 dark:bg-[#0a0a0b]/95 backdrop-blur-xl ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full w-64 p-3">
          <button 
            onClick={startNewChat}
            className="flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors text-sm font-medium text-gray-800 dark:text-gray-200"
          >
            <div className="w-7 h-7 rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs tracking-tighter shrink-0">
              AI
            </div>
            New Chat
            <MessageSquarePlus size={16} className="ml-auto text-gray-400 dark:text-gray-500" />
          </button>

          <div className="mt-8 flex-1 overflow-y-auto scrollbar-hide space-y-1">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 px-2 uppercase tracking-wider">Chat History</div>
            
            {sessions.length > 0 ? (
              sessions.map(session => (
                <button 
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`flex items-center gap-2 w-full px-2 py-2.5 text-sm text-left truncate rounded-md transition-colors ${currentSessionId === session.id && view === 'chat' ? 'bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}
                >
                  <MessageSquare size={14} className="shrink-0 opacity-60 dark:opacity-70" />
                  <span className="truncate">{session.messages[0]?.content || 'New Chat'}</span>
                </button>
              ))
            ) : (
              <div className="px-2 text-xs text-gray-400 dark:text-gray-600">No recent chats</div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/[0.04] flex flex-col gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-2 w-full p-2.5 rounded-lg transition-colors text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-400"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button 
              onClick={() => setView('knowledge')}
              className={`flex items-center gap-2 w-full p-2.5 rounded-lg transition-colors text-sm font-medium ${view === 'knowledge' ? 'bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-400'}`}
            >
              <Database size={16} />
              Manage Knowledge
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen w-full relative">
        <header className="sticky top-0 z-30 flex items-center p-3 h-14">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
          >
            <PanelLeft size={20} />
          </button>
          
          <div className="ml-auto flex items-center bg-gray-100 dark:bg-[#1c1c1f] rounded-lg p-1 border border-gray-200 dark:border-white/[0.04] lg:hidden">
            <button 
              onClick={() => setView('chat')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'chat' ? 'bg-white dark:bg-[#2a2a2d] text-black dark:text-white shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setView('knowledge')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'knowledge' ? 'bg-white dark:bg-[#2a2a2d] text-black dark:text-white shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Knowledge
            </button>
          </div>
        </header>

        {view === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full px-4 sm:px-6 relative pb-6">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in pb-32">
                <div className="w-12 h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg tracking-tighter mb-6 shadow-xl shadow-black/10 dark:shadow-none">
                  AI
                </div>
                <h2 className="text-3xl font-semibold tracking-tight mb-3 text-gradient">How can I help you today?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">Query your personal knowledge graph using natural language.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto w-full scrollbar-hide pt-4 pb-32 space-y-8">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full min-w-0`}>
                    {msg.role === 'user' ? (
                      <div className="bg-[#007AFF] dark:bg-[#2a2a2d] text-white dark:text-gray-100 px-5 py-3.5 rounded-3xl rounded-tr-sm max-w-[80%] text-[15px] leading-relaxed shadow-sm dark:shadow-none break-words">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full min-w-0">
                        <AnswerCard answer={msg.content} sources={msg.sources || []} />
                      </div>
                    )}
                  </div>
                ))}
                
                {queryLoading && (
                  <div className="flex justify-start w-full animate-fade-in">
                    <AnswerCard answer="" sources={[]} isLoading={true} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[#F5F5F7] dark:from-[#050505] via-[#F5F5F7] dark:via-[#050505] to-transparent">
              <QuestionBox 
                onSubmit={handleAskQuestion} 
                isLoading={queryLoading} 
              />
              <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-3 font-medium">AI can make mistakes. Verify important information.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full animate-fade-in">
            <h2 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-white">Knowledge Base</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Add Knowledge</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Ingest notes and URLs into the vector database.</p>
                </div>
                <AddContent onSuccess={fetchItems} />
              </div>
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Vector Graph</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Manage your indexed items.</p>
                </div>
                <ItemList items={items} loading={itemsLoading} onDelete={handleDelete} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

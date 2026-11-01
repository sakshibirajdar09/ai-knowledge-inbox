import { useState, useEffect, useRef } from 'react';
import { Database, MessageSquarePlus, PanelLeft, MessageSquare, Moon, Sun, X, Pencil, Copy, Check } from 'lucide-react';
import { AddContent } from './components/AddContent';
import { ItemList } from './components/ItemList';
import { QuestionBox } from './components/QuestionBox';
import { AnswerCard } from './components/AnswerCard';
import { getItems, deleteItem, queryKnowledgeStream } from './services/api';
import type { SavedItem, ChatMessage } from './types';

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  updatedAt: number;
}

function UserMessageItem({
  msg,
  isEditing,
  editInputText,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditTextChange,
}: {
  msg: ChatMessage;
  isEditing: boolean;
  editInputText: string;
  onStartEdit: (msg: ChatMessage) => void;
  onCancelEdit: () => void;
  onSaveEdit: (messageId: string) => void;
  onEditTextChange: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEditing) {
    return (
      <div className="w-full max-w-[92%] sm:max-w-[80%] bg-white dark:bg-[#1a1a1d] border border-blue-500/50 dark:border-white/20 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col gap-2.5 animate-fade-in">
        <textarea
          value={editInputText}
          onChange={(e) => onEditTextChange(e.target.value)}
          className="w-full bg-transparent text-sm sm:text-[15px] text-gray-900 dark:text-gray-100 outline-none resize-none min-h-[70px] focus:ring-0 border-none leading-relaxed p-1"
          autoFocus
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSaveEdit(msg.id);
            } else if (e.key === 'Escape') {
              onCancelEdit();
            }
          }}
        />
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSaveEdit(msg.id)}
            disabled={!editInputText.trim()}
            className="px-4 py-1.5 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col items-end max-w-[92%] sm:max-w-[80%] min-w-0">
      {/* User Message Bubble */}
      <div className="bg-[#007AFF] dark:bg-[#2a2a2d] text-white dark:text-gray-100 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl sm:rounded-3xl rounded-tr-xs text-sm sm:text-[15px] leading-relaxed shadow-sm dark:shadow-none break-words">
        {msg.content}
      </div>

      {/* ChatGPT-style Action Toolbar below the bubble */}
      <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 self-end">
        {/* Copy button with tooltip */}
        <div className="relative group/btn">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-white/[0.08] rounded-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Copy message"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
          <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/btn:flex items-center px-2 py-1 bg-gray-900 dark:bg-[#1f1f22] text-white text-[11px] font-medium rounded-md whitespace-nowrap shadow-lg border border-white/10 pointer-events-none z-20 animate-fade-in">
            {copied ? 'Copied!' : 'Copy message'}
          </div>
        </div>

        {/* Edit button with tooltip */}
        <div className="relative group/btn">
          <button
            type="button"
            onClick={() => onStartEdit(msg)}
            className="p-1.5 text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-white/[0.08] rounded-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Edit message"
          >
            <Pencil size={14} />
          </button>
          <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/btn:flex items-center px-2 py-1 bg-gray-900 dark:bg-[#1f1f22] text-white text-[11px] font-medium rounded-md whitespace-nowrap shadow-lg border border-white/10 pointer-events-none z-20 animate-fade-in">
            Edit message
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [view, setView] = useState<'chat' | 'knowledge'>('chat');
  
  // Responsive sidebar: default closed on mobile (< 1024px), open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Auto-poll items if any item is currently in background 'processing' status
  useEffect(() => {
    const hasProcessing = items.some(item => item.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const data = await getItems();
        setItems(data);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [items]);

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

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setQueryLoading(false);
    setMessages(prev => prev.map(m => {
      if (m.isLoading) {
        return {
          ...m,
          isLoading: false,
          content: m.content.trim() ? m.content : "Generation was stopped.",
        };
      }
      return m;
    }));
  };

  const executeStreamQuery = async (
    question: string,
    historyPayload: { role: 'user' | 'assistant'; content: string }[],
    aiMessageId: string
  ) => {
    // Abort previous running stream if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setQueryLoading(true);

    try {
      await queryKnowledgeStream(
        question,
        historyPayload,
        (sources) => {
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, sources } : m));
        },
        (chunk) => {
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + chunk, isLoading: false } : m));
        },
        controller.signal
      );
    } catch (error: any) {
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      console.error('Failed to query knowledge:', error);
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { 
        ...m, 
        content: m.content.trim() ? m.content : "I encountered an error trying to process that request. Please try again.", 
        isLoading: false 
      } : m));
    } finally {
      setQueryLoading(false);
      setMessages(prev => prev.map(m => {
        if (m.id === aiMessageId) {
          const finalContent = m.content.trim() 
            ? m.content 
            : (controller.signal.aborted ? "Generation was stopped." : m.content);
          return {
            ...m,
            isLoading: false,
            content: finalContent
          };
        }
        return m;
      }));
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleAskQuestion = async (question: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };
    
    const aiMessageId = crypto.randomUUID();
    const aiMessagePlaceholder: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      sources: [],
      isLoading: true
    };
    
    // Prepare prior conversation history for conversational RAG context
    const historyPayload = messages
      .filter(m => !m.isLoading && m.content.trim().length > 0)
      .slice(-4)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
    await executeStreamQuery(question, historyPayload, aiMessageId);
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditInputText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditInputText('');
  };

  const handleSaveEdit = async (messageId: string) => {
    const trimmed = editInputText.trim();
    if (!trimmed) return;

    const targetIndex = messages.findIndex(m => m.id === messageId);
    if (targetIndex === -1) return;

    // Stop current generation if active
    handleStopGeneration();

    setEditingMessageId(null);
    setEditInputText('');

    // History strictly prior to this edited message
    const priorMessages = messages.slice(0, targetIndex);
    const historyPayload = priorMessages
      .filter(m => !m.isLoading && m.content.trim().length > 0)
      .slice(-4)
      .map(m => ({ role: m.role, content: m.content }));

    const updatedUserMsg: ChatMessage = {
      ...messages[targetIndex],
      content: trimmed
    };

    const aiMessageId = crypto.randomUUID();
    const newAiPlaceholder: ChatMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      sources: [],
      isLoading: true
    };

    // Truncate following messages and insert new AI response placeholder
    setMessages([...priorMessages, updatedUserMsg, newAiPlaceholder]);

    await executeStreamQuery(trimmed, historyPayload, aiMessageId);
  };

  const startNewChat = () => {
    handleStopGeneration();
    setEditingMessageId(null);
    setEditInputText('');
    setCurrentSessionId(crypto.randomUUID());
    setMessages([]);
    setView('chat');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    // Focus the chat input box smoothly
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    }, 150);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setView('chat');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-[#ededed] font-sans flex relative overflow-hidden bg-[#F5F5F7] dark:bg-[#050505] transition-colors">
      <div className="mesh-bg"></div>

      {/* Mobile Drawer Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-xs z-40 lg:hidden transition-opacity cursor-pointer animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Chat History / Navigation) */}
      <aside className={`fixed lg:relative z-50 h-screen transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-white/[0.04] bg-white/95 dark:bg-[#0a0a0b]/95 backdrop-blur-xl shadow-2xl lg:shadow-none ${isSidebarOpen ? 'w-72 sm:w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full w-72 sm:w-64 p-3">
          <div className="flex items-center gap-1.5 w-full">
            <button 
              onClick={startNewChat}
              className="flex items-center gap-2 flex-1 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer shadow-xs border border-gray-200/60 dark:border-white/[0.05]"
              title="Start a new chat"
            >
              <div className="w-7 h-7 rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs tracking-tighter shrink-0 shadow-xs">
                AI
              </div>
              <span className="font-semibold">New Chat</span>
              <MessageSquarePlus size={16} className="ml-auto text-gray-400 dark:text-gray-500" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] cursor-pointer active:scale-95 transition-all"
              title="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto scrollbar-hide space-y-1">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-2 uppercase tracking-wider">Chat History</div>
            
            {sessions.length > 0 ? (
              sessions.map(session => (
                <button 
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`flex items-center gap-2 w-full px-2.5 py-2.5 text-sm text-left truncate rounded-lg transition-all cursor-pointer active:scale-[0.99] ${currentSessionId === session.id && view === 'chat' ? 'bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white font-medium shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}
                >
                  <MessageSquare size={14} className="shrink-0 opacity-60 dark:opacity-70" />
                  <span className="truncate">{session.messages[0]?.content || 'New Chat'}</span>
                </button>
              ))
            ) : (
              <div className="px-2 text-xs text-gray-400 dark:text-gray-600">No recent chats</div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-white/[0.04] flex flex-col gap-1.5">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-2 w-full p-2.5 rounded-lg transition-all cursor-pointer text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.04] active:scale-[0.98] text-gray-600 dark:text-gray-400"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button 
              onClick={() => { setView('knowledge'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`flex items-center gap-2 w-full p-2.5 rounded-lg transition-all cursor-pointer text-sm font-medium active:scale-[0.98] ${view === 'knowledge' ? 'bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white font-medium shadow-xs' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-600 dark:text-gray-400'}`}
            >
              <Database size={16} />
              Manage Knowledge
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen w-full relative min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between p-2.5 sm:p-3 h-14 bg-white/40 dark:bg-[#050505]/40 backdrop-blur-md border-b border-gray-200/50 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer"
              title={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
            >
              <PanelLeft size={20} />
            </button>
            <div className="flex items-center gap-1.5 lg:hidden font-semibold text-sm tracking-tight text-gray-800 dark:text-gray-200">
              <span className="w-5 h-5 rounded bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold flex items-center justify-center">AI</span>
              <span>RecallAI</span>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-100 dark:bg-[#1c1c1f] rounded-lg p-1 border border-gray-200/80 dark:border-white/[0.04] lg:hidden">
            <button 
              onClick={() => { setView('chat'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer active:scale-95 ${view === 'chat' ? 'bg-white dark:bg-[#2a2a2d] text-black dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => { setView('knowledge'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer active:scale-95 ${view === 'knowledge' ? 'bg-white dark:bg-[#2a2a2d] text-black dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Knowledge
            </button>
          </div>
        </header>

        {view === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full px-3 sm:px-6 relative pb-6">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in pb-28 px-4">
                <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg tracking-tighter mb-4 sm:mb-6 shadow-xl shadow-black/10 dark:shadow-none">
                  AI
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2 sm:mb-3 text-gradient">How can I help you today?</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md">Query your personal knowledge graph using natural language.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto w-full scrollbar-hide pt-3 sm:pt-4 pb-32 space-y-6 sm:space-y-8">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full min-w-0`}>
                    {msg.role === 'user' ? (
                      <UserMessageItem
                        msg={msg}
                        isEditing={editingMessageId === msg.id}
                        editInputText={editInputText}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={handleSaveEdit}
                        onEditTextChange={setEditInputText}
                      />
                    ) : (
                      <div className="w-full min-w-0">
                        <AnswerCard answer={msg.content} sources={msg.sources || []} isLoading={msg.isLoading} />
                      </div>
                    )}
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 bg-gradient-to-t from-[#F5F5F7] dark:from-[#050505] via-[#F5F5F7] dark:via-[#050505] to-transparent">
              <QuestionBox 
                onSubmit={handleAskQuestion} 
                onStop={handleStopGeneration}
                isLoading={queryLoading} 
              />
              <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2 sm:mt-3 font-medium">AI can make mistakes. Verify important information.</p>
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

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface QuestionBoxProps {
  onSubmit: (question: string) => void;
  onStop?: () => void;
  isLoading: boolean;
}

export const QuestionBox = ({ onSubmit, onStop, isLoading }: QuestionBoxProps) => {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    
    onSubmit(question.trim());
    setQuestion('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col items-center">
      <div className="bg-white dark:bg-[#161618] rounded-3xl p-2 relative shadow-lg shadow-black/5 dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-white/[0.04] focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-1 dark:focus-within:ring-white/20 w-full transition-all">
        <form onSubmit={handleSubmit} className="relative flex items-end min-h-[56px]">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Message AI Inbox..."
            className="w-full pl-5 pr-16 py-3.5 bg-transparent border-none text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 outline-none resize-none overflow-y-auto min-h-[52px] max-h-[180px]"
            disabled={isLoading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <div className="absolute right-2 top-2">
            {isLoading ? (
              <div className="relative group/stop flex items-center justify-center">
                <button
                  type="button"
                  onClick={onStop}
                  className="flex items-center justify-center w-9 h-9 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 transition-all cursor-pointer rounded-full outline-none shadow-sm dark:shadow-none"
                  aria-label="Stop conversation"
                >
                  <Square size={13} className="fill-current" />
                </button>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/stop:flex items-center px-2.5 py-1 bg-gray-900 dark:bg-[#1f1f22] text-white text-[11px] font-medium rounded-md whitespace-nowrap shadow-xl border border-white/10 pointer-events-none z-30 animate-fade-in">
                  Stop conversation
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!question.trim()}
                className="flex items-center justify-center w-9 h-9 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed rounded-full outline-none shadow-sm dark:shadow-none"
                title="Send message"
              >
                <ArrowUp size={18} strokeWidth={3} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

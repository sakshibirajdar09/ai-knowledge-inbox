import { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

interface QuestionBoxProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

export const QuestionBox = ({ onSubmit, isLoading }: QuestionBoxProps) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    
    onSubmit(question);
    setQuestion('');
  };

  return (
    <div className="bg-white dark:bg-[#161618] rounded-3xl p-2 relative shadow-lg shadow-black/5 dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-white/[0.04] focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-1 dark:focus-within:ring-white/20 max-w-3xl mx-auto w-full transition-all">
      <form onSubmit={handleSubmit} className="relative flex items-end min-h-[56px]">
        
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Message AI Inbox..."
          className="w-full pl-5 pr-16 py-3.5 bg-transparent border-none text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 outline-none resize-none overflow-hidden min-h-[52px] max-h-[200px]"
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
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="flex items-center justify-center w-9 h-9 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed outline-none shadow-sm dark:shadow-none"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ArrowUp size={18} strokeWidth={3} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import { useState } from 'react';
import { FileText, Link as LinkIcon, Plus, Loader2 } from 'lucide-react';
import { ingestContent } from '../services/api';

interface AddContentProps {
  onSuccess: () => void;
}

export const AddContent = ({ onSuccess }: AddContentProps) => {
  const [type, setType] = useState<'note' | 'url'>('note');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await ingestContent(type, content);
      setContent('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="surface-secondary dark:bg-[#161618] dark:border-white/[0.04] rounded-xl p-5">
      <div className="flex items-center gap-1 mb-5 bg-gray-100 dark:bg-[#0a0a0b] p-1 rounded-lg border border-gray-200 dark:border-white/[0.02] inline-flex">
        <button
          onClick={() => { setType('note'); setError(''); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            type === 'note' ? 'bg-white dark:bg-[#2a2a2d] text-black dark:text-white shadow-sm dark:shadow-none' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText size={12} /> Note
        </button>
        <button
          onClick={() => { setType('url'); setError(''); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            type === 'url' ? 'bg-white dark:bg-[#2a2a2d] text-black dark:text-white shadow-sm dark:shadow-none' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <LinkIcon size={12} /> URL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="text-red-500 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}
        
        {type === 'note' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a note to index..."
            className="w-full h-24 px-3 py-3 bg-gray-50 dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/[0.04] rounded-lg focus:border-blue-500/30 dark:focus:border-white/20 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none transition-all outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-0"
            disabled={isLoading}
          />
        ) : (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#0a0a0b] border border-gray-200 dark:border-white/[0.04] rounded-lg focus:border-blue-500/30 dark:focus:border-white/20 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-0"
            disabled={isLoading}
            required
          />
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-xs font-semibold rounded-md transition-all disabled:opacity-20 disabled:cursor-not-allowed outline-none shadow-sm dark:shadow-none"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            {isLoading ? 'Indexing...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
};

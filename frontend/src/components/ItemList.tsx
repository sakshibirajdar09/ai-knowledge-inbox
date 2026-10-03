import { FileText, Link as LinkIcon, Trash2, Clock } from 'lucide-react';
import type { SavedItem } from '../types';

interface ItemListProps {
  items: SavedItem[];
  loading: boolean;
  onDelete?: (id: string) => void;
}

export const ItemList = ({ items, loading, onDelete }: ItemListProps) => {
  if (loading) {
    return (
      <div className="surface-secondary dark:bg-[#161618] dark:border-white/[0.04] rounded-xl p-2 space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-white/[0.02] rounded-lg w-full animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="surface-secondary dark:bg-[#161618] dark:border-white/[0.04] rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.04] flex items-center justify-center mb-3">
          <FileText size={16} className="text-gray-400 dark:text-gray-600" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Knowledge base is empty</p>
        <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">Start by adding your first note or URL.</p>
      </div>
    );
  }

  return (
    <div className="surface-secondary dark:bg-[#161618] dark:border-white/[0.04] rounded-xl p-2 h-[calc(100vh-16rem)] overflow-y-auto">
      <div className="space-y-1">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 text-gray-400 dark:text-gray-500">
                {item.type === 'note' ? <FileText size={14} /> : <LinkIcon size={14} />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-900 dark:text-gray-200 truncate leading-snug">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-semibold">{item.type}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <Clock size={10} />
                    {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            
            {onDelete && (
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all outline-none"
                title="Remove item"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

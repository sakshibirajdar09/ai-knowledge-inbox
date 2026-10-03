import { FileText, ExternalLink } from 'lucide-react';
import type { Source } from '../types';

interface SourceCardProps {
  source: Source;
}

export const SourceCard = ({ source }: SourceCardProps) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <h5 className="font-medium text-sm text-gray-800 line-clamp-1" title={source.title}>
            {source.title}
          </h5>
        </div>
        
        {source.sourceUrl && (
          <a 
            href={source.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs font-medium bg-blue-50 px-2 py-1 rounded"
          >
            Open <ExternalLink size={12} />
          </a>
        )}
      </div>
      
      <div className="text-sm text-gray-600 italic bg-white p-3 rounded border border-gray-100 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 rounded-l"></div>
        <p className="line-clamp-3">"...{source.snippet}..."</p>
      </div>
      
      <div className="mt-2 text-right">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Relevance: {Math.round(source.similarity * 100)}%
        </span>
      </div>
    </div>
  );
};

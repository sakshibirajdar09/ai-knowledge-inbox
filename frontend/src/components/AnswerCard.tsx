import { Link as LinkIcon, FileText, Loader2, Sparkles, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Source } from '../types';

interface AnswerCardProps {
  answer: string;
  sources: Source[];
  isLoading?: boolean;
}

export const AnswerCard = ({ answer, sources, isLoading }: AnswerCardProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#2a2a2d] flex items-center justify-center">
            <Loader2 size={12} className="text-gray-400 animate-spin" />
          </div>
          <div className="h-4 w-32 bg-[#1c1c1f] rounded-md"></div>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-40 h-16 bg-[#161618] border border-white/[0.02] rounded-xl"></div>
          ))}
        </div>
        
        <div className="space-y-3 mt-2">
          <div className="h-3 w-full bg-[#1c1c1f] rounded-md"></div>
          <div className="h-3 w-5/6 bg-[#1c1c1f] rounded-md"></div>
          <div className="h-3 w-4/6 bg-[#1c1c1f] rounded-md"></div>
        </div>
      </div>
    );
  }

  const processCitations = (text: string) => {
    return text.replace(/\[(\d+)\]/g, '[$1](#citation-$1)');
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto animate-fade-in pb-12 min-w-0">
      {/* Answer Body */}
      <div className="flex flex-col gap-3 relative">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-1">
          <Sparkles size={14} className="text-purple-500 dark:text-purple-400" /> Synthesized Answer
        </div>
        
        <div className="prose dark:prose-invert prose-p:leading-7 prose-p:text-[15px] prose-a:text-blue-500 dark:prose-a:text-blue-400 max-w-none text-gray-800 dark:text-gray-200 typewriter-text bg-white dark:bg-[#0a0a0b] p-6 rounded-2xl border border-black/[0.05] dark:border-white/[0.04] shadow-lg shadow-black/[0.02]">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => {
                const isCitation = props.href?.startsWith('#citation-');
                if (isCitation) {
                  const id = props.href?.replace('#citation-', '');
                  return (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(`source-${id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/50', 'dark:bg-[#1a1a1c]');
                          setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/50', 'dark:bg-[#1a1a1c]'), 1500);
                        }
                      }}
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 ml-1 text-[10px] font-bold bg-gray-100 dark:bg-[#1c1c1f] border border-black/[0.05] dark:border-white/[0.1] text-blue-500 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:border-blue-200 dark:hover:border-blue-500/30 hover:text-blue-600 transition-all cursor-pointer align-middle shadow-sm relative -top-0.5"
                    >
                      {props.children}
                    </button>
                  );
                }
                return <a {...props} className="text-blue-500 dark:text-blue-400 font-medium hover:underline" />;
              }
            }}
          >
            {processCitations(answer)}
          </ReactMarkdown>
        </div>
      </div>

      {/* Sources Carousel */}
      {sources.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
            <Network size={14} className="text-blue-500 dark:text-blue-400" /> Grounded Sources
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x">
            {sources.map((source, index) => {
              const CardWrapper = source.sourceUrl ? 'a' : 'div';
              const linkProps = source.sourceUrl ? { href: source.sourceUrl, target: "_blank", rel: "noopener noreferrer" } : {};
              
              return (
                <CardWrapper 
                  {...linkProps}
                  key={index}
                  id={`source-${source.citation_id}`}
                  className="flex-shrink-0 snap-start w-52 p-3 bg-white dark:bg-[#121214] border border-black/[0.05] dark:border-white/[0.06] rounded-xl hover:border-black/[0.1] dark:hover:bg-[#1a1a1c] dark:hover:border-white/[0.12] hover:shadow-md transition-all cursor-pointer group shadow-sm flex flex-col gap-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-[0.03] dark:opacity-10 group-hover:opacity-[0.06] dark:group-hover:opacity-20 transition-opacity">
                    {source.sourceUrl ? <LinkIcon size={32} className="text-black dark:text-white" /> : <FileText size={32} className="text-black dark:text-white" />}
                  </div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-100 dark:border-blue-500/20">
                      {source.citation_id}
                    </div>
                    {source.similarity && (
                      <div className="text-[9px] font-semibold text-emerald-600 dark:text-green-400 dark:font-medium bg-emerald-50 dark:bg-green-400/10 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-none">
                        {(source.similarity * 100).toFixed(0)}% Match
                      </div>
                    )}
                  </div>
                  
                  <div className="z-10 mt-1">
                    <h4 className="text-[13px] font-semibold text-gray-900 dark:text-gray-200 line-clamp-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                      {source.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-snug">
                      {source.snippet}
                    </p>
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useId, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  Loader2, 
  Sparkles, 
  Network, 
  Copy, 
  Check, 
  StopCircle, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Maximize2, 
  X, 
  Globe 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Source } from '../types';

interface AnswerCardProps {
  answer: string;
  sources: Source[];
  isLoading?: boolean;
}

// Decode HTML entities (e.g. &quot; -> ", &#39; -> ')
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x3D;/g, '=');
}

// Extract human-readable domain from URL
function getDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Google Favicon API
function getFavicon(url?: string): string | null {
  const domain = getDomain(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export const AnswerCard = ({ answer, sources, isLoading }: AnswerCardProps) => {
  const cardId = useId().replace(/:/g, ""); // Clean ID for HTML anchors
  const [copied, setCopied] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [copiedExcerpt, setCopiedExcerpt] = useState(false);
  
  // Carousel scroll management
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = carouselRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [sources]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSource(null);
    };
    if (selectedSource) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedSource]);

  // Lock background body scroll when source modal is open
  useEffect(() => {
    if (selectedSource) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedSource]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCopyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyExcerpt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExcerpt(true);
    setTimeout(() => setCopiedExcerpt(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#2a2a2d] flex items-center justify-center">
            <Loader2 size={12} className="text-gray-400 animate-spin" />
          </div>
          <div className="h-4 w-32 bg-[#1c1c1f] rounded-md"></div>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-64 h-24 bg-[#161618] border border-white/[0.02] rounded-2xl"></div>
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

  const isStoppedBeforeAnswer = !answer || !answer.trim() || answer === "Generation was stopped.";

  const processCitations = (text: string) => {
    return text.replace(/\[(\d+)\]/g, '[$1](#citation-$1)');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto animate-fade-in pb-10 min-w-0">
      {/* 1. Answer Body */}
      <div className="flex flex-col gap-2.5 relative">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-0.5">
          <Sparkles size={14} className="text-purple-500 dark:text-purple-400" /> Synthesized Answer
        </div>
        
        {isStoppedBeforeAnswer ? (
          <div className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#0a0a0b]/80 border border-amber-500/20 dark:border-amber-500/20 text-sm text-gray-600 dark:text-gray-400 shadow-sm backdrop-blur-xs">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <StopCircle size={16} />
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm">Generation stopped</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-500">The stream was stopped before an answer was generated.</p>
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert prose-p:leading-7 prose-p:text-[15px] prose-a:text-blue-500 dark:prose-a:text-blue-400 max-w-none text-gray-800 dark:text-gray-200 typewriter-text bg-white dark:bg-[#0a0a0b] p-5 sm:p-6 rounded-2xl border border-black/[0.05] dark:border-white/[0.04] shadow-lg shadow-black/[0.02]">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => {
                  const isCitation = props.href?.startsWith('#citation-');
                  if (isCitation) {
                    const id = props.href?.replace('#citation-', '');
                    const citationNum = Number(id);
                    return (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          const targetSource = sources.find(s => s.citation_id === citationNum);
                          if (targetSource) {
                            setSelectedSource(targetSource);
                          }
                          const el = document.getElementById(`source-${cardId}-${id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                            el.classList.add('ring-2', 'ring-blue-500', 'scale-[1.02]');
                            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'scale-[1.02]'), 1800);
                          }
                        }}
                        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 ml-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-500/15 border border-blue-200/60 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/25 active:scale-95 transition-all cursor-pointer align-middle shadow-xs relative -top-0.5"
                        title={`Click to inspect Source [${id}]`}
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

            {/* Bottom action bar */}
            <div className="flex items-center justify-between pt-3 mt-4 border-t border-black/[0.04] dark:border-white/[0.04] not-prose">
              <div className="relative group/btn">
                <button
                  type="button"
                  onClick={handleCopyAnswer}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer"
                  aria-label="Copy answer"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span className="text-[11px] font-medium">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Grounded Sources Carousel */}
      {sources.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {/* Section Header with Carousel Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                <Network size={14} className="text-blue-500 dark:text-blue-400" />
                <span>Grounded Sources</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200/70 dark:bg-white/[0.08] text-gray-700 dark:text-gray-300">
                {sources.length} {sources.length === 1 ? 'citation' : 'citations'}
              </span>
            </div>

            {/* Desktop Carousel Navigation */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                disabled={!canScrollLeft}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                disabled={!canScrollRight}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Touch-Friendly Swipe Carousel */}
          <div 
            ref={carouselRef}
            className="flex overflow-x-auto gap-3 pb-2 pt-1 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-1 px-1"
          >
            {sources.map((source, index) => {
              const domain = getDomain(source.sourceUrl);
              const favicon = getFavicon(source.sourceUrl);
              const cleanSnippet = decodeHtmlEntities(source.snippet);
              const relevancePercent = source.similarity ? Math.round(source.similarity * 100) : null;

              return (
                <div
                  key={index}
                  id={`source-${cardId}-${source.citation_id}`}
                  onClick={() => setSelectedSource(source)}
                  className="flex-shrink-0 snap-start w-[84vw] sm:w-[280px] p-3.5 bg-white dark:bg-[#101012] border border-gray-200/90 dark:border-white/[0.06] hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-2xl hover:shadow-lg dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    {/* Top Row: Citation Index + Favicon/Domain + Relevance */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Citation badge */}
                        <span className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center border border-blue-200/60 dark:border-blue-500/30 shrink-0">
                          {source.citation_id}
                        </span>
                        
                        {/* Domain & Favicon */}
                        {source.sourceUrl ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            {favicon ? (
                              <img
                                src={favicon}
                                alt=""
                                className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <Globe size={13} className="text-gray-400 shrink-0" />
                            )}
                            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                              {domain}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            <FileText size={12} className="text-gray-400" />
                            <span>Saved Note</span>
                          </div>
                        )}
                      </div>

                      {/* Relevance match score */}
                      {relevancePercent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
                          {relevancePercent}% Match
                        </span>
                      )}
                    </div>

                    {/* Source Title */}
                    <h4 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5">
                      {source.title || 'Untitled Source'}
                    </h4>

                    {/* Excerpt Snippet with decoded HTML */}
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      "{cleanSnippet}"
                    </p>
                  </div>

                  {/* Card Bottom Action Bar */}
                  <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-gray-100 dark:border-white/[0.05] text-[11px]">
                    <span className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1 font-medium">
                      <Maximize2 size={11} /> View source text
                    </span>
                    {source.sourceUrl && (
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                        title="Visit external webpage"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Source Inspector Modal / Drawer */}
      {selectedSource && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 dark:bg-black/85 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedSource(null)}
        >
          <div 
            className="bg-white dark:bg-[#141416] w-full max-w-xl rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-8 sm:pb-6 shadow-2xl border border-gray-200 dark:border-white/10 max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Handle */}
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center border border-blue-200 dark:border-blue-500/30 shrink-0">
                  {selectedSource.citation_id}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {selectedSource.title || 'Source Reference'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedSource.sourceUrl ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                        <Globe size={11} className="shrink-0" /> {getDomain(selectedSource.sourceUrl)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FileText size={11} className="shrink-0" /> Personal Note
                      </span>
                    )}
                    {selectedSource.similarity && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                        {Math.round(selectedSource.similarity * 100)}% Relevance
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Full Chunk Content */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                <span>Retrieved Source Text (Chunk Proof):</span>
                <span className="text-[10px] lowercase font-normal text-gray-400 dark:text-gray-500 hidden sm:inline">grounding proof</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1a1a1d] border border-gray-200/60 dark:border-white/[0.06] text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans select-text">
                "{decodeHtmlEntities(selectedSource.snippet)}"
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyExcerpt(decodeHtmlEntities(selectedSource.snippet))}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copiedExcerpt ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedExcerpt ? 'Copied' : 'Copy Source Text'}</span>
              </button>

              {selectedSource.sourceUrl && (
                <a
                  href={selectedSource.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 text-xs font-semibold bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Visit Webpage</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

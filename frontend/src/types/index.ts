export type ItemType = 'note' | 'url';

export interface SavedItem {
  id: string;
  type: ItemType;
  title: string;
  sourceUrl?: string;
  createdAt: string;
}

export interface Source {
  citation_id: number;
  itemId: string;
  title: string;
  snippet: string;
  similarity: number;
  sourceUrl?: string;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  isLoading?: boolean;
}

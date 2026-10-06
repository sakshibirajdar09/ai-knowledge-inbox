import type { SavedItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getItems = async (): Promise<SavedItem[]> => {
  const response = await fetch(`${API_URL}/items`);
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }
  return response.json();
};

export const getItemById = async (id: string): Promise<SavedItem & { rawContent: string }> => {
  const response = await fetch(`${API_URL}/items/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch item details');
  }
  return response.json();
};

export const ingestContent = async (type: 'note' | 'url', content: string, title?: string) => {
  const response = await fetch(`${API_URL}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, content, title }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to ingest content');
  }
  
  return response.json();
};

export const queryKnowledgeStream = async (
  question: string,
  onSources: (sources: any[]) => void,
  onAnswerChunk: (text: string) => void
): Promise<void> => {
  const response = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to query knowledge');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader available');
  
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') return;
        
        try {
          const data = JSON.parse(dataStr);
          if (data.type === 'sources') {
            onSources(data.sources);
          } else if (data.type === 'answer') {
            onAnswerChunk(data.text);
          }
        } catch (e) {
          console.error("Error parsing SSE JSON", e, dataStr);
        }
      }
    }
  }
};

export const deleteItem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to delete item');
  }
};

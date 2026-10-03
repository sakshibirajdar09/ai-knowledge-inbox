import type { SavedItem, QueryResponse } from '../types';

const API_URL = 'http://localhost:3000';

export const getItems = async (): Promise<SavedItem[]> => {
  const response = await fetch(`${API_URL}/items`);
  if (!response.ok) {
    throw new Error('Failed to fetch items');
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

export const queryKnowledge = async (question: string): Promise<QueryResponse> => {
  const response = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to query knowledge');
  }
  
  return response.json();
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

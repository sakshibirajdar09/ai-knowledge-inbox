import { db } from '../db/database';

export interface Item {
  id: string;
  type: 'note' | 'url';
  title: string;
  source_url?: string;
  raw_content: string;
  created_at?: string;
}

export interface Chunk {
  id: string;
  item_id: string;
  content: string;
  embedding: string; // JSON string array
  chunk_index: number;
  created_at?: string;
}

export const knowledgeRepository = {
  insertItem: (item: Item): Promise<void> => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        'INSERT INTO items (id, type, title, source_url, raw_content) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(
        [item.id, item.type, item.title, item.source_url || null, item.raw_content],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getAllItems: (): Promise<Omit<Item, 'raw_content'>[]> => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, type, title, source_url, created_at FROM items ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as any);
        }
      );
    });
  },

  deleteItem: (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('DELETE FROM items WHERE id = ?');
      stmt.run([id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  insertChunk: (chunk: Chunk): Promise<void> => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(
        'INSERT INTO chunks (id, item_id, content, embedding, chunk_index) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(
        [chunk.id, chunk.item_id, chunk.content, chunk.embedding, chunk.chunk_index],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  getAllChunks: (): Promise<Chunk[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM chunks', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as any);
      });
    });
  },
};

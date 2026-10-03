import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'knowledge.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Error connecting to database', err);
  } else {
    logger.info('Connected to SQLite database');
    initDb();
  }
});

const initDb = () => {
  const itemsTable = `
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      source_url TEXT,
      raw_content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const chunksTable = `
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding TEXT,
      chunk_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
    )
  `;

  db.serialize(() => {
    db.run(itemsTable, (err) => {
      if (err) logger.error('Error creating items table', err);
    });
    db.run(chunksTable, (err) => {
      if (err) logger.error('Error creating chunks table', err);
    });
  });
};

import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

from app.config import DATABASE_PATH
from app.utils.logger import logger

def get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DATABASE_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    logger.info(f"Initializing database at: {DATABASE_PATH}")
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                source_url TEXT,
                raw_content TEXT NOT NULL,
                status TEXT DEFAULT 'completed',
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                item_id TEXT NOT NULL,
                content TEXT NOT NULL,
                embedding TEXT,
                chunk_index INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
            )
        """)
        
        # Zero-downtime migration for existing databases: check for new columns
        cursor = conn.execute("PRAGMA table_info(items)")
        existing_cols = [row["name"] for row in cursor.fetchall()]
        if "status" not in existing_cols:
            logger.info("Migrating database: adding 'status' column to items table.")
            conn.execute("ALTER TABLE items ADD COLUMN status TEXT DEFAULT 'completed'")
        if "error_message" not in existing_cols:
            logger.info("Migrating database: adding 'error_message' column to items table.")
            conn.execute("ALTER TABLE items ADD COLUMN error_message TEXT")

    logger.info("Database initialized successfully.")

def insert_item(
    item_id: str, 
    item_type: str, 
    title: str, 
    source_url: Optional[str], 
    raw_content: str,
    status: str = "completed",
    error_message: Optional[str] = None
):
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO items (id, type, title, source_url, raw_content, status, error_message) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (item_id, item_type, title, source_url, raw_content, status, error_message)
        )

def update_item_status(item_id: str, status: str, error_message: Optional[str] = None):
    with get_db() as conn:
        conn.execute(
            "UPDATE items SET status = ?, error_message = ? WHERE id = ?",
            (status, error_message, item_id)
        )

def update_item_content_and_status(
    item_id: str, 
    title: str, 
    raw_content: str, 
    status: str = "completed",
    error_message: Optional[str] = None
):
    with get_db() as conn:
        conn.execute(
            """
            UPDATE items 
            SET title = ?, raw_content = ?, status = ?, error_message = ?
            WHERE id = ?
            """,
            (title, raw_content, status, error_message, item_id)
        )

def get_all_items() -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT id, type, title, source_url, status, error_message, created_at 
            FROM items 
            ORDER BY created_at DESC
            """
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_item_by_id(item_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def delete_item(item_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))

def insert_chunk(chunk_id: str, item_id: str, content: str, embedding: List[float], chunk_index: int):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO chunks (id, item_id, content, embedding, chunk_index) VALUES (?, ?, ?, ?, ?)",
            (chunk_id, item_id, content, json.dumps(embedding), chunk_index)
        )

def bulk_insert_chunks(chunks: List[Dict[str, Any]]):
    """Inserts multiple chunks in a single atomic SQL transaction for maximum speed."""
    if not chunks:
        return
    with get_db() as conn:
        conn.executemany(
            "INSERT INTO chunks (id, item_id, content, embedding, chunk_index) VALUES (?, ?, ?, ?, ?)",
            [
                (c["id"], c["item_id"], c["content"], json.dumps(c["embedding"]), c["chunk_index"])
                for c in chunks
            ]
        )

def get_all_chunks(only_completed: bool = True) -> List[Dict[str, Any]]:
    with get_db() as conn:
        if only_completed:
            cursor = conn.execute("""
                SELECT c.id, c.item_id, c.content, c.embedding, c.chunk_index, c.created_at
                FROM chunks c
                JOIN items i ON c.item_id = i.id
                WHERE i.status = 'completed'
            """)
        else:
            cursor = conn.execute("SELECT id, item_id, content, embedding, chunk_index, created_at FROM chunks")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

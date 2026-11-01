import uuid
from typing import Optional

from app.db.database import (
    insert_item, 
    bulk_insert_chunks, 
    update_item_status, 
    update_item_content_and_status
)
from app.services.chunking_service import chunk_text
from app.services.embedding_service import generate_embeddings_concurrent
from app.services.url_service import fetch_url_content
from app.utils.logger import logger

def create_initial_item(item_id: str, item_type: str, content: str, title: Optional[str] = None) -> str:
    """
    Immediately records an item in the database with status='processing'
    so the user gets a fast sub-15ms response.
    """
    if item_type == "note":
        display_title = title if (title and title.strip()) else (
            f"{content[:30]}..." if len(content) > 30 else content
        )
        insert_item(
            item_id=item_id,
            item_type="note",
            title=display_title,
            source_url=None,
            raw_content=content,
            status="processing"
        )
    else:
        # For URL, title will be populated once scraped
        display_title = title if (title and title.strip()) else content
        insert_item(
            item_id=item_id,
            item_type="url",
            title=display_title,
            source_url=content,
            raw_content="",
            status="processing"
        )
    
    logger.info(f"Created pending item {item_id} (type: {item_type})")
    return item_id

async def process_ingestion_background(item_id: str, item_type: str, content: str, title: Optional[str] = None):
    """
    Asynchronous background job:
    1. Scrapes web content (if URL).
    2. Chunks the text with overlap.
    3. Calls Gemini Batch Embedding concurrently.
    4. Bulk-inserts chunks in a single atomic SQL transaction.
    5. Sets status='completed' (or 'failed' on error).
    """
    try:
        final_title = title
        if item_type == "url":
            try:
                scraped_title, text = await fetch_url_content(content)
                final_title = title if (title and title.strip()) else scraped_title
            except Exception as scrape_err:
                logger.error(f"Scraping failed for item {item_id}: {scrape_err}")
                update_item_status(item_id, status="failed", error_message=f"Scraping failed: {scrape_err}")
                return
        else:
            text = content
            if not final_title or not final_title.strip():
                final_title = content[:30] + "..." if len(content) > 30 else content

        chunks = chunk_text(text)
        if not chunks:
            logger.warn(f"No chunks extracted for item {item_id}")
            update_item_status(item_id, status="failed", error_message="No readable text found to index")
            return

        logger.info(f"Generating embeddings for {len(chunks)} chunks concurrently for item {item_id}...")
        embeddings = await generate_embeddings_concurrent(chunks, max_concurrency=8)

        # Prepare chunks for bulk insertion
        chunks_data = [
            {
                "id": str(uuid.uuid4()),
                "item_id": item_id,
                "content": chunks[i],
                "embedding": embeddings[i],
                "chunk_index": i
            }
            for i in range(len(chunks))
        ]

        bulk_insert_chunks(chunks_data)
        update_item_content_and_status(
            item_id=item_id,
            title=final_title,
            raw_content=text,
            status="completed"
        )
        logger.info(f"✅ Successfully finished background ingestion for {item_id} with {len(chunks)} chunks.")

    except Exception as e:
        logger.error(f"❌ Background ingestion error for item {item_id}: {str(e)}", exc_info=e)
        update_item_status(item_id, status="failed", error_message=str(e))

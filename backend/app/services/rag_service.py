from typing import Tuple, List, Dict, Any, Optional, AsyncGenerator

from app.services.embedding_service import generate_embedding
from app.services.vector_service import search_similar_chunks
from app.services.llm_service import generate_answer_stream, contextualize_query
from app.db.database import get_all_items
from app.config import TOP_K_CHUNKS, SIMILARITY_THRESHOLD
from app.utils.logger import logger

async def query_knowledge(
    question: str, 
    history: Optional[List[Any]] = None
) -> Tuple[List[Dict[str, Any]], Optional[AsyncGenerator[str, None]]]:
    """
    RAG Pipeline:
    1. Contextualizes the question using prior conversation history (resolving pronouns).
    2. Embeds the reformulated search query.
    3. Searches similar chunks via cosine similarity >= threshold.
    4. Formats context with source IDs.
    5. Streams answer from Gemini LLM with citation instructions.
    """
    try:
        # 1. Contextualize question if history exists
        search_query = await contextualize_query(question, history)

        # 2. Generate embedding for the contextualized search query
        query_embedding = generate_embedding(search_query)

        # 3. Search for relevant chunks
        top_chunks = search_similar_chunks(
            query_embedding=query_embedding,
            limit=TOP_K_CHUNKS,
            threshold=SIMILARITY_THRESHOLD
        )

        if not top_chunks:
            return [], None

        # 4. Fetch item metadata for source titles and URLs
        all_items = get_all_items()
        item_map = {item["id"]: item for item in all_items}

        # 5. Build context and format sources
        sources: List[Dict[str, Any]] = []
        for index, match in enumerate(top_chunks):
            chunk = match["chunk"]
            item = item_map.get(chunk["item_id"], {})
            sources.append({
                "citation_id": index + 1,
                "itemId": chunk["item_id"],
                "title": item.get("title", "Unknown Source"),
                "snippet": chunk["content"],
                "similarity": match["similarity"],
                "sourceUrl": item.get("source_url")
            })

        context = "\n\n".join(
            f"[Source {s['citation_id']}: {s['title']}]\n{s['snippet']}"
            for s in sources
        )

        # 6. Query LLM generator with history continuity
        stream = generate_answer_stream(question, context, history)

        return sources, stream

    except Exception as e:
        logger.error(f"Failed to query knowledge: {str(e)}")
        raise e

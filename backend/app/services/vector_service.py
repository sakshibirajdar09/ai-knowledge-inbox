import json
from typing import List, Dict, Any, Tuple
import numpy as np

from app.db.database import get_all_chunks
from app.config import SIMILARITY_THRESHOLD, TOP_K_CHUNKS
from app.utils.logger import logger

def search_similar_chunks(
    query_embedding: List[float],
    limit: int = TOP_K_CHUNKS,
    threshold: float = SIMILARITY_THRESHOLD
) -> List[Dict[str, Any]]:
    """
    Computes cosine similarity between the query embedding and all stored chunks.
    Filters by similarity >= threshold, sorts descending, and returns top K.
    """
    try:
        all_chunks = get_all_chunks()
        if not all_chunks:
            return []

        query_vec = np.array(query_embedding, dtype=np.float32)
        query_norm = np.linalg.norm(query_vec)
        if query_norm == 0:
            return []

        # Parse chunk embeddings and calculate similarity
        results: List[Dict[str, Any]] = []

        chunk_vectors = []
        valid_chunks = []

        for chunk in all_chunks:
            if not chunk.get("embedding"):
                continue
            try:
                emb = json.loads(chunk["embedding"])
                if len(emb) == len(query_embedding):
                    chunk_vectors.append(emb)
                    valid_chunks.append(chunk)
            except Exception as e:
                logger.warn(f"Failed to parse embedding for chunk {chunk.get('id')}: {e}")

        if not chunk_vectors:
            return []

        # Vectorized cosine similarity
        matrix = np.array(chunk_vectors, dtype=np.float32)
        chunk_norms = np.linalg.norm(matrix, axis=1)
        
        # Avoid division by zero
        denominators = query_norm * chunk_norms
        zero_mask = denominators == 0
        denominators[zero_mask] = 1e-10

        similarities = np.dot(matrix, query_vec) / denominators
        similarities[zero_mask] = 0.0

        for i, chunk in enumerate(valid_chunks):
            sim = float(similarities[i])
            if sim >= threshold:
                results.append({
                    "chunk": chunk,
                    "similarity": round(sim, 4)
                })

        # Sort descending by similarity
        results.sort(key=lambda x: x["similarity"], reverse=True)

        return results[:limit]

    except Exception as e:
        logger.error(f"Error during vector search: {str(e)}")
        raise e

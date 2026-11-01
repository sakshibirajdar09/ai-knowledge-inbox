import asyncio
from typing import List, Tuple
from google import genai
from app.config import GEMINI_API_KEY
from app.utils.logger import logger
from app.utils.errors import AppException

_client = None

def get_genai_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise AppException(500, "CONFIG_ERROR", "GEMINI_API_KEY is not defined in environment variables.")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client

def generate_embedding(text: str) -> List[float]:
    """
    Generates a dense vector embedding synchronously (used for query questions).
    """
    try:
        client = get_genai_client()
        response = client.models.embed_content(
            model="gemini-embedding-2",
            contents=text
        )
        if not response.embeddings or not response.embeddings[0].values:
            raise Exception("No embedding values returned by Gemini API")
        return response.embeddings[0].values
    except AppException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate embedding via Gemini: {str(e)}")
        raise AppException(500, "EMBEDDING_FAILED", f"Embedding generation failed: {str(e)}")

async def generate_embeddings_concurrent(
    texts: List[str], 
    max_concurrency: int = 8
) -> List[List[float]]:
    """
    Generates dense vector embeddings for a list of chunks concurrently using
    asyncio throttling and exponential backoff retry.
    """
    if not texts:
        return []

    client = get_genai_client()
    sem = asyncio.Semaphore(max_concurrency)

    async def embed_single_with_retry(text: str, index: int) -> Tuple[int, List[float]]:
        async with sem:
            max_retries = 3
            backoff = 1.0
            last_err = None
            for attempt in range(max_retries):
                try:
                    response = await client.aio.models.embed_content(
                        model="gemini-embedding-2",
                        contents=text
                    )
                    if response.embeddings and response.embeddings[0].values:
                        return index, response.embeddings[0].values
                    raise Exception("No embedding values returned")
                except Exception as e:
                    last_err = e
                    if attempt < max_retries - 1:
                        logger.warn(f"Embedding retry {attempt + 1}/{max_retries} for chunk {index}: {str(e)}")
                        await asyncio.sleep(backoff)
                        backoff *= 2
            logger.error(f"Failed to embed chunk {index} after {max_retries} attempts: {last_err}")
            raise AppException(500, "EMBEDDING_FAILED", f"Embedding failed for chunk {index}: {last_err}")

    tasks = [embed_single_with_retry(text, idx) for idx, text in enumerate(texts)]
    indexed_results = await asyncio.gather(*tasks)

    # Sort back by original chunk order
    indexed_results.sort(key=lambda x: x[0])
    return [vec for _, vec in indexed_results]

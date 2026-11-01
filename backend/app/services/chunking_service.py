from typing import List
from app.config import DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP

def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP
) -> List[str]:
    """
    Splits text into chunks of specified character size with overlap,
    respecting word boundaries whenever possible.
    """
    if not text or not text.strip():
        return []

    chunks: List[str] = []
    i = 0
    text_len = len(text)

    while i < text_len:
        end = i + chunk_size

        # Avoid cutting words in half if possible
        if end < text_len:
            last_space = text.rfind(" ", i, end)
            if last_space > i:
                end = last_space

        chunk = text[i:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_len:
            break

        # Move forward by end minus overlap
        next_i = end - overlap
        if next_i <= i:
            next_i = end

        i = next_i

    return chunks

import asyncio
from typing import AsyncGenerator, List, Optional, Any
from google.genai import types

from app.services.embedding_service import get_genai_client
from app.utils.logger import logger
from app.utils.errors import AppException

MODELS_TO_TRY = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-flash-latest"
]

async def contextualize_query(question: str, history: Optional[List[Any]] = None) -> str:
    """
    If there is prior conversation history, reformulates the follow-up question
    into a self-contained search query resolving pronouns (e.g. 'it', 'they', 'this').
    If no history or standalone, returns the original question.
    """
    if not history or len(history) == 0:
        return question

    try:
        client = get_genai_client()
        recent = history[-4:]
        history_formatted = "\n".join([f"{h.role.capitalize()}: {h.content}" for h in recent])

        prompt = f"""Given this conversation history and a follow-up question, rewrite the follow-up question into a single, standalone search query by replacing pronouns (it, they, this, that, etc.) with the explicit subject.
If the question is already standalone, return it as is. Do NOT add prefixes like 'Standalone:'. Return ONLY the rewritten question.

Conversation:
{history_formatted}

Follow-up: {question}"""

        response = None
        for model in ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"]:
            try:
                response = await client.aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.0,
                        thinking_config=types.ThinkingConfig(thinking_budget=0)
                    )
                )
                if response and response.text:
                    break
            except Exception as e:
                logger.warn(f"Model {model} failed during contextualization: {e}")
                continue

        if response and response.text:
            rephrased = response.text.strip()
            # Strip any accidental prefix
            if rephrased.lower().startswith("standalone:"):
                rephrased = rephrased[11:].strip()

            logger.info(f"Query Contextualization: '{question}' -> '{rephrased}'")
            return rephrased if len(rephrased) > 2 else question
        return question

    except Exception as e:
        logger.warn(f"Failed to contextualize query, falling back to original: {e}")
        return question

async def generate_answer_stream(
    question: str, 
    context: str, 
    history: Optional[List[Any]] = None
) -> AsyncGenerator[str, None]:
    """
    Calls Gemini generative model with fallback chain, yielding answer text tokens as they stream.
    Includes both retrieved context and conversation history.
    """
    history_section = ""
    if history and len(history) > 0:
        recent = history[-4:]
        formatted_history = "\n".join([f"{h.role.capitalize()}: {h.content}" for h in recent])
        history_section = f"""
Recent Conversation:
----------------
{formatted_history}
----------------
"""

    system_prompt = f"""You are an assistant answering questions using the user's saved knowledge.
Use the provided context to answer the question.
If the answer cannot be found in the context, clearly say that the saved knowledge does not contain enough information.
Do not invent facts.

CRITICAL INSTRUCTION: You MUST cite your sources inline using bracketed notation mapped to the source IDs provided in the context (e.g., "This is a fact [1]." or "Another fact [2][3].").
Format answers using clean markdown (bold emphasis, bulleted lists, code styling).

Context:
----------------
{context}
----------------
{history_section}
"""
    client = get_genai_client()

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            logger.info(f"Attempting to generate answer stream with {model_name}")
            
            stream = await client.aio.models.generate_content_stream(
                model=model_name,
                contents=question,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.2
                )
            )

            async for chunk in stream:
                if chunk.text:
                    yield chunk.text

            return  # Successfully finished streaming

        except Exception as e:
            last_error = e
            logger.warn(f"Failed with model {model_name}: {str(e)}")
            await asyncio.sleep(0.2)

    logger.error(f"All models in fallback chain failed: {last_error}")
    raise AppException(500, "AI_ENGINE_ERROR", f"AI Engine Error: {str(last_error)}")

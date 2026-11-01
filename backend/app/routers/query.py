import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.schemas import QueryRequest
from app.services.rag_service import query_knowledge
from app.utils.errors import AppException
from app.utils.logger import logger

router = APIRouter(prefix="/query", tags=["Query"])

@router.post("")
async def handle_query(payload: QueryRequest):
    question = payload.question.strip()
    if not question:
        raise AppException(400, "INVALID_REQUEST", "Question cannot be empty")
    if len(question) > 500:
        raise AppException(400, "INVALID_REQUEST", "Question is too long")

    sources, stream = await query_knowledge(question, history=payload.history)

    async def event_generator():
        # 1. Send sources immediately as first event
        sources_payload = json.dumps({"type": "sources", "sources": sources})
        yield f"data: {sources_payload}\n\n"

        if not stream:
            refusal_text = "The saved knowledge does not contain enough information to answer this question."
            refusal_payload = json.dumps({"type": "answer", "text": refusal_text})
            yield f"data: {refusal_payload}\n\n"
            yield "data: [DONE]\n\n"
            return

        # 2. Stream tokens from LLM
        try:
            async for token in stream:
                token_payload = json.dumps({"type": "answer", "text": token})
                yield f"data: {token_payload}\n\n"
        except Exception as err:
            logger.error(f"Error during SSE answer streaming: {err}")
            error_payload = json.dumps({"type": "error", "text": "\n\n[Error streaming answer]"})
            yield f"data: {error_payload}\n\n"

        # 3. Final event
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

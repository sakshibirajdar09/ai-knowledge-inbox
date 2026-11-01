import uuid
from fastapi import APIRouter, status, BackgroundTasks
from app.models.schemas import IngestRequest, IngestResponse
from app.services.ingestion_service import create_initial_item, process_ingestion_background
from app.utils.errors import AppException
from app.utils.logger import logger

router = APIRouter(prefix="/ingest", tags=["Ingest"])

@router.post("", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def handle_ingest(payload: IngestRequest, background_tasks: BackgroundTasks):
    if not payload.content or not payload.content.strip():
        raise AppException(400, "INVALID_REQUEST", "Type and content are required")

    if payload.type not in ("note", "url"):
        raise AppException(400, "INVALID_TYPE", "Type must be note or url")

    item_id = str(uuid.uuid4())
    
    # 1. Immediately create pending record in database
    create_initial_item(
        item_id=item_id,
        item_type=payload.type,
        content=payload.content,
        title=payload.title
    )

    # 2. Dispatch heavy scraping, chunking, and batch embedding to background
    background_tasks.add_task(
        process_ingestion_background,
        item_id=item_id,
        item_type=payload.type,
        content=payload.content,
        title=payload.title
    )

    # 3. Return immediate 202 Accepted response (sub-15ms)
    logger.info(f"Dispatched async ingestion for item {item_id}")
    return IngestResponse(
        id=item_id,
        type=payload.type,
        status="processing",
        message="Content accepted for processing"
    )

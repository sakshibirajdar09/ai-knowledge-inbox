from typing import List
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.schemas import SavedItemResponse, ItemDetailResponse, SuccessMessage
from app.db.database import get_all_items, get_item_by_id, delete_item
from app.utils.errors import AppException

router = APIRouter(prefix="/items", tags=["Items"])

@router.get("", response_model=List[SavedItemResponse])
async def list_items():
    items = get_all_items()
    return [
        SavedItemResponse(
            id=item["id"],
            type=item["type"],
            title=item["title"],
            sourceUrl=item.get("source_url"),
            status=item.get("status", "completed"),
            errorMessage=item.get("error_message"),
            createdAt=item.get("created_at")
        )
        for item in items
    ]

@router.get("/{item_id}")
async def get_item(item_id: str):
    item = get_item_by_id(item_id)
    if not item:
        return JSONResponse(status_code=404, content={"message": "Item not found"})

    return ItemDetailResponse(
        id=item["id"],
        type=item["type"],
        title=item["title"],
        sourceUrl=item.get("source_url"),
        rawContent=item["raw_content"],
        status=item.get("status", "completed"),
        errorMessage=item.get("error_message"),
        createdAt=item.get("created_at")
    )

@router.delete("/{item_id}", response_model=SuccessMessage)
async def remove_item(item_id: str):
    delete_item(item_id)
    return SuccessMessage(message="Item deleted successfully")

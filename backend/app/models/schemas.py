from typing import Optional, List, Literal
from pydantic import BaseModel, Field

class IngestRequest(BaseModel):
    type: Literal["note", "url"]
    content: str
    title: Optional[str] = None

class IngestResponse(BaseModel):
    id: str
    type: str
    status: str = "processing"
    message: str = "Content accepted for processing"

class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    history: Optional[List[ChatHistoryMessage]] = None

class SourceItem(BaseModel):
    citation_id: int
    itemId: str
    title: str
    snippet: str
    similarity: float
    sourceUrl: Optional[str] = None

class SavedItemResponse(BaseModel):
    id: str
    type: str
    title: str
    sourceUrl: Optional[str] = None
    status: Optional[str] = "completed"
    errorMessage: Optional[str] = None
    createdAt: Optional[str] = None

class ItemDetailResponse(BaseModel):
    id: str
    type: str
    title: str
    sourceUrl: Optional[str] = None
    rawContent: str
    status: Optional[str] = "completed"
    errorMessage: Optional[str] = None
    createdAt: Optional[str] = None

class SuccessMessage(BaseModel):
    message: str

from datetime import datetime
from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)


class DocumentResponse(BaseModel):
    id: int
    title: str
    word_count: int
    char_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchedPassage(BaseModel):
    query_start: int
    query_end: int
    query_text: str
    source_start: int
    source_end: int
    source_text: str


class DocumentMatch(BaseModel):
    document_id: int
    document_title: str
    similarity: float
    matched_passages: list[MatchedPassage]


class CheckRequest(BaseModel):
    text: str = Field(..., min_length=1)


class CheckResponse(BaseModel):
    word_count: int
    highest_similarity: float
    verdict: str  # "original" | "suspicious" | "plagiarized"
    matches: list[DocumentMatch]

from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class DocumentRecord(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    filename: str
    doc_type: str  # "question_paper" or "answer_sheet"
    status: str    # "processing", "completed", "failed"
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # This stores the final parsed JSON structure
    parsed_result: Optional[List[Any]] = None
    
    # Store raw text for debugging regex
    raw_text_pages: List[str] = []

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
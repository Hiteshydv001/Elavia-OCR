from pydantic import BaseModel
from typing import List, Optional

class SubAnswer(BaseModel):
    label: str          # e.g., "i", "ii"
    text: str           # e.g., "Based on the reading..."

class QuestionData(BaseModel):
    q_no: str           # e.g., "1", "6"
    text: Optional[str] = None
    subparts: List[SubAnswer] = []

class OCRResult(BaseModel):
    doc_type: str       # "question_paper" or "answer_sheet"
    raw_text: str
    parsed_data: List[QuestionData]
    accuracy_warning: bool # True if handwriting is detected
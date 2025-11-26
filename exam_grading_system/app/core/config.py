import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Exam Grading OCR"
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = "grading_db"
    
    # AWS Credentials for Textract (optional, now using Gemini)
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = "us-east-1"

    # Gemini API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # OpenRouter API Key for Qwen
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # Tesseract Command Path
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")

    UPLOAD_DIR: str = os.path.join(os.getcwd(), "uploads")
    PDF_DIR: str = os.path.join(os.getcwd(), "pdf")
    ANSWER_SHEET_FILES: List[str] = ["eng_1.pdf"]
    RESULTS_DIR: str = os.path.join(os.getcwd(), "results")

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.PDF_DIR, exist_ok=True)
os.makedirs(settings.RESULTS_DIR, exist_ok=True)
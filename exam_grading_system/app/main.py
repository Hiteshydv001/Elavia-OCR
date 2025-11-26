from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.routes import router
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.config import settings
import os

app = FastAPI(title="Exam Grading OCR System")

# Event Handlers for Database
app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

# Include API Routes
app.include_router(router, prefix="/api")

# --- NEW: Serve Static Files (Frontend) ---

# 1. Mount the static directory to serve CSS/JS
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/pdfs", StaticFiles(directory=settings.PDF_DIR), name="pdfs")
app.mount("/results", StaticFiles(directory=settings.RESULTS_DIR), name="results")

# 2. Serve index.html at the root URL
@app.get("/")
async def read_index():
    return FileResponse(os.path.join("static", "index.html"))
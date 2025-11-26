import json
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
import fitz
from PIL import Image
import io
from bson import ObjectId
import re

from app.core.config import settings
from app.core.database import get_database
from app.services.ocr_service import OCRService
from app.services.tesseract_service import TesseractService
from app.services.paddle_service import PaddleService
from app.services.qwen_service import QwenService
from app.services.surya_service import SuryaService
from app.services.image_processing import preprocess_handwriting
from app.services.parser_service import parse_question_paper, parse_answer_sheet

router = APIRouter()


def _collect_pdf_entries():
    """Collect and categorize PDF files from the PDF directory."""
    pdf_dir = settings.PDF_DIR
    answer_lookup = {name.lower() for name in settings.ANSWER_SHEET_FILES}
    question_files = []
    answer_files = []

    if os.path.isdir(pdf_dir):
        for name in sorted(os.listdir(pdf_dir)):
            if not name.lower().endswith(".pdf"):
                continue

            entry = {
                "name": name,
                "url": f"/pdfs/{name}"
            }

            if name.lower() in answer_lookup:
                answer_files.append(entry)
            else:
                question_files.append(entry)

    return question_files, answer_files


def _save_result_to_file(doc_id: str, payload: dict):
    """Persist OCR result to a JSON file in the results directory with meaningful name."""
    # Fix timestamp to local timezone
    payload.setdefault("doc_id", doc_id)
    now = datetime.now().astimezone()
    # Use ISO 8601 with timezone so the frontend can reliably parse local time
    payload.setdefault("timestamp", now.isoformat())
    
    # Generate filename from extracted text or use doc_id
    file_name = f"{doc_id}.json"
    
    # Try to extract meaningful name from parsed result or filename
    if "parsed_result" in payload and payload["parsed_result"]:
        try:
            # Get first question or text snippet
            if isinstance(payload["parsed_result"], list) and len(payload["parsed_result"]) > 0:
                first_item = payload["parsed_result"][0]
                if isinstance(first_item, dict) and "text" in first_item:
                    text = first_item["text"][:30]  # First 30 chars
                    # Sanitize filename
                    safe_name = re.sub(r'[<>:"/\\|?*]', '', text).strip()
                    if safe_name:
                        file_name = f"{safe_name}_{now.strftime('%Y%m%d_%H%M%S')}.json"
        except Exception as e:
            print(f"Could not generate name from content: {e}")
    
    # Fallback to filename if provided
    if file_name == f"{doc_id}.json" and "filename" in payload:
        try:
            base_name = os.path.splitext(payload["filename"])[0][:30]
            safe_name = re.sub(r'[<>:"/\\|?*]', '', base_name).strip()
            if safe_name:
                file_name = f"{safe_name}_{now.strftime('%Y%m%d_%H%M%S')}.json"
        except Exception as e:
            print(f"Could not use filename: {e}")
    
    result_path = os.path.join(settings.RESULTS_DIR, file_name)

    try:
        with open(result_path, "w", encoding="utf-8") as result_file:
            json.dump(payload, result_file, ensure_ascii=False, indent=2)
    except Exception as exc:
        print(f"Failed to persist result {doc_id}: {exc}")


async def process_document_task(doc_id: str, file_path: str, doc_type: str, ocr_engine: str):
    """Background task to handle heavy OCR logic and result persistence."""
    db = await get_database()

    try:
        # 1. Convert PDF to Images
        doc = fitz.open(file_path)
        images = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap()
            img_bytes = pix.tobytes()
            img = Image.open(io.BytesIO(img_bytes))
            images.append(img)
        doc.close()

        # Choose OCR Engine
        if ocr_engine == 'gemini':
            ocr_service = OCRService()
        elif ocr_engine == 'paddle':
            ocr_service = PaddleService()
        elif ocr_engine == 'qwen':
            ocr_service = QwenService()
        elif ocr_engine == 'surya':
            ocr_service = SuryaService()
        else:
            ocr_service = TesseractService()

        all_raw_text = []

        # 2. Iterate pages
        for i, image in enumerate(images):
            # Save temp image
            temp_img_path = os.path.join(settings.UPLOAD_DIR, f"{doc_id}_page_{i}.png")
            image.save(temp_img_path, 'PNG')

            final_path_to_ocr = temp_img_path

            # 3. Pre-process if Handwritten Answer Sheet
            if doc_type == "answer_sheet" and ocr_engine != 'paddle':
                # Removes lines, increases contrast
                final_path_to_ocr = preprocess_handwriting(temp_img_path)

            # 4. Run OCR
            page_text, _ = ocr_service.extract_text(final_path_to_ocr)
            all_raw_text.append(page_text)

            # Cleanup temp images
            # os.remove(temp_img_path)

        # 5. Parse Data based on document type
        full_text_lines = "\n".join(all_raw_text).split("\n")

        if doc_type == "question_paper":
            parsed_data = parse_question_paper(full_text_lines)
        else:
            parsed_data = parse_answer_sheet(full_text_lines)

        parsed_payload = [q.dict() for q in parsed_data]
        result_payload = {
            "filename": os.path.basename(file_path),
            "doc_type": doc_type,
            "ocr_engine": ocr_engine,
            "status": "completed",
            "parsed_result": parsed_payload,
            "raw_text_pages": all_raw_text,
        }

        # Save result to file
        _save_result_to_file(doc_id, result_payload)

        # 6. Update DB
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {
                "$set": {
                    "status": "completed",
                    "parsed_result": parsed_payload,
                    "raw_text_pages": all_raw_text
                }
            }
        )

    except Exception as e:
        print(f"Error processing {doc_id}: {e}")
        failure_payload = {
            "filename": os.path.basename(file_path),
            "doc_type": doc_type,
            "ocr_engine": ocr_engine,
            "status": "failed",
            "error": str(e),
        }
        _save_result_to_file(doc_id, failure_payload)
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "failed"}}
        )


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form(...),  # 'question_paper' or 'answer_sheet'
    ocr_engine: str = Form(...)  # 'gemini', 'tesseract', 'paddle', 'qwen', 'surya'
):
    """Upload and queue a document for OCR processing."""
    # 1. Save file locally
    file_location = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Create Initial DB Record
    db = await get_database()
    new_doc = {
        "filename": file.filename,
        "doc_type": doc_type,
        "ocr_engine": ocr_engine,
        "status": "processing",
        "parsed_result": None
    }
    result = await db.documents.insert_one(new_doc)
    doc_id = str(result.inserted_id)

    # 3. Trigger Background Processing
    background_tasks.add_task(process_document_task, doc_id, file_location, doc_type, ocr_engine)

    return {"id": doc_id, "status": "queued"}


@router.get("/results/{doc_id}")
async def get_results(doc_id: str):
    """Retrieve OCR results for a specific document."""
    db = await get_database()
    doc = await db.documents.find_one({"_id": ObjectId(doc_id)})

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Convert ObjectId to str for JSON response
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/question-papers")
async def list_question_papers():
    """List all available question paper PDFs."""
    question_files, _ = _collect_pdf_entries()
    return {"files": question_files}


@router.get("/answer-sheets")
async def list_answer_sheets():
    """List all available answer sheet PDFs."""
    _, answer_files = _collect_pdf_entries()
    return {"files": answer_files}


@router.get("/saved-results")
async def list_saved_results():
    """List all saved OCR results from the results directory."""
    results_dir = settings.RESULTS_DIR
    files = []

    if os.path.isdir(results_dir):
        for name in sorted(os.listdir(results_dir), reverse=True):  # Most recent first
            if name.lower().endswith(".json"):
                file_path = os.path.join(results_dir, name)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    
                    # Clean up filename for display
                    display_name = name.replace(".json", "")
                    
                    files.append({
                        "id": name,  # Use full filename as ID for retrieval
                        "name": display_name,
                        "url": f"/api/saved-results/{name}",
                        "status": data.get("status", "unknown"),
                        "doc_type": data.get("doc_type", ""),
                        "timestamp": data.get("timestamp", ""),
                    })
                except Exception as e:
                    print(f"Error reading result file {name}: {e}")

    return {"files": files}


@router.get("/saved-results/{result_id}")
async def get_saved_result(result_id: str):
    """Retrieve a specific saved OCR result."""
    # result_id now includes .json extension
    if not result_id.endswith(".json"):
        result_id = result_id + ".json"
    
    result_file = os.path.join(settings.RESULTS_DIR, result_id)

    if not os.path.isfile(result_file):
        raise HTTPException(status_code=404, detail="Result not found")

    try:
        with open(result_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading result: {str(e)}")

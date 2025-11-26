# AI-Powered Document Intake & Extraction Microservice

**Evalvia.Ai** — A professional-grade OCR and document processing platform designed for automated exam paper and answer sheet extraction, parsing, and result management.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Installation & Setup](#installation--setup)
7. [Configuration](#configuration)
8. [Running the Application](#running-the-application)
9. [API Endpoints](#api-endpoints)
10. [Frontend Usage](#frontend-usage)
11. [OCR Engines](#ocr-engines)
12. [Result Storage & Retrieval](#result-storage--retrieval)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This microservice provides an end-to-end solution for:
- **Document Upload**: Accept PDF and image files for processing
- **OCR Processing**: Extract text using multiple OCR engines (Gemini, Tesseract, Paddle, Qwen, Surya)
- **Smart Parsing**: Automatically parse question papers and answer sheets into structured JSON
- **Result Persistence**: Store OCR results as JSON files and MongoDB documents
- **Modern UI**: Clean, responsive black-and-white interface with real-time progress tracking
- **PDF Viewing**: Embedded viewers for question papers and answer sheets

---

## ✨ Features

### Core Capabilities
✅ Multi-engine OCR support (5 engines: Gemini, Tesseract, Paddle, Qwen, Surya)
✅ Asynchronous background processing with real-time polling
✅ Automatic document type detection (question paper vs. answer sheet)
✅ Handwriting preprocessing for improved accuracy on answer sheets
✅ Dual storage: MongoDB for quick access + JSON files for persistence
✅ RESTful API for all operations
✅ Embedded PDF viewer for question papers and answer sheets
✅ Saved results management with meaningful file naming

### UI/UX
✅ Tab-based navigation (Dashboard, Uploads, Results, Question Papers, Answer Sheets)
✅ Monospace typography (JetBrains Mono, Courier Prime) for technical aesthetic
✅ Black and white minimalist design
✅ Live progress indicator with status updates during processing
✅ Comprehensive results display with parsed extraction and raw outputs
✅ GitHub integration link in sidebar

### Dashboard
✅ Real-time summary of all processed documents
✅ Count of completed, failed, and processing results
✅ Quick tips for improving OCR accuracy
✅ AI Insight Hub section for monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Static Assets)              │
│  - HTML5 Single Page Application                        │
│  - CSS3 with CSS variables and animations              │
│  - Vanilla JavaScript (no frameworks)                   │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────────────────┐
│               FastAPI Backend                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ API Routes Layer                                  │  │
│  │ - /api/upload (POST) - File upload & queueing   │  │
│  │ - /api/results/{doc_id} (GET) - Status polling  │  │
│  │ - /api/saved-results (GET) - List all results   │  │
│  │ - /api/saved-results/{filename} (GET) - Detail  │  │
│  │ - /api/question-papers (GET) - PDF list         │  │
│  │ - /api/answer-sheets (GET) - PDF list           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Background Task Processing                       │  │
│  │ - PDF→Image conversion                           │  │
│  │ - Handwriting preprocessing                      │  │
│  │ - Multi-engine OCR extraction                    │  │
│  │ - Structured data parsing                        │  │
│  │ - Result persistence (DB + Files)               │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Service Layer                                     │  │
│  │ - OCRService (Gemini)                            │  │
│  │ - TesseractService                               │  │
│  │ - PaddleService                                  │  │
│  │ - QwenService                                    │  │
│  │ - SuryaService                                   │  │
│  │ - ImageProcessing (handwriting cleanup)         │  │
│  │ - Parser (question paper & answer sheet logic)  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────┬──────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
    ┌───▼──┐  ┌──▼────┐  ┌─▼─────┐
    │ MongoDB    │ File System   │ External
    │ (Documents)│ (JSON Results)│ APIs
    └────────┘  └───────────┘  └────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (async/await, high performance)
- **Database**: MongoDB with Motor (async driver)
- **OCR Engines**: 
  - Google Gemini API
  - Tesseract (open-source)
  - PaddleOCR
  - Qwen-2.5-VL-32B
  - Surya OCR
- **Image Processing**: Pillow (PIL), PyMuPDF (fitz)
- **Task Processing**: Python asyncio (background tasks)

### Frontend
- **Language**: Vanilla JavaScript (no frameworks)
- **Markup**: HTML5
- **Styling**: CSS3 (CSS variables, animations, gradients)
- **Fonts**: JetBrains Mono, Courier Prime (monospace)
- **PDF Viewing**: iframe-based PDF viewer
- **API Communication**: Fetch API

### Infrastructure
- **Server**: Uvicorn (ASGI)
- **Python Version**: 3.9+
- **Virtual Environment**: venv

---

## 📁 Project Structure

```
exam_grading_system/
├── app/
│   ├── api/
│   │   └── routes.py          # All API endpoints
│   ├── core/
│   │   ├── config.py          # Configuration & settings
│   │   └── database.py        # MongoDB connection
│   ├── services/
│   │   ├── ocr_service.py     # Gemini OCR
│   │   ├── tesseract_service.py
│   │   ├── paddle_service.py
│   │   ├── qwen_service.py
│   │   ├── surya_service.py
│   │   ├── image_processing.py # Handwriting preprocessing
│   │   └── parser_service.py  # Question/answer parsing
│   └── main.py                # FastAPI app initialization
├── static/
│   ├── index.html             # Single-page application
│   ├── script.js              # Frontend logic (657 lines)
│   ├── styles.css             # Styling & animations
│   ├── logo.png               # Evalvia logo
│   └── evalvia-logo.svg       # SVG fallback logo
├── uploads/                   # Uploaded PDF/image files (temp)
├── pdf/                       # Static question & answer PDFs
├── results/                   # Persisted OCR result JSON files
├── requirements.txt           # Python dependencies
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
└── venv/                      # Virtual environment

```

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+
- pip
- MongoDB (local or Atlas)
- Google API credentials (for Gemini)
- Tesseract OCR (system-level install)

### Step 1: Clone and Navigate
```bash
cd "AI-Powered Document Intake & Extraction Microservice"
```

### Step 2: Create Virtual Environment
```bash
python -m venv venv
```

### Step 3: Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 5: Configure Environment
Create a `.env` file in the project root:
```env
# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/exam_grading?retryWrites=true&w=majority

# Google Gemini API
GOOGLE_API_KEY=your_google_api_key_here

# OCR Configuration (optional)
DEFAULT_OCR_ENGINE=tesseract
```

### Step 6: Verify Tesseract Installation
Ensure Tesseract is installed and accessible:

**Windows:** Download from https://github.com/UB-Mannheim/tesseract/wiki

**Mac:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

---

## ⚙️ Configuration

### `app/core/config.py`
Contains all application settings:

```python
# Directories
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")     # Temp upload storage
PDF_DIR = os.path.join(os.getcwd(), "pdf")             # Static PDFs
RESULTS_DIR = os.path.join(os.getcwd(), "results")     # Persisted JSON results

# Answer sheet files (categorized separately)
ANSWER_SHEET_FILES: List[str] = ["eng_1.pdf"]

# MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "exam_grading"

# Google Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
```

### Key Configuration Points
- **PDF_DIR**: Place question papers and answer sheets here; they'll appear in the UI
- **ANSWER_SHEET_FILES**: List files that should be categorized as answer sheets
- **RESULTS_DIR**: Where OCR results are saved as JSON (auto-created)

---

## 🚀 Running the Application

### Start the Backend Server
```bash
cd exam_grading_system
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Access the Frontend
Open your browser and navigate to:
```
http://localhost:8000
```

You should see:
- **Sidebar** with Evalvia branding and navigation tabs
- **Dashboard** showing OCR processing stats
- **Uploads** section for file submission
- **Results** section for viewing processed documents
- **Question Papers** and **Answer Sheets** tabs with embedded PDFs

---

## 🔌 API Endpoints

### Document Upload & Processing

**POST /api/upload**
- Upload a file and queue for OCR processing
- **Parameters:**
  - `file` (multipart/form-data): PDF or image file
  - `doc_type` (form): `question_paper` or `answer_sheet`
  - `ocr_engine` (form): `gemini`, `tesseract`, `paddle`, `qwen`, or `surya`
- **Response:**
  ```json
  {
    "id": "507f1f77bcf86cd799439011",
    "status": "queued"
  }
  ```

**GET /api/results/{doc_id}**
- Poll for processing status and results
- **Response (while processing):**
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "status": "processing",
    "ocr_engine": "tesseract"
  }
  ```
- **Response (completed):**
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "status": "completed",
    "parsed_result": [...],
    "raw_text_pages": [...]
  }
  ```

### Saved Results Management

**GET /api/saved-results**
- List all saved OCR results
- **Response:**
  ```json
  {
    "files": [
      {
        "id": "Email Proof of Disclosure_20251126_120435.json",
        "name": "Email Proof of Disclosure_20251126_120435",
        "url": "/api/saved-results/Email%20Proof%20of%20Disclosure_20251126_120435.json",
        "status": "completed",
        "doc_type": "question_paper",
        "timestamp": "2025-11-26T12:04:35+05:30"
      }
    ]
  }
  ```

**GET /api/saved-results/{filename}**
- Retrieve a specific saved result
- **Response:**
  ```json
  {
    "filename": "document.pdf",
    "doc_type": "question_paper",
    "ocr_engine": "tesseract",
    "status": "completed",
    "timestamp": "2025-11-26T12:04:35+05:30",
    "parsed_result": [...],
    "raw_text_pages": [...]
  }
  ```

### Document Listing

**GET /api/question-papers**
- List available question paper PDFs
- **Response:**
  ```json
  {
    "files": [
      {"name": "math_exam.pdf", "url": "/pdfs/math_exam.pdf"}
    ]
  }
  ```

**GET /api/answer-sheets**
- List available answer sheet PDFs
- **Response:**
  ```json
  {
    "files": [
      {"name": "eng_1.pdf", "url": "/pdfs/eng_1.pdf"}
    ]
  }
  ```

### Static File Serving

**GET /static/{filename}**
- Frontend assets (CSS, JS, images)

**GET /pdfs/{filename}**
- Question and answer PDFs

**GET /results/{filename}**
- Persisted OCR result JSON files

---

## 💻 Frontend Usage

### Dashboard
- Displays real-time statistics:
  - Total number of processed documents
  - Count of completed, failed, and processing results
  - Quick tips for improving accuracy

### Uploads Tab
1. Click **"Select Document"** to choose a PDF or image
2. Select **"Document Type"**: `Question Paper` or `Answer Sheet`
3. Choose **"OCR Engine"**: Gemini, Tesseract, Paddle, Qwen, or Surya
4. Click **"Upload & Process"**
5. Watch the centered **loading indicator** with real-time progress
6. Results auto-display in the **Results tab** when complete

### Results Tab
- **Saved Results** section lists all previous OCR outputs
- Click **"View"** to display:
  - **Parsed Extraction**: Structured questions with confidence indicators
  - **Raw Outputs**: Full extracted text from each page
  - **Raw JSON**: Complete API response (toggle via button)
- Each result shows:
  - Document name (extracted from content or filename)
  - Status (Completed/Failed)
  - Document type (Question Paper/Answer Sheet)
  - Processing timestamp (local time with timezone)

### Question Papers & Answer Sheets Tabs
- Lists all PDFs from the `pdf/` directory
- Click an item to view in the embedded PDF viewer
- Download links available for each document

### Sidebar Navigation
- **Dashboard**: Home with stats
- **Uploads**: Document submission
- **Results**: View all OCR outputs
- **Question Papers**: View and download stored PDFs
- **Answer Sheets**: View and download answer sheets
- **GitHub**: External link to repository

---

## 🧠 OCR Engines

### Comparison

| Engine | Speed | Accuracy | Cost | Best For |
|--------|-------|----------|------|----------|
| **Gemini** | Medium | Excellent (95%+) | Paid API | Complex layouts, AI-assisted understanding |
| **Tesseract** | Fast | Good (85-90%) | Free (open-source) | Standard printed text |
| **Paddle** | Fast | Good (85-90%) | Free | Multilingual text, both printed & handwriting |
| **Qwen-2.5-VL-32B** | Slow | Excellent (90%+) | Paid API | Structured documents, visual understanding |
| **Surya** | Medium | Excellent (92%+) | Free | Layout-aware extraction, complex documents |

### Selection Guide
- **Question Papers**: Surya or Gemini (preserve structure)
- **Handwritten Answer Sheets**: Paddle or Qwen (handles cursive)
- **Quick Processing**: Tesseract (fastest)
- **Highest Accuracy**: Gemini or Qwen

---

## 💾 Result Storage & Retrieval

### File Naming Strategy
Results are saved with meaningful names based on extracted content:

Format: `{extracted_text_snippet}_{timestamp}.json`

Example: `Email Proof of Disclosure_20251126_120435.json`

If content extraction fails, falls back to original filename.

### Storage Locations

**MongoDB Documents** (in `exam_grading` database, `documents` collection):
```json
{
  "_id": ObjectId("..."),
  "filename": "document.pdf",
  "doc_type": "question_paper",
  "ocr_engine": "tesseract",
  "status": "completed",
  "parsed_result": [...],
  "raw_text_pages": [...]
}
```

**JSON Files** (in `results/` folder):
```json
{
  "filename": "document.pdf",
  "doc_type": "question_paper",
  "ocr_engine": "tesseract",
  "status": "completed",
  "timestamp": "2025-11-26T12:04:35+05:30",
  "doc_id": "507f1f77bcf86cd799439011",
  "parsed_result": [...],
  "raw_text_pages": [...]
}
```

### Why Dual Storage?
- **MongoDB**: Fast queries, real-time status updates during processing
- **JSON Files**: Portable, human-readable, searchable, version-control friendly

---

## 🐛 Troubleshooting

### Issue: "No active scans" on Dashboard
**Solution**: Ensure saved results exist in the `results/` folder. Check that OCR tasks completed successfully.

### Issue: Loading indicator stuck
**Solution**: Check browser console (F12) for errors. Verify backend is running (`uvicorn` terminal). Check `/api/results/{docId}` in Network tab.

### Issue: PDFs not showing in Question Papers/Answer Sheets
**Solution**: Place PDF files in the `pdf/` directory. Ensure filenames match config in `app/core/config.py` for answer sheets.

### Issue: Tesseract "not found" error
**Solution**: Install Tesseract system-wide:
- **Windows**: Download installer from UB-Mannheim/tesseract GitHub
- **Mac**: `brew install tesseract`
- **Linux**: `sudo apt-get install tesseract-ocr`

### Issue: Gemini API fails
**Solution**: Verify `GOOGLE_API_KEY` in `.env` is correct. Ensure API is enabled in Google Cloud Console.

### Issue: MongoDB connection timeout
**Solution**: Verify `MONGODB_URL` in `.env`. Check internet connection. Ensure MongoDB Atlas IP whitelist includes your machine.

### Issue: Results not persisting to `results/` folder
**Solution**: Ensure `results/` directory exists and is writable. Check backend logs for file I/O errors.

### Issue: Timestamps showing incorrect time
**Solution**: The app uses local system timezone. Set your system timezone correctly. Timestamps are stored in ISO 8601 format with timezone offset.

---

## 🔧 Development Notes

### Adding a New OCR Engine
1. Create `app/services/newengine_service.py`
2. Implement class with `extract_text(image_path)` method
3. Import and register in `app/api/routes.py` `process_document_task()`
4. Add option to dropdown in `static/index.html`

### Customizing Dashboard Stats
Edit `updateDashboard(files)` in `static/script.js` to show different metrics.

### Modifying Result Display
Update `displaySavedResult(data)` in `static/script.js` to customize parsing and rendering.

### Styling Changes
All colors and styles use CSS variables in `static/styles.css`:
```css
:root {
  --bg-primary: #ffffff;
  --accent-primary: #000000;
  /* ... */
}
```

---

## License

This project is part of the Evalvia.Ai platform. All rights reserved.

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review browser console (F12) for client-side errors
3. Check backend logs in the uvicorn terminal
4. Open an issue on GitHub (link in sidebar)

---

## 🚀 Deployment

For production deployment:
1. Set `DEBUG=False` in config
2. Use production ASGI server: `gunicorn` or `uvicorn` with workers
3. Configure CORS for frontend domain
4. Use environment variables for all secrets
5. Set up MongoDB Atlas for cloud database
6. Use CDN for static assets
7. Enable HTTPS

Example production run:
```bash
gunicorn app.main:app -w 4 -b 0.0.0.0:8000
```

---

**Built with ❤️ using FastAPI, MongoDB, and Vanilla JavaScript**

**Version**: 1.0.0  
**Last Updated**: November 26, 2025

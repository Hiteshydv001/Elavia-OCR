import pytesseract
from PIL import Image
import io
import os

from app.core.config import settings

class TesseractService:
    def __init__(self):
        # Set tesseract path from config
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

    def extract_text(self, image_path):
        """
        Extracts text from image using Tesseract OCR.
        Returns block of text and lines.
        """
        # Open image from path
        img = Image.open(image_path)
        
        # Custom config for better accuracy
        custom_config = r'--oem 3 --psm 6'
        
        # Extract text
        full_text = pytesseract.image_to_string(img, config=custom_config)
        lines = full_text.split('\n')
        
        return full_text, lines
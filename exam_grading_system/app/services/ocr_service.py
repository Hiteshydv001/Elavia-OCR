import google.generativeai as genai
from PIL import Image
import io

from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

class OCRService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def extract_text(self, image_path):
        """
        Sends image path to Google Gemini for text extraction.
        Returns block of text and lines.
        """
        # Open image from path
        img = Image.open(image_path)
        
        # Generate content with image
        response = self.model.generate_content(["Extract all the text from this image.", img])
        
        full_text = response.text
        lines = full_text.split('\n')
        
        return full_text, lines
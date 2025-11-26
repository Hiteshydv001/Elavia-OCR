from paddleocr import PaddleOCR
import cv2

class PaddleService:
    def __init__(self):
        # Initialize PaddleOCR with English
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')

    def extract_text(self, image_path):
        """
        Extracts text from image path using PaddleOCR.
        Returns block of text and lines.
        """
        # Load image with OpenCV
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        # Resize if too large (PaddleOCR recommends images under 3000px)
        if img.shape[0] > 3000 or img.shape[1] > 3000:
            scale = min(3000 / img.shape[0], 3000 / img.shape[1])
            new_width = int(img.shape[1] * scale)
            new_height = int(img.shape[0] * scale)
            img = cv2.resize(img, (new_width, new_height))
        
        # Perform OCR (PaddleOCR expects BGR format from OpenCV)
        results = self.ocr.ocr(img)
        
        lines = []
        full_text = ""
        
        if results and isinstance(results[0], list):
            for res in results[0]:
                try:
                    text = res[1][0]
                    lines.append(text)
                    full_text += text + "\n"
                except (IndexError, TypeError):
                    continue
        
        return full_text.strip(), lines
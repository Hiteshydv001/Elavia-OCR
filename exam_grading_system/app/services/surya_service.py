from surya.recognition import RecognitionPredictor
from surya.detection import DetectionPredictor
from surya.foundation import FoundationPredictor
from surya.foundation import FoundationPredictor
from PIL import Image

class SuryaService:
    def __init__(self):
        self.predictor = RecognitionPredictor(FoundationPredictor())

    def extract_text(self, image_path):
        """
        Extracts text from image using Surya OCR (layout-aware).
        Returns block of text and lines.
        """
        # Load image
        img = Image.open(image_path)
        
        # Perform OCR
        predictions = self.predictor([img], det_predictor=DetectionPredictor())
        
        # Extract text
        full_text = "\n".join(tl.text for p in predictions for tl in p.text_lines)
        lines = full_text.split('\n')
        
        return full_text, lines
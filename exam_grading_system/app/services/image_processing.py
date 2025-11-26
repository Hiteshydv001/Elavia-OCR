import cv2
import numpy as np

def preprocess_handwriting(image_path):
    """
    Cleans handwritten notebook pages:
    1. Converts to grayscale
    2. Removes horizontal ruled lines (Crucial for eng_1.pdf)
    3. Thresholds to make ink pop
    """
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Invert to white background
    gray = 255 - gray

    # Threshold
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Remove horizontal lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    detected_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)

    # Subtract lines
    without_lines = binary - detected_lines

    # Invert back
    result = 255 - without_lines

    # Save processed image to disk for OCR to read
    processed_path = image_path.replace(".jpg", "_processed.jpg")
    cv2.imwrite(processed_path, result)
    
    return processed_path
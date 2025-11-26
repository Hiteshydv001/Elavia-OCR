import requests
from PIL import Image
import base64
from io import BytesIO
from app.core.config import settings

class QwenService:
    def __init__(self):
        self.model = "qwen/qwen2.5-vl-32b-instruct"
        self.api_key = settings.OPENROUTER_API_KEY

    def extract_text(self, image_path):
        """
        Sends image path to Qwen-2.5-VL via OpenRouter for text extraction.
        Returns block of text and lines.
        """
        # Open image from path
        img = Image.open(image_path)
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format="JPEG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # API call
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all the text from this image."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"}}
                    ]
                }
            ]
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code != 200:
            raise ValueError(f"API request failed: {response.status_code} - {response.text}")
        
        result = response.json()
        
        if 'choices' not in result or not result['choices']:
            raise ValueError(f"No choices in response: {result}")
        
        full_text = result['choices'][0]['message']['content'] or ""
        lines = full_text.split('\n')
        
        return full_text, lines
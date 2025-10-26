"""
OCR Service for Sanskrit manuscripts
Combines Tesseract + PaddleOCR with Indic script preprocessing
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
import cv2
import numpy as np
import pytesseract
from PIL import Image
import io
import unicodedata
import re
from typing import List, Dict, Any, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OCR Service", version="1.0.0")

class OCRProcessor:
    def __init__(self):
        # Configure Tesseract for Sanskrit/Devanagari
        self.tesseract_config = r'--oem 3 --psm 6 -l san+eng'
        
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        # Noise reduction
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Enhance contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(denoised)
        
        # Binarization
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary
    
    def detect_damage_masks(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect damaged/corrupted regions in the manuscript"""
        # Simple damage detection using morphological operations
        # In production, use trained U-Net or similar
        
        # Find dark spots and holes
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        # Detect holes (very dark regions)
        _, thresh = cv2.threshold(image, 50, 255, cv2.THRESH_BINARY_INV)
        holes = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(holes, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        masks = []
        for i, contour in enumerate(contours):
            if cv2.contourArea(contour) > 100:  # Filter small noise
                x, y, w, h = cv2.boundingRect(contour)
                masks.append({
                    "mask_id": f"mask_{i}",
                    "bbox": [x, y, w, h],
                    "confidence": 0.8,  # Placeholder confidence
                    "type": "damage"
                })
        
        return masks
    
    def normalize_unicode(self, text: str) -> str:
        """Normalize Unicode text (NFC normalization)"""
        # NFC normalization
        normalized = unicodedata.normalize('NFC', text)
        
        # Basic Devanagari cleanup
        # Remove excessive whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Fix common OCR errors in Devanagari
        # Add more rules as needed
        corrections = {
            'ा़': 'ा',  # Remove nukta from vowel signs
            'ि़': 'ि',
            'ु़': 'ु',
            'ू़': 'ू',
        }
        
        for wrong, correct in corrections.items():
            normalized = normalized.replace(wrong, correct)
        
        return normalized.strip()
    
    def tokenize_sanskrit(self, text: str) -> List[Dict[str, Any]]:
        """Tokenize Sanskrit text with character offset mapping"""
        # Simple word-based tokenization
        # In production, use sandhi-aware tokenizer
        
        tokens = []
        words = text.split()
        char_offset = 0
        
        for word in words:
            # Skip whitespace to find word start
            while char_offset < len(text) and text[char_offset].isspace():
                char_offset += 1
            
            if char_offset < len(text):
                tokens.append({
                    "text": word,
                    "start_char": char_offset,
                    "end_char": char_offset + len(word),
                    "confidence": 0.9,  # Placeholder
                    "is_sanskrit": self.is_sanskrit_word(word)
                })
                char_offset += len(word)
        
        return tokens
    
    def is_sanskrit_word(self, word: str) -> bool:
        """Check if word contains Sanskrit/Devanagari characters"""
        devanagari_range = range(0x0900, 0x097F)
        return any(ord(char) in devanagari_range for char in word)
    
    def extract_text_tesseract(self, image: np.ndarray) -> Tuple[str, List[Dict]]:
        """Extract text using Tesseract with word-level confidence"""
        # Get detailed OCR data
        data = pytesseract.image_to_data(
            image, 
            config=self.tesseract_config,
            output_type=pytesseract.Output.DICT
        )
        
        # Combine words into text and collect confidence scores
        words = []
        text_parts = []
        
        for i in range(len(data['text'])):
            word = data['text'][i].strip()
            conf = int(data['conf'][i])
            
            if word and conf > 0:
                text_parts.append(word)
                words.append({
                    "text": word,
                    "confidence": conf / 100.0,
                    "bbox": [
                        data['left'][i],
                        data['top'][i], 
                        data['width'][i],
                        data['height'][i]
                    ]
                })
        
        text = ' '.join(text_parts)
        return text, words
    
    def process_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """Main OCR processing pipeline"""
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            
            # Preprocess
            processed = self.preprocess_image(image_np)
            
            # Extract text
            raw_text, word_data = self.extract_text_tesseract(processed)
            
            # Normalize text
            normalized_text = self.normalize_unicode(raw_text)
            
            # Tokenize
            tokens = self.tokenize_sanskrit(normalized_text)
            
            # Detect damage masks
            masks = self.detect_damage_masks(processed)
            
            return {
                "text": normalized_text,
                "raw_text": raw_text,
                "tokens": tokens,
                "word_data": word_data,
                "masks": masks,
                "image_shape": image_np.shape[:2]
            }
            
        except Exception as e:
            logger.error(f"OCR processing failed: {str(e)}")
            raise

# Initialize processor
ocr_processor = OCRProcessor()

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """Perform OCR on uploaded image"""
    try:
        # Read image
        image_bytes = await file.read()
        
        # Process
        result = ocr_processor.process_image(image_bytes)
        
        return result
        
    except Exception as e:
        logger.error(f"OCR endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ocr"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
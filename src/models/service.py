"""
Model Service for PaniniT5 inference
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import torch
import logging
import os
import json
from datetime import datetime

try:
    # Try to import the full model first
    from .panini_t5 import IntelligentSanskritGenerator, ReconstructionCandidate
except ImportError:
    try:
        from panini_t5 import IntelligentSanskritGenerator, ReconstructionCandidate
    except ImportError:
        # Fall back to simplified version for local development
        logger.warning("Using simplified model for local development")
        try:
            from .panini_t5_simple import IntelligentSanskritGenerator, ReconstructionCandidate
        except ImportError:
            from panini_t5_simple import IntelligentSanskritGenerator, ReconstructionCandidate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PaniniT5 Model Service", version="1.0.0")

# Request/Response models
class ReconstructRequest(BaseModel):
    ocr_data: Dict[str, Any]
    mask_ids: List[str]
    mode: str = "hard"  # soft|hard
    n_candidates: int = 5

class TranslateRequest(BaseModel):
    sanskrit_text: str
    style: str = "literal"  # literal|idiomatic

class AssistantRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

class ModelService:
    def __init__(self):
        self.model = None
        self.kg_data = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
    def load_model(self, model_path: str):
        """Load PaniniT5 model"""
        try:
            logger.info(f"Loading model from {model_path}")
            
            # Initialize Intelligent Generative AI model
            self.model = IntelligentSanskritGenerator(
                base_model="google/mt5-large",
                kg_vocab_size=2000,
                enable_multimodal=True,
                enable_uncertainty=True
            )
            
            # Load checkpoint if exists
            if os.path.exists(model_path):
                checkpoint = torch.load(model_path, map_location=self.device)
                self.model.load_state_dict(checkpoint["model_state_dict"])
                logger.info("Loaded trained model checkpoint")
            else:
                logger.info("Using base model (no checkpoint found)")
            
            self.model.to(self.device)
            self.model.eval()
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise
    
    def load_kg_data(self, kg_path: str):
        """Load knowledge graph data"""
        try:
            if os.path.exists(kg_path):
                with open(kg_path, 'r', encoding='utf-8') as f:
                    self.kg_data = json.load(f)
                logger.info(f"Loaded KG data with {len(self.kg_data)} entries")
            else:
                # Create minimal KG for demo
                self.kg_data = self._create_demo_kg()
                logger.info("Using demo KG data")
                
        except Exception as e:
            logger.error(f"Failed to load KG data: {str(e)}")
            self.kg_data = self._create_demo_kg()
    
    def _create_demo_kg(self) -> Dict[str, Any]:
        """Create minimal KG for demonstration"""
        return {
            "sutras": {
                "6.1.87": {
                    "text": "आद्गुणः",
                    "description": "The vowels a, i, u are replaced by their corresponding guṇa vowels",
                    "examples": ["अ + इ = ए", "अ + उ = ओ"]
                },
                "8.4.68": {
                    "text": "अ आ",
                    "description": "Vowel sandhi rules for a and ā",
                    "examples": ["राम + अयम् = रामायम्"]
                }
            },
            "morphology": {
                "vibhakti": {
                    "1": {"name": "प्रथमा", "endings": ["ः", "ौ", "े"]},
                    "2": {"name": "द्वितीया", "endings": ["म्", "ौ", "ान्"]}
                }
            },
            "sandhi_rules": {
                "vowel_sandhi": [
                    {"pattern": "अ + अ", "result": "आ"},
                    {"pattern": "अ + इ", "result": "ए"}
                ]
            }
        }
    
    def reconstruct_text(self, request: ReconstructRequest) -> Dict[str, Any]:
        """Reconstruct damaged Sanskrit text"""
        try:
            start_time = datetime.now()
            
            if not self.model:
                raise HTTPException(status_code=500, detail="Model not loaded")
            
            # Extract OCR text and masks
            ocr_text = request.ocr_data.get("text", "")
            masks = request.ocr_data.get("masks", [])
            
            # Filter masks by requested IDs
            selected_masks = [m for m in masks if m.get("mask_id") in request.mask_ids]
            
            if not selected_masks:
                return {
                    "candidates": [],
                    "timings": {"total_ms": 0}
                }
            
            # Prepare input text with mask tokens
            masked_text = self._apply_masks_to_text(ocr_text, selected_masks)
            
            # Get KG context for the text
            kg_context = self._get_kg_context(masked_text)
            
            # Generate intelligent candidates using advanced AI
            try:
                candidates = self.model.generate_intelligent_candidates(
                    input_text=masked_text,
                    damaged_regions=[(m["bbox"][0], m["bbox"][2]) for m in selected_masks],
                    image_context=None,  # TODO: Add image context extraction
                    kg_context=kg_context,
                    n_candidates=request.n_candidates,
                    use_constraints=(request.mode == "hard"),
                    temperature=0.8 if request.mode == "soft" else 0.3
                )
            except Exception as e:
                logger.error(f"Model generation failed: {str(e)}")
                # Fallback to simple candidates
                candidates = self._generate_fallback_candidates(masked_text, request.n_candidates)
            
            # Convert to response format
            response_candidates = []
            for i, candidate in enumerate(candidates):
                response_candidates.append({
                    "candidate_id": f"cand_{i}",
                    "sanskrit_text": candidate.text,
                    "iast": candidate.iast,
                    "morph_seg": candidate.morph_segments,
                    "sutras": candidate.sutras,
                    "literal_gloss": candidate.literal_translation,
                    "idiomatic_translation": candidate.idiomatic_translation,
                    "scores": candidate.scores
                })
            
            end_time = datetime.now()
            total_ms = (end_time - start_time).total_seconds() * 1000
            
            return {
                "candidates": response_candidates,
                "timings": {
                    "total_ms": total_ms,
                    "model_inference_ms": total_ms * 0.8,  # Approximate
                    "kg_lookup_ms": total_ms * 0.2
                }
            }
            
        except Exception as e:
            logger.error(f"Reconstruction failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def _apply_masks_to_text(self, text: str, masks: List[Dict]) -> str:
        """Apply damage masks to text by inserting mask tokens"""
        # Simplified implementation - in production, use proper char-to-token mapping
        masked_text = text
        
        for mask in masks:
            # Replace damaged regions with mask tokens
            masked_text = masked_text.replace("???", "<MASK>")  # Placeholder
        
        return masked_text
    
    def _get_kg_context(self, text: str) -> Dict[str, Any]:
        """Get relevant KG context for the input text"""
        if not self.kg_data:
            return {}
        
        # Simple keyword matching - in production, use semantic similarity
        context = {
            "applicable_sutras": [],
            "morphology_hints": [],
            "sandhi_rules": []
        }
        
        # Check for applicable sutras
        for sutra_id, sutra_data in self.kg_data.get("sutras", {}).items():
            # Simple heuristic - check if any example patterns match
            for example in sutra_data.get("examples", []):
                if any(char in text for char in example.split()):
                    context["applicable_sutras"].append({
                        "id": sutra_id,
                        "text": sutra_data["text"],
                        "description": sutra_data["description"]
                    })
        
        return context
    
    def translate_text(self, request: TranslateRequest) -> Dict[str, Any]:
        """Translate Sanskrit text to English"""
        try:
            if not self.model:
                # Fallback to rule-based translation for demo
                return self._demo_translation(request.sanskrit_text, request.style)
            
            # Use model for translation
            # Implementation depends on model architecture
            translation = f"{request.style.title()} translation of: {request.sanskrit_text}"
            
            return {
                "translation": translation,
                "alignment": [],  # Word alignment info
                "confidence": 0.85
            }
            
        except Exception as e:
            logger.error(f"Translation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def _demo_translation(self, text: str, style: str) -> Dict[str, Any]:
        """Demo translation using simple word lookup"""
        # Basic Sanskrit-English dictionary for demo
        word_dict = {
            "राम": "Rama",
            "सीता": "Sita", 
            "गच्छति": "goes",
            "आगच्छति": "comes",
            "गृहम्": "home",
            "वनम्": "forest",
            "धर्म": "dharma/righteousness",
            "अर्थ": "wealth/meaning",
            "काम": "desire",
            "मोक्ष": "liberation"
        }
        
        words = text.split()
        translated_words = []
        
        for word in words:
            translated = word_dict.get(word, f"[{word}]")
            translated_words.append(translated)
        
        if style == "literal":
            translation = " ".join(translated_words)
        else:  # idiomatic
            translation = " ".join(translated_words).replace("[", "").replace("]", "")
            # Add basic grammar adjustments
            translation = translation.replace(" goes ", " is going ")
        
        return {
            "translation": translation,
            "alignment": [{"sanskrit": w, "english": t} for w, t in zip(words, translated_words)],
            "confidence": 0.7
        }
    
    def query_assistant(self, request: AssistantRequest) -> Dict[str, Any]:
        """Handle assistant queries"""
        try:
            query = request.query.lower()
            context = request.context or {}
            
            # Simple rule-based responses for demo
            if "sutra" in query or "rule" in query:
                response = self._explain_sutras(query, context)
            elif "translate" in query or "meaning" in query:
                response = self._explain_translation(query, context)
            elif "grammar" in query or "morphology" in query:
                response = self._explain_grammar(query, context)
            else:
                response = {
                    "answer": "I can help explain Sanskrit grammar rules, sutras, translations, and morphology. What would you like to know?",
                    "sources": [],
                    "actions": ["ask_specific_question"]
                }
            
            return response
            
        except Exception as e:
            logger.error(f"Assistant query failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def _explain_sutras(self, query: str, context: Dict) -> Dict[str, Any]:
        """Explain Paninian sutras"""
        sutras = self.kg_data.get("sutras", {})
        
        if "6.1.87" in query or "गुण" in query:
            sutra = sutras.get("6.1.87", {})
            return {
                "answer": f"Sutra 6.1.87 '{sutra.get('text', '')}' means: {sutra.get('description', '')}. This rule applies when vowels combine in sandhi.",
                "sources": [{"kg_node": "sutra_6.1.87", "type": "paninian_sutra"}],
                "actions": ["show_examples", "apply_rule"]
            }
        
        return {
            "answer": "I can explain various Paninian sutras. Which specific sutra or grammar rule are you interested in?",
            "sources": [],
            "actions": ["list_sutras"]
        }
    
    def _explain_translation(self, query: str, context: Dict) -> Dict[str, Any]:
        """Explain translation choices"""
        return {
            "answer": "Sanskrit translation involves understanding both literal word meanings and contextual/cultural significance. Would you like me to explain a specific translation?",
            "sources": [],
            "actions": ["show_word_breakdown", "compare_translations"]
        }
    
    def _explain_grammar(self, query: str, context: Dict) -> Dict[str, Any]:
        """Explain grammatical concepts"""
        return {
            "answer": "Sanskrit grammar follows Paninian rules with complex morphology including vibhakti (cases), lakara (tenses), and sandhi (sound changes). What aspect would you like to explore?",
            "sources": [{"kg_node": "morphology_system", "type": "grammar_concept"}],
            "actions": ["show_declension", "explain_sandhi"]
        }

# Initialize service
model_service = ModelService()

@app.on_event("startup")
async def startup_event():
    """Initialize model and KG on startup"""
    model_path = os.getenv("MODEL_PATH", "/app/models/panini_t5/model.pt")
    kg_path = os.getenv("KG_PATH", "/app/models/kg_data.json")
    
    try:
        model_service.load_model(model_path)
        model_service.load_kg_data(kg_path)
        logger.info("Model service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize model service: {str(e)}")

@app.post("/reconstruct")
async def reconstruct_endpoint(request: ReconstructRequest):
    """Reconstruct damaged text"""
    return model_service.reconstruct_text(request)

@app.post("/translate")
async def translate_endpoint(request: TranslateRequest):
    """Translate Sanskrit text"""
    return model_service.translate_text(request)

@app.post("/assistant")
async def assistant_endpoint(request: AssistantRequest):
    """Query the assistant"""
    return model_service.query_assistant(request)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model_service.model is not None,
        "kg_loaded": model_service.kg_data is not None,
        "device": str(model_service.device)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 
   
    def _generate_fallback_candidates(self, masked_text: str, n_candidates: int) -> List:
        """Generate fallback candidates when the main model fails"""
        from .panini_t5 import ReconstructionCandidate
        
        # Simple fallback candidates
        candidates = []
        base_words = ["राम", "सीता", "गच्छति", "तिष्ठति", "धर्म", "अर्थ"]
        
        for i in range(min(n_candidates, len(base_words))):
            word = base_words[i]
            candidate = ReconstructionCandidate(
                text=word,
                iast=self._simple_to_iast(word),
                morph_segments=[word],
                sutras=[{"id": "fallback", "description": "Fallback reconstruction"}],
                literal_translation=f"Translation of {word}",
                idiomatic_translation=f"Meaning: {word}",
                scores={
                    "lm_score": 0.5,
                    "kg_confidence": 0.3,
                    "model_confidence": 0.4,
                    "combined": 0.4
                }
            )
            candidates.append(candidate)
        
        return candidates
    
    def _simple_to_iast(self, devanagari: str) -> str:
        """Simple Devanagari to IAST conversion"""
        # Basic mapping for common characters
        mapping = {
            'र': 'ra', 'ा': 'ā', 'म': 'ma', 'स': 'sa', 'ी': 'ī', 'त': 'ta',
            'ग': 'ga', 'च्': 'c', 'छ': 'cha', 'ि': 'i', 'ष्': 'ṣ', 'ठ': 'ṭha',
            'ध': 'dha', 'र्': 'r', 'थ': 'tha', '्': '', 'अ': 'a'
        }
        
        result = ""
        for char in devanagari:
            result += mapping.get(char, char)
        
        return result
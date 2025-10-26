"""
Simplified PaniniT5 for local development and testing
This version provides mock functionality without requiring heavy ML dependencies
"""
import random
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class ReconstructionCandidate:
    text: str
    iast: str
    morph_segments: List[str]
    sutras: List[Dict[str, str]]
    literal_translation: str
    idiomatic_translation: str
    scores: Dict[str, float]

class IntelligentSanskritGenerator:
    """
    Simplified version of the Intelligent Sanskrit Generator for local development
    """
    
    def __init__(self, 
                 base_model: str = "mock-mt5-large",
                 kg_vocab_size: int = 2000,
                 enable_multimodal: bool = True,
                 enable_uncertainty: bool = True):
        
        self.config = {
            "base_model": base_model,
            "kg_vocab_size": kg_vocab_size,
            "enable_multimodal": enable_multimodal,
            "enable_uncertainty": enable_uncertainty
        }
        
        # Mock tokenizer
        self.tokenizer = MockTokenizer()
        
        # Sample Sanskrit words for reconstruction
        self.sanskrit_words = [
            "राम", "सीता", "गच्छति", "आगच्छति", "तिष्ठति", "पठति", "लिखति",
            "गृहम्", "वनम्", "पुस्तकम्", "जलम्", "अग्नि", "वायु", "आकाश",
            "धर्म", "अर्थ", "काम", "मोक्ष", "सत्य", "अहिंसा", "करुणा",
            "विद्या", "ज्ञान", "बुद्धि", "मति", "प्रज्ञा", "चित्त", "मन"
        ]
        
        # Sample sutras
        self.sample_sutras = [
            {"id": "6.1.87", "text": "आद्गुणः", "description": "Vowel strengthening rule"},
            {"id": "6.1.101", "text": "अकः सवर्णे दीर्घः", "description": "Similar vowel lengthening"},
            {"id": "8.4.68", "text": "अ आ", "description": "Vowel sandhi rules"},
            {"id": "3.4.78", "text": "तिप्तस्झि", "description": "Verbal endings"},
        ]
        
        logger.info("Initialized Simplified Sanskrit Generator")
    
    def generate_intelligent_candidates(self, 
                                      input_text: str,
                                      damaged_regions: List[Tuple[int, int]],
                                      image_context: Optional[Any] = None,
                                      kg_context: Optional[Dict] = None,
                                      n_candidates: int = 5,
                                      use_constraints: bool = True,
                                      temperature: float = 0.8) -> List[ReconstructionCandidate]:
        """
        Generate mock reconstruction candidates
        """
        
        logger.info(f"Generating {n_candidates} candidates for: {input_text}")
        
        # Simulate processing time
        time.sleep(0.5)
        
        candidates = []
        
        for i in range(n_candidates):
            # Generate a random Sanskrit word
            sanskrit_word = random.choice(self.sanskrit_words)
            
            # Create mock candidate
            candidate = ReconstructionCandidate(
                text=sanskrit_word,
                iast=self._to_iast(sanskrit_word),
                morph_segments=self._segment_morphology(sanskrit_word),
                sutras=random.sample(self.sample_sutras, random.randint(1, 3)),
                literal_translation=self._translate_literal(sanskrit_word),
                idiomatic_translation=self._translate_idiomatic(sanskrit_word),
                scores=self._generate_mock_scores(i, n_candidates, use_constraints)
            )
            
            candidates.append(candidate)
        
        # Sort by combined score
        candidates.sort(key=lambda x: x.scores.get("combined", 0.0), reverse=True)
        
        return candidates
    
    def _to_iast(self, devanagari_text: str) -> str:
        """Convert Devanagari to IAST (simplified)"""
        iast_map = {
            'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
            'ए': 'e', 'ओ': 'o', 'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha',
            'च': 'ca', 'छ': 'cha', 'ज': 'ja', 'झ': 'jha', 'ट': 'ṭa', 'ठ': 'ṭha',
            'ड': 'ḍa', 'ढ': 'ḍha', 'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha',
            'न': 'na', 'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
            'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'śa', 'ष': 'ṣa',
            'स': 'sa', 'ह': 'ha', '्': '', 'ं': 'ṃ', 'ः': 'ḥ', 'ि': 'i', 'ु': 'u'
        }
        
        result = ""
        for char in devanagari_text:
            result += iast_map.get(char, char)
        
        return result
    
    def _segment_morphology(self, text: str) -> List[str]:
        """Mock morphological segmentation"""
        if len(text) > 3:
            return [text[:-2], text[-2:]]
        return [text]
    
    def _translate_literal(self, sanskrit_text: str) -> str:
        """Mock literal translation"""
        translations = {
            "राम": "Rama", "सीता": "Sita", "गच्छति": "goes", "आगच्छति": "comes",
            "तिष्ठति": "stays", "पठति": "reads", "लिखति": "writes",
            "गृहम्": "house", "वनम्": "forest", "पुस्तकम्": "book", "जलम्": "water",
            "धर्म": "dharma", "अर्थ": "wealth", "काम": "desire", "मोक्ष": "liberation",
            "विद्या": "knowledge", "ज्ञान": "wisdom", "सत्य": "truth"
        }
        return translations.get(sanskrit_text, f"[{sanskrit_text}]")
    
    def _translate_idiomatic(self, sanskrit_text: str) -> str:
        """Mock idiomatic translation"""
        literal = self._translate_literal(sanskrit_text)
        
        # Add some variation for idiomatic
        if literal == "goes":
            return "is going"
        elif literal == "stays":
            return "remains"
        elif literal == "dharma":
            return "righteousness"
        elif literal == "knowledge":
            return "learning"
        
        return literal
    
    def _generate_mock_scores(self, index: int, total: int, use_constraints: bool) -> Dict[str, float]:
        """Generate realistic mock scores"""
        # Best candidate gets highest scores
        base_score = 0.95 - (index * 0.1)
        
        # Add some randomness
        noise = random.uniform(-0.05, 0.05)
        
        lm_score = max(0.1, min(0.99, base_score + noise))
        grammar_score = max(0.1, min(0.99, base_score + random.uniform(-0.1, 0.1)))
        model_confidence = max(0.1, min(0.99, base_score + random.uniform(-0.08, 0.08)))
        kg_compliance = 0.95 if use_constraints else random.uniform(0.6, 0.8)
        
        combined = (lm_score * 0.3 + grammar_score * 0.3 + 
                   model_confidence * 0.2 + kg_compliance * 0.2)
        
        return {
            "lm_score": round(lm_score, 3),
            "grammar_score": round(grammar_score, 3),
            "model_confidence": round(model_confidence, 3),
            "kg_compliance": round(kg_compliance, 3),
            "combined": round(combined, 3)
        }
    
    def to(self, device):
        """Mock method for device placement"""
        logger.info(f"Mock: Moving model to {device}")
        return self
    
    def eval(self):
        """Mock method for evaluation mode"""
        logger.info("Mock: Setting model to evaluation mode")
        return self

class MockTokenizer:
    """Mock tokenizer for development"""
    
    def __init__(self):
        self.vocab_size = 32000
    
    def __len__(self):
        return self.vocab_size
    
    def decode(self, tokens, skip_special_tokens=True):
        """Mock decode method"""
        return "मॉक टेक्स्ट"
    
    def encode(self, text, return_tensors=None, **kwargs):
        """Mock encode method"""
        return [1, 2, 3, 4, 5]  # Mock token IDs
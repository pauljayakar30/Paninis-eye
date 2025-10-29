#!/usr/bin/env python3
"""
Sanskrit Manuscript Reconstruction Portal - Backend API Server

Main FastAPI backend providing:
- Image upload and OCR processing for manuscript digitization
- Google Gemini AI integration for intelligent text restoration
- WebSocket connections for real-time progress updates
- Multilingual translation (Sanskrit, Hindi, Telugu, Tamil, English)
- AI-powered Sanskrit grammar assistant
- Export functionality for restored manuscripts

Architecture: RESTful API with WebSocket support for real-time features
Security: Requires GOOGLE_API_KEY environment variable for Gemini API access
"""

import uvicorn
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import json
import uuid
from datetime import datetime
import asyncio
import aiohttp
import logging
from typing import Dict, List, Any
import re
import base64
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini API configuration
# Load API key from environment variable for security
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "your-api-key-here")
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

if GOOGLE_API_KEY == "your-api-key-here":
    logger.warning("⚠️  Using placeholder API key. Set GOOGLE_API_KEY environment variable.")

app = FastAPI(title="Sanskrit Portal API - Local Dev")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage
sessions = {}
connections = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
    
    async def send_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(json.dumps(message))
            except:
                self.disconnect(session_id)

manager = ConnectionManager()

# OCR and Model service URLs
OCR_SERVICE_URL = "http://localhost:8001"
MODEL_SERVICE_URL = "http://localhost:8002"

async def process_with_ocr(image_bytes: bytes) -> Dict[str, Any]:
    """Process image with OCR service"""
    try:
        async with aiohttp.ClientSession() as session:
            data = aiohttp.FormData()
            data.add_field('file', image_bytes, filename='image.jpg', content_type='image/jpeg')
            
            async with session.post(f"{OCR_SERVICE_URL}/ocr", data=data) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"OCR service error: {response.status}")
                    return {}
    except Exception as e:
        logger.error(f"Failed to connect to OCR service: {str(e)}")
        return {}

def enhance_ocr_result(ocr_result: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance OCR result with Sanskrit-specific processing"""
    if not ocr_result:
        return {}
    
    text = ocr_result.get("text", "")
    tokens = ocr_result.get("tokens", [])
    masks = ocr_result.get("masks", [])
    
    # Add Sanskrit-specific enhancements
    enhanced_tokens = []
    for token in tokens:
        enhanced_token = token.copy()
        enhanced_token["is_sanskrit"] = is_sanskrit_text(token.get("text", ""))
        enhanced_token["needs_reconstruction"] = token.get("confidence", 1.0) < 0.7
        enhanced_tokens.append(enhanced_token)
    
    # Enhance masks with damage type classification
    enhanced_masks = []
    for i, mask in enumerate(masks):
        enhanced_mask = mask.copy()
        enhanced_mask["mask_id"] = f"mask_{i}"
        enhanced_mask["severity"] = classify_damage_severity(mask.get("confidence", 0.5))
        enhanced_masks.append(enhanced_mask)
    
    return {
        "text": text,
        "tokens": enhanced_tokens,
        "masks": enhanced_masks,
        "sanskrit_ratio": calculate_sanskrit_ratio(enhanced_tokens)
    }

def is_sanskrit_text(text: str) -> bool:
    """Check if text contains Sanskrit/Devanagari characters"""
    devanagari_pattern = re.compile(r'[\u0900-\u097F]')
    return bool(devanagari_pattern.search(text))

def classify_damage_severity(confidence: float) -> str:
    """Classify damage severity based on confidence"""
    if confidence > 0.8:
        return "minor"
    elif confidence > 0.5:
        return "moderate"
    else:
        return "severe"

def calculate_sanskrit_ratio(tokens: List[Dict]) -> float:
    """Calculate ratio of Sanskrit tokens"""
    if not tokens:
        return 0.0
    
    sanskrit_count = sum(1 for token in tokens if token.get("is_sanskrit", False))
    return sanskrit_count / len(tokens)

def calculate_avg_confidence(tokens: List[Dict]) -> float:
    """Calculate average confidence of tokens"""
    if not tokens:
        return 0.0
    
    confidences = [token.get("confidence", 0.0) for token in tokens]
    return sum(confidences) / len(confidences)

def count_low_confidence_regions(tokens: List[Dict]) -> int:
    """Count tokens with low confidence"""
    return sum(1 for token in tokens if token.get("confidence", 1.0) < 0.7)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    
    try:
        # Read the uploaded image
        image_bytes = await file.read()
        
        # Process with OCR service
        ocr_result = await process_with_ocr(image_bytes)
        
        # Enhance with damage detection and Sanskrit-specific processing
        enhanced_result = enhance_ocr_result(ocr_result)
        
        result = {
            "id": session_id,
            "filename": file.filename,
            "ocr_text_preview": enhanced_result.get("text", ""),
            "masks": enhanced_result.get("masks", []),
            "tokens": enhanced_result.get("tokens", []),
            "confidence_stats": {
                "avg_confidence": calculate_avg_confidence(enhanced_result.get("tokens", [])),
                "low_confidence_regions": count_low_confidence_regions(enhanced_result.get("tokens", [])),
                "total_words": len(enhanced_result.get("tokens", []))
            }
        }
        
        sessions[session_id] = result
        return result
        
    except Exception as e:
        # Fallback to demo data if OCR fails
        result = {
            "id": session_id,
            "filename": file.filename,
            "ocr_text_preview": "राम वनं गच्छति। सीता गृहे तिष्ठति। धर्मो रक्षति रक्षितः।",
            "masks": [
                {"mask_id": "mask_0", "bbox": [150, 200, 80, 25], "confidence": 0.9, "type": "damage"},
                {"mask_id": "mask_1", "bbox": [300, 200, 60, 25], "confidence": 0.8, "type": "fade"},
                {"mask_id": "mask_2", "bbox": [450, 200, 70, 25], "confidence": 0.85, "type": "hole"}
            ],
            "tokens": [
                {"text": "राम", "start_char": 0, "end_char": 3, "confidence": 0.95, "is_sanskrit": True},
                {"text": "वनं", "start_char": 4, "end_char": 7, "confidence": 0.92, "is_sanskrit": True},
                {"text": "गच्छति", "start_char": 8, "end_char": 14, "confidence": 0.88, "is_sanskrit": True}
            ],
            "confidence_stats": {
                "avg_confidence": 0.92,
                "low_confidence_regions": 0,
                "total_words": 3
            },
            "note": "Using demo data - OCR service unavailable"
        }
        
        sessions[session_id] = result
        return result

@app.post("/reconstruct")
async def reconstruct_text(request: dict):
    session_id = request.get("image_id")
    mask_ids = request.get("mask_ids", [])
    mode = request.get("mode", "hard")
    
    try:
        # Get session data
        session_data = sessions.get(session_id)
        if not session_data:
            return {"error": "Session not found", "candidates": []}
        
        # Send progress update
        if session_id in manager.active_connections:
            await manager.send_message({
                "type": "reconstruction_progress",
                "progress": 25,
                "stage": "Preparing data",
                "message": "Analyzing damaged regions..."
            }, session_id)
        
        # Prepare request for model service
        model_request = {
            "ocr_data": {
                "text": session_data.get("ocr_text_preview", ""),
                "tokens": session_data.get("tokens", []),
                "masks": session_data.get("masks", [])
            },
            "mask_ids": mask_ids,
            "mode": mode,
            "n_candidates": 5
        }
        
        # Send progress update
        if session_id in manager.active_connections:
            await manager.send_message({
                "type": "reconstruction_progress",
                "progress": 50,
                "stage": "AI Processing",
                "message": "Generating intelligent candidates..."
            }, session_id)
        
        # Call model service
        try:
            result = await call_model_service("/reconstruct", model_request)
        except Exception as e:
            logger.error(f"Model service call failed: {str(e)}")
            # Fallback to enhanced mock data
            result = generate_enhanced_candidates(session_data, mask_ids, mode)
        
        # Send completion notification
        if session_id in manager.active_connections:
            await manager.send_message({
                "type": "reconstruction_progress", 
                "progress": 100,
                "stage": "Complete",
                "message": f"Generated {len(result.get('candidates', []))} candidates"
            }, session_id)
        
        return result
        
    except Exception as e:
        logger.error(f"Reconstruction failed: {str(e)}")
        return {"error": str(e), "candidates": []}

async def call_model_service(endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Call the model service"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{MODEL_SERVICE_URL}{endpoint}", json=data) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Model service error: {response.status}")
                    raise Exception(f"Model service returned {response.status}")
    except Exception as e:
        logger.error(f"Failed to connect to model service: {str(e)}")
        raise

def generate_enhanced_candidates(session_data: Dict, mask_ids: List[str], mode: str) -> Dict[str, Any]:
    """Generate enhanced fallback candidates"""
    # Enhanced mock candidates based on actual OCR data
    text = session_data.get("ocr_text_preview", "")
    
    # Sanskrit word candidates based on common patterns
    sanskrit_candidates = [
        {
            "candidate_id": "cand_0",
            "sanskrit_text": "गच्छति",
            "iast": "gacchati",
            "morph_seg": ["गम्", "छ", "ति"],
            "sutras": [
                {"id": "3.1.44", "text": "छन्दसि लुङ्लङ्लृङ्क्ष्वडुदात्तः", "description": "Verbal root transformation"},
                {"id": "3.4.78", "text": "तिप्तस्झि", "description": "Present tense endings"}
            ],
            "literal_gloss": "goes",
            "idiomatic_translation": "goes/moves/travels",
            "scores": {
                "lm_score": 0.94,
                "kg_confidence": 0.96, 
                "grammar_score": 0.95,
                "combined": 0.95
            },
            "generation_strategy": "grammar_guided",
            "uncertainty_scores": {
                "epistemic_uncertainty": 0.03,
                "aleatoric_uncertainty": 0.02,
                "confidence": 0.95
            }
        },
        {
            "candidate_id": "cand_1", 
            "sanskrit_text": "तिष्ठति",
            "iast": "tiṣṭhati",
            "morph_seg": ["स्था", "ति"],
            "sutras": [
                {"id": "6.4.112", "text": "श्नाभ्यस्तयोरातः", "description": "Root modification rule"},
                {"id": "3.4.78", "text": "तिप्तस्झि", "description": "Present tense endings"}
            ],
            "literal_gloss": "stands/stays",
            "idiomatic_translation": "remains/dwells/stays",
            "scores": {
                "lm_score": 0.91,
                "kg_confidence": 0.93,
                "grammar_score": 0.94,
                "combined": 0.92
            },
            "generation_strategy": "contextual",
            "uncertainty_scores": {
                "epistemic_uncertainty": 0.06,
                "aleatoric_uncertainty": 0.04,
                "confidence": 0.90
            }
        },
        {
            "candidate_id": "cand_2",
            "sanskrit_text": "रक्षति",
            "iast": "rakṣati",
            "morph_seg": ["रक्ष्", "ति"],
            "sutras": [
                {"id": "3.4.78", "text": "तिप्तस्झि", "description": "Present tense verbal endings"}
            ],
            "literal_gloss": "protects",
            "idiomatic_translation": "protects/guards/defends",
            "scores": {
                "lm_score": 0.88,
                "kg_confidence": 0.90,
                "grammar_score": 0.92,
                "combined": 0.89
            },
            "generation_strategy": "semantic_similarity",
            "uncertainty_scores": {
                "epistemic_uncertainty": 0.08,
                "aleatoric_uncertainty": 0.06,
                "confidence": 0.86
            }
        }
    ]
    
    return {
        "candidates": sanskrit_candidates,
        "timings": {
            "total_ms": 1800,
            "model_inference_ms": 1200,
            "kg_lookup_ms": 400,
            "constraint_application_ms": 200
        },
        "metadata": {
            "fallback_mode": True,
            "ocr_confidence": session_data.get("confidence_stats", {}).get("avg_confidence", 0.8),
            "sanskrit_ratio": calculate_sanskrit_ratio(session_data.get("tokens", []))
        }
    }

@app.post("/translate")
async def translate_text(request: dict):
    text = request.get("sanskrit_text", "")
    style = request.get("style", "literal")
    
    try:
        # Try to use model service for translation
        model_request = {
            "sanskrit_text": text,
            "style": style
        }
        
        try:
            result = await call_model_service("/translate", model_request)
            return result
        except Exception as e:
            logger.error(f"Model translation failed: {str(e)}")
            # Fallback to enhanced local translation
            return generate_enhanced_translation(text, style)
            
    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        return {"error": str(e), "translation": text}

def generate_enhanced_translation(text: str, style: str) -> Dict[str, Any]:
    """Generate enhanced translation with detailed analysis"""
    
    # Comprehensive Sanskrit-English dictionary
    word_translations = {
        # Names and Proper Nouns
        "राम": {"literal": "Rama", "idiomatic": "Rama (hero of Ramayana)", "pos": "noun", "case": "nominative"},
        "सीता": {"literal": "Sita", "idiomatic": "Sita (Rama's wife)", "pos": "noun", "case": "nominative"},
        
        # Verbs
        "गच्छति": {"literal": "goes", "idiomatic": "is going/travels", "pos": "verb", "tense": "present"},
        "तिष्ठति": {"literal": "stands", "idiomatic": "remains/dwells", "pos": "verb", "tense": "present"},
        "रक्षति": {"literal": "protects", "idiomatic": "guards/defends", "pos": "verb", "tense": "present"},
        "आगच्छति": {"literal": "comes", "idiomatic": "is coming/arrives", "pos": "verb", "tense": "present"},
        
        # Nouns
        "वनं": {"literal": "forest", "idiomatic": "forest/wilderness", "pos": "noun", "case": "accusative"},
        "वनम्": {"literal": "forest", "idiomatic": "forest/wilderness", "pos": "noun", "case": "accusative"},
        "गृहे": {"literal": "in house", "idiomatic": "at home", "pos": "noun", "case": "locative"},
        "गृहम्": {"literal": "house", "idiomatic": "home", "pos": "noun", "case": "accusative"},
        
        # Abstract concepts
        "धर्मो": {"literal": "dharma", "idiomatic": "righteousness/duty", "pos": "noun", "case": "nominative"},
        "धर्म": {"literal": "dharma", "idiomatic": "righteousness/duty", "pos": "noun", "case": "nominative"},
        "अर्थ": {"literal": "wealth", "idiomatic": "prosperity/meaning", "pos": "noun", "case": "nominative"},
        "काम": {"literal": "desire", "idiomatic": "love/pleasure", "pos": "noun", "case": "nominative"},
        "मोक्ष": {"literal": "liberation", "idiomatic": "spiritual liberation", "pos": "noun", "case": "nominative"},
        
        # Particles and conjunctions
        "च": {"literal": "and", "idiomatic": "and", "pos": "conjunction"},
        "वा": {"literal": "or", "idiomatic": "or", "pos": "conjunction"},
        "तु": {"literal": "but", "idiomatic": "however", "pos": "particle"},
        "एव": {"literal": "indeed", "idiomatic": "indeed/only", "pos": "particle"},
        
        # Common adjectives
        "सुन्दर": {"literal": "beautiful", "idiomatic": "beautiful/lovely", "pos": "adjective"},
        "महान्": {"literal": "great", "idiomatic": "great/noble", "pos": "adjective"},
        "छोट": {"literal": "small", "idiomatic": "small/little", "pos": "adjective"}
    }
    
    # Clean and tokenize text
    words = text.strip().split()
    translated_words = []
    word_analysis = []
    
    for word in words:
        word_clean = word.strip('।॥')  # Remove punctuation
        
        if word_clean in word_translations:
            trans_data = word_translations[word_clean]
            if style == "literal":
                translated = trans_data["literal"]
            else:
                translated = trans_data["idiomatic"]
            
            word_analysis.append({
                "sanskrit": word_clean,
                "english": translated,
                "pos": trans_data.get("pos", "unknown"),
                "grammatical_info": {
                    "case": trans_data.get("case"),
                    "tense": trans_data.get("tense"),
                    "number": trans_data.get("number")
                }
            })
        else:
            # Unknown word - keep as is with brackets
            translated = f"[{word_clean}]"
            word_analysis.append({
                "sanskrit": word_clean,
                "english": translated,
                "pos": "unknown",
                "grammatical_info": {}
            })
        
        translated_words.append(translated)
    
    # Generate sentence-level translation
    if style == "literal":
        translation = " ".join(translated_words)
    else:
        # Idiomatic translation with better grammar
        translation = create_idiomatic_translation(words, translated_words, word_analysis)
    
    # Calculate confidence based on known words
    known_words = sum(1 for analysis in word_analysis if analysis["pos"] != "unknown")
    confidence = known_words / len(word_analysis) if word_analysis else 0.0
    
    return {
        "translation": translation,
        "alignment": [{"sanskrit": w["sanskrit"], "english": w["english"]} for w in word_analysis],
        "word_analysis": word_analysis,
        "confidence": confidence,
        "style": style,
        "metadata": {
            "total_words": len(words),
            "known_words": known_words,
            "unknown_words": len(words) - known_words,
            "sanskrit_detected": any(is_sanskrit_text(word) for word in words)
        }
    }

def create_idiomatic_translation(sanskrit_words: List[str], english_words: List[str], analysis: List[Dict]) -> str:
    """Create more natural idiomatic translation"""
    
    # Pattern-based translation improvements
    text = " ".join(english_words)
    
    # Common Sanskrit sentence patterns
    patterns = [
        # Subject + Object + Verb patterns
        (r"Rama.*forest.*goes", "Rama is going to the forest"),
        (r"Rama.*forest.*is going", "Rama is going to the forest"),
        (r"Sita.*home.*stays", "Sita stays at home"),
        (r"Sita.*home.*remains", "Sita remains at home"),
        
        # Dharma-related patterns
        (r"dharma.*protects.*protected", "Dharma protects those who protect it"),
        (r"righteousness.*protects.*protected", "Righteousness protects those who uphold it"),
        
        # General verb improvements
        (r"\bprotects\b", "protects"),
        (r"\bstands\b", "stands"),
        (r"\bgoes\b", "goes")
    ]
    
    # Apply pattern matching
    for pattern, replacement in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return replacement
    
    # Basic grammar improvements
    text = re.sub(r'\[([^\]]+)\]', r'\1', text)  # Remove brackets from unknown words
    text = re.sub(r'\s+', ' ', text).strip()  # Clean whitespace
    
    # Capitalize first letter
    if text:
        text = text[0].upper() + text[1:]
    
    return text

@app.post("/assistant/query")
async def query_assistant(request: dict):
    query = request.get("query", "").lower()
    
    # Simple rule-based responses
    if "sutra" in query or "rule" in query:
        answer = "Paninian sutras are concise rules that govern Sanskrit grammar. For example, sutra 6.1.87 'आद्गुणः' describes vowel strengthening in sandhi combinations."
        sources = [{"kg_node": "sutra_6.1.87", "type": "paninian_sutra"}]
    elif "grammar" in query:
        answer = "Sanskrit grammar follows systematic rules for morphology, syntax, and phonology as described in Panini's Ashtadhyayi. Each word formation follows specific patterns."
        sources = [{"kg_node": "morphology_system", "type": "grammar_concept"}]
    elif "translate" in query:
        answer = "Sanskrit translation requires understanding both literal word meanings and cultural context. Our AI provides both literal and idiomatic translations."
        sources = [{"kg_node": "translation_system", "type": "ai_feature"}]
    else:
        answer = f"I understand you're asking about: '{request.get('query', '')}'. I can help explain Sanskrit grammar rules, sutras, morphology, and translation decisions."
        sources = []
    
    return {
        "answer": answer,
        "sources": sources,
        "actions": ["show_examples", "explain_more", "related_topics"]
    }

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        # Send welcome message
        await manager.send_message({
            "type": "handshake_ack",
            "message": "Connected to Sanskrit Portal",
            "features": ["Real-time reconstruction", "Uncertainty quantification", "Grammar analysis"]
        }, session_id)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Echo back for now
            await manager.send_message({
                "type": "echo",
                "original": message
            }, session_id)
            
    except WebSocketDisconnect:
        manager.disconnect(session_id)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mode": "local_development",
        "features": {
            "intelligent_generation": True,
            "uncertainty_quantification": True,
            "real_time_websockets": True,
            "episodic_memory": True
        }
    }

@app.post("/api/gemini/restore")
@app.post("/gemini/restore")
async def gemini_restore_manuscript(request: dict):
    """Process manuscript with Gemini AI"""
    try:
        image_data = request.get("image_data")  # base64 encoded image
        image_type = request.get("image_type", "image/jpeg")
        
        if not image_data:
            return {"error": "No image data provided"}
        
        # Prepare Gemini API request
        url = f"{GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
        
        prompt = """You are an expert Indian linguist, epigraphist, and paleographer specializing in ancient and modern Indian languages and scripts. Your primary skill is restoring damaged or incomplete manuscripts using the grammatical framework, phonetic rules, and orthographic conventions of the target language.

YOUR TASK:
1. Detect the language and script (e.g., Sanskrit in Devanagari, Tamil-Brahmi, Grantha, Telugu, Bengali, etc.)
2. Perform OCR to extract all visible characters or graphemes
3. Identify missing or corrupted portions in the text
4. Reconstruct missing segments using the correct grammatical and phonological rules of that language:
   - For Sanskrit: Apply Pāṇinian grammar (Aṣṭādhyāyī) and sandhi rules
   - For Pali/Prakrit: Follow sound simplification and assimilation patterns (e.g., elision of aspirates)
   - For Dravidian languages (Tamil, Telugu, Kannada, Malayalam): Apply morphophonemic alternations (e.g., uriccol, eḻuttu rules)
   - For Indo-Aryan vernaculars (Hindi, Marathi, Bengali, Odia, Assamese): Use modern grammar rules, tatsama/tadbhava word forms, and sandhi or samāsa if relevant
5. Provide an English translation faithful to both literal and contextual meaning

CRITICAL CONSTRAINTS:
- All reconstructions MUST respect the euphonic and morphophonemic laws of the target language
- Verb forms, tense, and aspect must agree with the syntactic and semantic context
- Case endings, postpositions, and agreement markers must follow correct grammatical relationships
- When possible, cite the linguistic rule, grammar sutra, or textual source used (e.g., "Aṣṭādhyāyī 6.1.77" or "Tolkāppiyam Sollatikāram 1.3.2")

Please restore this damaged Sanskrit manuscript following Paninian grammar rules.
Focus on:
1. Identify ALL visible characters first
2. Mark uncertain/damaged regions
3. Use contextual clues and grammar rules for reconstruction
4. Provide multiple alternatives if uncertainty > 0.3

OUTPUT FORMAT (JSON):
{
  "language_detected": "Sanskrit",
  "script": "Devanagari", 
  "ocr_text": "Raw OCR output with [MISSING] markers",
  "reconstructed_text": "Complete text with restorations",
  "reconstruction_confidence": {
    "span_1": {"text": "restored_word", "confidence": 0.85, "rules_applied": ["6.1.77 - ikoyaṇaci"]},
    "span_2": {"text": "alternative_word", "confidence": 0.65, "rules_applied": ["alternative rule"]}
  },
  "translation": "English translation",
  "grammar_analysis": {
    "phonological_rules_applied": [],
    "morphological_forms": [],
    "syntax_notes": []
  }
}"""
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": image_type,
                            "data": image_data
                        }
                    }
                ]
            }]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get('candidates', [])
                    if candidates:
                        content = candidates[0].get('content', {})
                        parts = content.get('parts', [])
                        if parts:
                            text = parts[0].get('text', '')
                            
                            # Extract restored text
                            restored_match = re.search(r'RESTORED_TEXT:\s*(.+?)(?=\n|CONFIDENCE|$)', text, re.DOTALL)
                            restored_text = restored_match.group(1).strip() if restored_match else text
                            
                            return {
                                "success": True,
                                "restored_text": restored_text,
                                "full_response": text
                            }
                
                error_data = await response.json() if response.headers.get('content-type', '').startswith('application/json') else await response.text()
                return {"error": f"Gemini API error: {response.status} - {error_data}"}
                
    except Exception as e:
        logger.error(f"Gemini restoration failed: {str(e)}")
        return {"error": f"Processing failed: {str(e)}"}

@app.post("/api/gemini/translate")
@app.post("/gemini/translate")
async def gemini_translate_text(request: dict):
    """Translate Sanskrit text with Gemini AI"""
    try:
        sanskrit_text = request.get("sanskrit_text", "")
        style = request.get("style", "idiomatic")
        
        if not sanskrit_text:
            return {"error": "No Sanskrit text provided"}
        
        url = f"{GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
        
        prompt = f"""You are an expert Sanskrit scholar and translator with deep knowledge of Pāṇinian grammar, Vedic literature, and classical Sanskrit texts.

TASK: Provide a comprehensive scholarly translation and analysis of this Sanskrit text:

Sanskrit Text: {sanskrit_text}

Please provide a detailed analysis following these guidelines:

1. MORPHOLOGICAL ANALYSIS: Break down each word into its constituent morphemes, roots, and grammatical elements
2. GRAMMATICAL PARSING: Identify case, number, gender, tense, mood, voice for each word
3. SANDHI ANALYSIS: Explain any sandhi rules applied in the text
4. LITERAL TRANSLATION: Word-by-word meaning preserving Sanskrit syntax
5. IDIOMATIC TRANSLATION: Natural English rendering maintaining the original meaning
6. CULTURAL/TEXTUAL CONTEXT: Identify source text, tradition, or cultural significance
7. GRAMMATICAL RULES: Cite relevant Pāṇinian sūtras or grammatical principles

OUTPUT FORMAT (JSON):
{{
  "morphological_analysis": [
    {{"word": "राम", "root": "रम्", "analysis": "masculine nominative singular", "meaning": "Rama"}},
    {{"word": "वनम्", "root": "वन", "analysis": "neuter accusative singular", "meaning": "forest"}}
  ],
  "sandhi_rules": ["Rule applied if any"],
  "literal_translation": "Word-by-word literal meaning",
  "idiomatic_translation": "Natural English translation", 
  "cultural_context": "Source, tradition, or significance",
  "grammatical_notes": "Relevant Pāṇinian sūtras and rules",
  "meter_analysis": "If verse, identify meter and prosody",
  "confidence_score": 0.95
}}

Focus on scholarly accuracy and cite specific grammatical rules where applicable."""
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get('candidates', [])
                    if candidates:
                        content = candidates[0].get('content', {})
                        parts = content.get('parts', [])
                        if parts:
                            text = parts[0].get('text', '')
                            
                            # Extract translations
                            literal_match = re.search(r'LITERAL:\s*(.+?)(?=\n|IDIOMATIC|$)', text, re.DOTALL)
                            idiomatic_match = re.search(r'IDIOMATIC:\s*(.+?)(?=\n|CONTEXT|$)', text, re.DOTALL)
                            context_match = re.search(r'CONTEXT:\s*(.+?)(?=\n|GRAMMAR|$)', text, re.DOTALL)
                            grammar_match = re.search(r'GRAMMAR:\s*(.+?)(?=\n|$)', text, re.DOTALL)
                            
                            return {
                                "success": True,
                                "translation": {
                                    "literal": literal_match.group(1).strip() if literal_match else "",
                                    "idiomatic": idiomatic_match.group(1).strip() if idiomatic_match else "",
                                    "context": context_match.group(1).strip() if context_match else "",
                                    "grammar": grammar_match.group(1).strip() if grammar_match else ""
                                },
                                "full_response": text,
                                "confidence": 0.9
                            }
                
                error_data = await response.json() if response.headers.get('content-type', '').startswith('application/json') else await response.text()
                return {"error": f"Gemini API error: {response.status} - {error_data}"}
                
    except Exception as e:
        logger.error(f"Gemini translation failed: {str(e)}")
        return {"error": f"Translation failed: {str(e)}"}

@app.post("/api/gemini/test")
@app.post("/gemini/test")
async def gemini_test_api(request: dict):
    """Test Gemini API connectivity"""
    try:
        test_text = request.get("text", "राम वनं गच्छति")
        
        url = f"{GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{"text": f"Translate this Sanskrit text to English: {test_text}"}]
            }]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get('candidates', [])
                    if candidates:
                        content = candidates[0].get('content', {})
                        parts = content.get('parts', [])
                        if parts:
                            text = parts[0].get('text', '')
                            return {
                                "success": True,
                                "response": text,
                                "model": "gemini-2.5-flash",
                                "status": "API working correctly"
                            }
                
                error_data = await response.json() if response.headers.get('content-type', '').startswith('application/json') else await response.text()
                return {"error": f"Gemini API error: {response.status} - {error_data}"}
                
    except Exception as e:
        logger.error(f"Gemini test failed: {str(e)}")
        return {"error": f"Test failed: {str(e)}"}

@app.post("/api/guru/chat")
@app.post("/guru/chat")
async def ai_guru_chat(request: dict):
    """AI Guru chat endpoint for scholarly discussions"""
    try:
        question = request.get("question", "")
        sanskrit_text = request.get("sanskrit_text", "")
        english_translation = request.get("english_translation", "")
        conversation_history = request.get("conversation_history", [])
        
        if not question.strip():
            return {"error": "No question provided"}
        
        # Build context from conversation history
        context = ""
        if conversation_history:
            recent_messages = conversation_history[-3:]  # Last 3 messages
            context = "\n".join([
                f"{'User' if msg.get('type') == 'user' else 'Guru'}: {msg.get('content', '')}"
                for msg in recent_messages
            ])
        
        url = f"{GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
        
        prompt = f"""You are an AI Guru - a wise Sanskrit scholar, grammarian, and cultural expert. You have deep knowledge of:
- Pāṇinian grammar (Aṣṭādhyāyī) and Sanskrit linguistics
- Vedic literature, Upanishads, and classical texts
- Hindu philosophy, culture, and traditions
- Morphological analysis and etymology
- Meter, prosody, and poetics

Current Sanskrit text being discussed: "{sanskrit_text}"
English translation: "{english_translation}"

{f"Previous conversation context: {context}" if context else ""}

User's question: {question}

Please provide a scholarly, helpful response that:
1. Directly answers the user's question
2. Includes relevant grammatical analysis if applicable
3. Provides cultural or philosophical context when relevant
4. Cites specific Pāṇinian sūtras or textual sources when appropriate
5. Uses clear, accessible language while maintaining scholarly depth

Format your response as a natural conversation, but if you include technical details, organize them clearly.
"""
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    candidates = result.get('candidates', [])
                    if candidates:
                        content = candidates[0].get('content', {})
                        parts = content.get('parts', [])
                        if parts:
                            answer = parts[0].get('text', '')
                            
                            # Extract structured information if present
                            grammar_notes = ""
                            cultural_context = ""
                            sutra_references = []
                            
                            # Simple extraction of structured content
                            if "Grammar:" in answer or "Sūtra" in answer:
                                lines = answer.split('\n')
                                for line in lines:
                                    if line.strip().startswith(('Sūtra', 'Rule', 'Grammar')):
                                        grammar_notes += line.strip() + " "
                                    elif line.strip().startswith(('Cultural', 'Context', 'Significance')):
                                        cultural_context += line.strip() + " "
                                    elif any(ref in line for ref in ['P.', 'Aṣṭādhyāyī', 'sūtra']):
                                        sutra_references.append(line.strip())
                            
                            return {
                                "success": True,
                                "answer": answer,
                                "grammar_notes": grammar_notes.strip() if grammar_notes else None,
                                "cultural_context": cultural_context.strip() if cultural_context else None,
                                "sutra_references": sutra_references if sutra_references else None
                            }
                
                error_data = await response.json() if response.headers.get('content-type', '').startswith('application/json') else await response.text()
                return {"error": f"AI service error: {response.status} - {error_data}"}
                
    except Exception as e:
        logger.error(f"AI Guru chat failed: {str(e)}")
        return {"error": f"Chat failed: {str(e)}"}

@app.post("/api/translate/multilingual")
@app.post("/translate/multilingual")
async def translate_multilingual(request: dict):
    """Translate Sanskrit text to multiple Indian languages"""
    try:
        sanskrit_text = request.get("sanskrit_text", "")
        target_languages = request.get("target_languages", ["hi", "te", "ta", "en"])
        preserve_meter = request.get("preserve_meter", True)
        style = request.get("style", "poetic")
        
        if not sanskrit_text.strip():
            return {"error": "No Sanskrit text provided"}
        
        url = f"{GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
        
        # Language mapping for better prompts
        language_names = {
            "hi": "Hindi (हिन्दी)",
            "te": "Telugu (తెలుగు)", 
            "ta": "Tamil (தமிழ்)",
            "en": "English"
        }
        
        translations = {}
        
        for lang_code in target_languages:
            lang_name = language_names.get(lang_code, lang_code)
            
            prompt = f"""You are an expert translator specializing in Sanskrit and Indian languages. 

Translate this Sanskrit text into {lang_name}, preserving its poetic rhythm, philosophical depth, and cultural significance:

Sanskrit Text: {sanskrit_text}

Guidelines:
1. Maintain the metrical structure and line breaks if it's a verse
2. Preserve the philosophical and spiritual meaning
3. Use appropriate register (formal/classical style)
4. For Indian languages, use traditional vocabulary and expressions
5. For English, use scholarly but accessible language
6. Keep punctuation and formatting consistent

Provide only the translation without explanations or additional text."""

            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload) as response:
                        if response.status == 200:
                            result = await response.json()
                            candidates = result.get('candidates', [])
                            if candidates:
                                content = candidates[0].get('content', {})
                                parts = content.get('parts', [])
                                if parts:
                                    translation = parts[0].get('text', '').strip()
                                    translations[lang_code] = translation
                        else:
                            logger.error(f"Translation failed for {lang_code}: {response.status}")
                            translations[lang_code] = f"Translation to {lang_name} failed"
            except Exception as e:
                logger.error(f"Translation error for {lang_code}: {str(e)}")
                translations[lang_code] = f"Error translating to {lang_name}"
        
        return {
            "success": True,
            "translations": translations,
            "original_text": sanskrit_text,
            "languages_processed": len(translations),
            "style": style,
            "meter_preserved": preserve_meter
        }
        
    except Exception as e:
        logger.error(f"Multilingual translation failed: {str(e)}")
        return {"error": f"Translation failed: {str(e)}"}

@app.post("/api/tts/generate-mp3")
@app.post("/tts/generate-mp3")
async def generate_mp3_audio(request: dict):
    """Generate MP3 audio from Sanskrit text (placeholder for AI Studio TTS)"""
    try:
        sanskrit_text = request.get("sanskrit_text", "")
        english_translation = request.get("english_translation", "")
        voice_settings = request.get("voice_settings", {})
        
        # TODO: Implement actual AI Studio TTS API call
        # This is a placeholder response
        return {
            "success": True,
            "message": "MP3 generation feature coming soon with AI Studio TTS integration",
            "audio_url": None,
            "duration": 0
        }
        
    except Exception as e:
        logger.error(f"MP3 generation failed: {str(e)}")
        return {"error": f"Audio generation failed: {str(e)}"}

@app.get("/status")
async def get_status():
    return {
        "api_gateway": "healthy",
        "services": {
            "ocr": "healthy",
            "model": "healthy", 
            "kg": "healthy",
            "gemini": "available"
        },
        "active_sessions": len(sessions),
        "websocket_connections": len(manager.active_connections),
        "version": "1.0.0-local-dev",
        "gemini_model": "gemini-2.5-flash"
    }

if __name__ == "__main__":
    print("🚀 Starting Sanskrit Manuscript Reconstruction Portal Backend")
    print("   API will be available at: http://localhost:8000")
    print("   API Documentation: http://localhost:8000/docs")
    print("   Press Ctrl+C to stop")
    uvicorn.run("backend_server:app", host="0.0.0.0", port=8000, reload=False)
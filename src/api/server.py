"""
FastAPI Gateway for Sanskrit Manuscript Reconstruction Portal
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import uuid
import json
import os
from datetime import datetime
import logging
import asyncio
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sanskrit Manuscript Reconstruction API",
    description="API for OCR, reconstruction, translation, and analysis of Sanskrit manuscripts",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs from environment
OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://localhost:8001")
MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://localhost:8002")

# Pydantic models
class UploadResponse(BaseModel):
    id: str
    ocr_text_preview: str
    masks: List[Dict[str, Any]]
    tokens: List[Dict[str, Any]]

class ReconstructRequest(BaseModel):
    image_id: str
    mask_ids: List[str]
    mode: str = "hard"  # soft|hard
    n_candidates: int = 5

class ReconstructionCandidate(BaseModel):
    candidate_id: str
    sanskrit_text: str
    iast: str
    morph_seg: List[str]
    sutras: List[Dict[str, str]]
    literal_gloss: str
    idiomatic_translation: str
    scores: Dict[str, float]

class ReconstructResponse(BaseModel):
    candidates: List[ReconstructionCandidate]
    timings: Dict[str, float]

class TranslateRequest(BaseModel):
    sanskrit_text: str
    style: str = "literal"  # literal|idiomatic

class AssistantQuery(BaseModel):
    query: str
    context: Optional[Dict[str, str]] = None

class AssistantResponse(BaseModel):
    answer: str
    sources: List[Dict[str, str]]
    actions: List[str]

# In-memory storage for demo (replace with Redis/DB in production)
session_store = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected for session: {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket disconnected for session: {session_id}")
    
    async def send_personal_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to {session_id}: {e}")
                self.disconnect(session_id)
    
    async def broadcast(self, message: dict):
        disconnected = []
        for session_id, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to broadcast to {session_id}: {e}")
                disconnected.append(session_id)
        
        # Clean up disconnected connections
        for session_id in disconnected:
            self.disconnect(session_id)

manager = ConnectionManager()

@app.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload manuscript image and perform initial OCR"""
    try:
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Save uploaded file
        upload_dir = "data/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = f"{upload_dir}/{session_id}_{file.filename}"
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Call OCR service
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                files = {"file": (file.filename, f, file.content_type)}
                ocr_response = await client.post(
                    f"{OCR_SERVICE_URL}/ocr",
                    files=files,
                    timeout=30.0
                )
        
        if ocr_response.status_code != 200:
            raise HTTPException(status_code=500, detail="OCR service failed")
        
        ocr_data = ocr_response.json()
        
        # Store session data
        session_store[session_id] = {
            "file_path": file_path,
            "ocr_data": ocr_data,
            "created_at": datetime.now().isoformat()
        }
        
        return UploadResponse(
            id=session_id,
            ocr_text_preview=ocr_data.get("text", "")[:200] + "...",
            masks=ocr_data.get("masks", []),
            tokens=ocr_data.get("tokens", [])
        )
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reconstruct", response_model=ReconstructResponse)
async def reconstruct_text(request: ReconstructRequest, background_tasks: BackgroundTasks):
    """Reconstruct damaged text using Intelligent Sanskrit Generator"""
    try:
        if request.image_id not in session_store:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_data = session_store[request.image_id]
        
        # Send progress update via WebSocket
        await manager.send_personal_message({
            "type": "reconstruction_progress",
            "progress": 10,
            "stage": "Initializing",
            "message": "Preparing intelligent reconstruction..."
        }, request.image_id)
        
        # Call model service with enhanced data
        async with httpx.AsyncClient() as client:
            model_response = await client.post(
                f"{MODEL_SERVICE_URL}/reconstruct",
                json={
                    "ocr_data": session_data["ocr_data"],
                    "mask_ids": request.mask_ids,
                    "mode": request.mode,
                    "n_candidates": request.n_candidates,
                    "enable_streaming": True,
                    "enable_uncertainty": True,
                    "enable_memory": True,
                    "session_id": request.image_id
                },
                timeout=120.0
            )
        
        if model_response.status_code != 200:
            await manager.send_personal_message({
                "type": "error",
                "message": "Model service failed",
                "code": model_response.status_code
            }, request.image_id)
            raise HTTPException(status_code=500, detail="Model service failed")
        
        result = model_response.json()
        
        # Send completion notification
        await manager.send_personal_message({
            "type": "reconstruction_progress",
            "progress": 100,
            "stage": "Complete",
            "message": f"Generated {len(result.get('candidates', []))} candidates"
        }, request.image_id)
        
        # Store results in session
        session_data["reconstruction_results"] = result
        
        return result
        
    except Exception as e:
        logger.error(f"Reconstruction failed: {str(e)}")
        await manager.send_personal_message({
            "type": "error",
            "message": str(e),
            "code": 500
        }, request.image_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate_text(request: TranslateRequest):
    """Generate English translation of Sanskrit text"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MODEL_SERVICE_URL}/translate",
                json=request.dict(),
                timeout=30.0
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Translation service failed")
        
        return response.json()
        
    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assistant/query", response_model=AssistantResponse)
async def query_assistant(request: AssistantQuery):
    """Query the Intelligent Manuscript Assistant"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MODEL_SERVICE_URL}/assistant",
                json=request.dict(),
                timeout=30.0
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Assistant service failed")
        
        return response.json()
        
    except Exception as e:
        logger.error(f"Assistant query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/{image_id}")
async def export_results(image_id: str, format: str = "json"):
    """Export reconstruction results in specified format"""
    try:
        if image_id not in session_store:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_data = session_store[image_id]
        
        if format == "json":
            content = json.dumps(session_data, indent=2)
            media_type = "application/json"
            filename = f"manuscript_{image_id}.json"
        elif format == "tei":
            # Generate TEI/XML format
            content = generate_tei_xml(session_data)
            media_type = "application/xml"
            filename = f"manuscript_{image_id}.xml"
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")
        
        return StreamingResponse(
            iter([content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_tei_xml(session_data: Dict) -> str:
    """Generate TEI/XML format for manuscript data"""
    # Basic TEI template - expand as needed
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
    <teiHeader>
        <fileDesc>
            <titleStmt>
                <title>Sanskrit Manuscript Reconstruction</title>
            </titleStmt>
            <publicationStmt>
                <p>Generated by SMRP on {datetime.now().isoformat()}</p>
            </publicationStmt>
        </fileDesc>
    </teiHeader>
    <text>
        <body>
            <div type="manuscript">
                <p>{session_data.get('ocr_data', {}).get('text', '')}</p>
            </div>
        </body>
    </text>
</TEI>"""

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            await handle_websocket_message(message, session_id)
            
    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        manager.disconnect(session_id)

async def handle_websocket_message(message: dict, session_id: str):
    """Handle incoming WebSocket messages"""
    message_type = message.get("type")
    
    if message_type == "handshake":
        await manager.send_personal_message({
            "type": "handshake_ack",
            "message": "Connected to Intelligent Sanskrit Generator",
            "features": [
                "Real-time reconstruction",
                "Uncertainty quantification", 
                "Episodic memory",
                "Multi-modal understanding"
            ]
        }, session_id)
    
    elif message_type == "mask_selection":
        mask_ids = message.get("maskIds", [])
        await manager.send_personal_message({
            "type": "context_update",
            "context": {
                "selected_masks": mask_ids,
                "timestamp": datetime.now().isoformat()
            }
        }, session_id)
    
    elif message_type == "user_feedback":
        feedback = message.get("feedback", {})
        # Process user feedback for model adaptation
        await process_user_feedback(feedback, session_id)
    
    elif message_type == "assistant_query":
        query = message.get("query", "")
        context = message.get("context", {})
        # Handle assistant query
        await handle_assistant_query(query, context, session_id)

async def process_user_feedback(feedback: dict, session_id: str):
    """Process user feedback for continuous learning"""
    try:
        # Send feedback to model service for adaptation
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MODEL_SERVICE_URL}/feedback",
                json={
                    "session_id": session_id,
                    "feedback": feedback,
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        if response.status_code == 200:
            await manager.send_personal_message({
                "type": "notification",
                "message": "Feedback processed - model is learning from your input!",
                "type": "success"
            }, session_id)
    
    except Exception as e:
        logger.error(f"Failed to process feedback: {e}")

async def handle_assistant_query(query: str, context: dict, session_id: str):
    """Handle assistant queries via WebSocket"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MODEL_SERVICE_URL}/assistant",
                json={
                    "query": query,
                    "context": {**context, "session_id": session_id},
                    "streaming": True
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            await manager.send_personal_message({
                "type": "assistant_response",
                "response": result
            }, session_id)
    
    except Exception as e:
        logger.error(f"Assistant query failed: {e}")
        await manager.send_personal_message({
            "type": "error",
            "message": "Assistant query failed",
            "code": 500
        }, session_id)

# Additional endpoints for enhanced functionality
@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session data"""
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session_store[session_id]

@app.post("/session/{session_id}/feedback")
async def submit_feedback(session_id: str, feedback: dict):
    """Submit user feedback for model improvement"""
    await process_user_feedback(feedback, session_id)
    return {"status": "success", "message": "Feedback submitted"}

@app.get("/analytics/metrics/{session_id}")
async def get_metrics(session_id: str, range: str = "1h"):
    """Get performance metrics for session"""
    # Mock metrics - implement actual analytics
    return {
        "processing_time": {"avg": 2.3, "min": 1.1, "max": 4.2},
        "accuracy": {"reconstruction": 0.87, "translation": 0.82},
        "confidence": {"avg": 0.79, "distribution": [0.1, 0.2, 0.3, 0.25, 0.15]},
        "user_satisfaction": 4.2
    }

@app.get("/kg/search")
async def search_knowledge_graph(q: str):
    """Search knowledge graph"""
    # Mock KG search - implement actual search
    return {
        "results": [
            {"id": "sutra_6.1.87", "type": "sutra", "text": "आद्गुणः", "relevance": 0.95},
            {"id": "rule_sandhi_vowel", "type": "rule", "text": "Vowel sandhi", "relevance": 0.82}
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "features": {
            "intelligent_generation": True,
            "uncertainty_quantification": True,
            "real_time_websockets": True,
            "episodic_memory": True,
            "multi_modal": True
        },
        "active_connections": len(manager.active_connections)
    }

@app.get("/status")
async def get_status():
    """Get detailed system status"""
    try:
        # Check service health
        services_status = {}
        
        async with httpx.AsyncClient() as client:
            # Check OCR service
            try:
                ocr_response = await client.get(f"{OCR_SERVICE_URL}/health", timeout=5.0)
                services_status["ocr"] = "healthy" if ocr_response.status_code == 200 else "unhealthy"
            except:
                services_status["ocr"] = "unreachable"
            
            # Check model service
            try:
                model_response = await client.get(f"{MODEL_SERVICE_URL}/health", timeout=5.0)
                services_status["model"] = "healthy" if model_response.status_code == 200 else "unhealthy"
            except:
                services_status["model"] = "unreachable"
        
        return {
            "api_gateway": "healthy",
            "services": services_status,
            "active_sessions": len(session_store),
            "websocket_connections": len(manager.active_connections),
            "uptime": "running",
            "version": "1.0.0-intelligent"
        }
    
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {"status": "error", "message": str(e)}

# Serve React app in production
if os.getenv("SERVE_FRONTEND", "false").lower() == "true":
    app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, ws_ping_interval=20, ws_ping_timeout=10)
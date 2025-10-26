# API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently using session-based authentication. JWT authentication will be implemented for production.

## Common Response Format
```json
{
  "status": "success|error",
  "data": { ... },
  "message": "Optional message",
  "metadata": {
    "request_id": "uuid",
    "timestamp": "ISO 8601",
    "processing_time_ms": 1250
  }
}
```

## Endpoints

### 1. Upload Manuscript Image

**POST** `/upload`

Upload a manuscript image for OCR processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Image file

**Response:**
```json
{
  "id": "session_uuid",
  "ocr_text_preview": "राम वनं गच्छति...",
  "masks": [
    {
      "mask_id": "mask_0",
      "bbox": [x, y, width, height],
      "confidence": 0.85,
      "type": "damage"
    }
  ],
  "tokens": [
    {
      "text": "राम",
      "start_char": 0,
      "end_char": 3,
      "confidence": 0.95,
      "is_sanskrit": true
    }
  ]
}
```

### 2. Reconstruct Damaged Text

**POST** `/reconstruct`

Reconstruct damaged text regions using PaniniT5 model.

**Request:**
```json
{
  "image_id": "session_uuid",
  "mask_ids": ["mask_0", "mask_1"],
  "mode": "hard",
  "n_candidates": 5
}
```

**Response:**
```json
{
  "candidates": [
    {
      "candidate_id": "cand_0",
      "sanskrit_text": "सीता",
      "iast": "sītā",
      "morph_seg": ["सीता"],
      "sutras": [
        {
          "id": "6.1.87",
          "text": "आद्गुणः",
          "description": "Vowel strengthening rule"
        }
      ],
      "literal_gloss": "Sita",
      "idiomatic_translation": "Sita",
      "scores": {
        "lm_score": 0.92,
        "kg_confidence": 0.95,
        "combined": 0.93
      }
    }
  ],
  "timings": {
    "total_ms": 1250,
    "model_inference_ms": 1000,
    "kg_lookup_ms": 250
  }
}
```

### 3. Translate Sanskrit Text

**POST** `/translate`

Generate English translation of Sanskrit text.

**Request:**
```json
{
  "sanskrit_text": "राम वनं गच्छति",
  "style": "literal"
}
```

**Response:**
```json
{
  "translation": "Rama goes to the forest",
  "alignment": [
    {"sanskrit": "राम", "english": "Rama"},
    {"sanskrit": "वनं", "english": "forest"},
    {"sanskrit": "गच्छति", "english": "goes"}
  ],
  "confidence": 0.87
}
```

### 4. Query Assistant

**POST** `/assistant/query`

Query the Intelligent Manuscript Assistant.

**Request:**
```json
{
  "query": "Explain the grammar rule for गच्छति",
  "context": {
    "image_id": "session_uuid",
    "candidate_id": "cand_0"
  }
}
```

**Response:**
```json
{
  "answer": "The word 'गच्छति' is the 3rd person singular present tense form...",
  "sources": [
    {
      "kg_node": "sutra_3.4.78",
      "type": "paninian_sutra",
      "text": "तिप्तस्झिसिप्थस्थमिब्वस्मस्तातांझथासाथांध्वमिड्वहिमहिङ्"
    }
  ],
  "actions": ["show_conjugation", "explain_sutra", "show_examples"]
}
```

### 5. Export Results

**GET** `/export/{image_id}?format={json|tei|pdf}`

Export reconstruction results in specified format.

**Parameters:**
- `image_id`: Session ID from upload
- `format`: Export format (json, tei, pdf)

**Response:**
- Content-Type: Depends on format
- Body: File stream

### 6. Health Check

**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "ocr": "healthy",
    "model": "healthy",
    "kg": "healthy"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Detailed error message",
    "details": { ... }
  },
  "metadata": {
    "request_id": "uuid",
    "timestamp": "ISO 8601"
  }
}
```

### Error Codes
- `INVALID_REQUEST` (400): Malformed request
- `NOT_FOUND` (404): Resource not found
- `PROCESSING_ERROR` (500): Internal processing error
- `SERVICE_UNAVAILABLE` (503): Dependent service unavailable

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Upload**: 10 uploads per minute per IP
- **Reconstruction**: 20 requests per minute per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events (Future)

For real-time updates during processing:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Processing update:', data);
};
```

## SDK Examples

### Python
```python
import requests

# Upload image
with open('manuscript.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/upload',
        files={'file': f}
    )
session_data = response.json()

# Reconstruct text
reconstruction = requests.post(
    'http://localhost:8000/reconstruct',
    json={
        'image_id': session_data['id'],
        'mask_ids': ['mask_0'],
        'mode': 'hard',
        'n_candidates': 3
    }
)
```

### JavaScript
```javascript
// Upload image
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('/upload', {
  method: 'POST',
  body: formData
});

const sessionData = await uploadResponse.json();

// Reconstruct text
const reconstructResponse = await fetch('/reconstruct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image_id: sessionData.id,
    mask_ids: ['mask_0'],
    mode: 'hard',
    n_candidates: 3
  })
});
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
```
http://localhost:8000/docs
```

Interactive API documentation (Swagger UI):
```
http://localhost:8000/redoc
```
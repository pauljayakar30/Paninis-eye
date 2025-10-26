# Sanskrit Manuscript Reconstruction Portal - Architecture

## System Overview

The Sanskrit Manuscript Reconstruction Portal (SMRP) is a production-ready web application that reconstructs damaged Sanskrit manuscripts using AI, OCR, and Paninian grammar constraints.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   API Gateway   │    │  OCR Service    │
│   (Streamlit)   │◄──►│   (FastAPI)     │◄──►│  (Tesseract+)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Model Service   │    │ Knowledge Graph │    │    Storage      │
│  (PaniniT5)     │◄──►│    (Neo4j)      │    │   (MinIO/S3)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Frontend (Web Portal)
- **Technology**: Streamlit (hackathon) / React (production)
- **Features**:
  - Image upload and preview
  - OCR results visualization
  - Interactive reconstruction interface
  - Knowledge graph explorer
  - Assistant chat interface
  - Export functionality (TEI/XML, JSON, PDF)

### 2. API Gateway
- **Technology**: FastAPI
- **Responsibilities**:
  - Request routing and orchestration
  - Session management
  - Authentication and rate limiting
  - Response aggregation
  - Error handling and logging

### 3. OCR Service
- **Technology**: Tesseract + PaddleOCR + OpenCV
- **Features**:
  - Multi-engine OCR with Indic script support
  - Image preprocessing and enhancement
  - Damage detection using computer vision
  - Unicode normalization (NFC)
  - Confidence scoring and quality metrics

### 4. Model Service (PaniniT5)
- **Technology**: PyTorch + Transformers
- **Architecture**: T5-based encoder-decoder with KG integration
- **Capabilities**:
  - Multi-task learning (reconstruction + translation)
  - Knowledge graph-constrained decoding
  - Morphological analysis and segmentation
  - Confidence scoring and candidate ranking

### 5. Knowledge Graph (PG-KG)
- **Technology**: Neo4j
- **Schema**:
  - Nodes: Sutra, Rule, Dhatu, Pratyaya, Example
  - Relationships: applies_to, governed_by, has_example
  - Properties: Sanskrit text, IAST, descriptions, conditions

### 6. Intelligent Assistant (IMA)
- **Technology**: RAG + Fine-tuned LLM
- **Features**:
  - Grammar explanations with KG citations
  - Interactive tutoring and Q&A
  - Derivation step-by-step walkthroughs
  - Alternative reconstruction suggestions

## Data Flow

### 1. Upload & OCR Pipeline
```
Image Upload → Preprocessing → Multi-Engine OCR → 
Unicode Normalization → Tokenization → Damage Detection → 
Mask Generation → Response
```

### 2. Reconstruction Pipeline
```
Damaged Text + Masks → Context Preparation → 
KG Rule Lookup → Model Inference → 
Constraint Application → Candidate Generation → 
Scoring & Ranking → Response
```

### 3. Translation Pipeline
```
Sanskrit Text → Morphological Analysis → 
Word-by-Word Translation → Grammar-Aware Reordering → 
Idiomatic Adjustment → Confidence Scoring → Response
```

## Key Algorithms

### 1. Constrained Decoding
- **Soft Constraints**: KG embeddings + attention bias
- **Hard Constraints**: FST-based beam pruning
- **Hybrid Approach**: Configurable constraint strength

### 2. Knowledge Graph Integration
- **Node Embeddings**: Node2Vec for rule representations
- **Rule Matching**: Lexical + semantic similarity
- **Constraint Compilation**: Dynamic FST generation

### 3. Multi-Task Learning
- **Shared Encoder**: T5 encoder with KG context injection
- **Task-Specific Heads**: Reconstruction, translation, morphology
- **Loss Balancing**: Weighted multi-task objective

## Scalability & Performance

### Horizontal Scaling
- **Stateless Services**: All services designed for horizontal scaling
- **Load Balancing**: API Gateway with multiple backend instances
- **Caching**: Redis for session data and frequent KG queries

### Performance Optimizations
- **Model Optimization**: Quantization, ONNX conversion for inference
- **Batch Processing**: Dynamic batching for multiple requests
- **Caching**: Pre-computed embeddings and rule lookups

### Resource Requirements
- **Minimum**: 8GB RAM, 4 CPU cores, 1 GPU (optional)
- **Recommended**: 16GB RAM, 8 CPU cores, 1 GPU (RTX 3080+)
- **Production**: Auto-scaling Kubernetes cluster with GPU nodes

## Security & Privacy

### Data Protection
- **Encryption**: TLS in transit, AES-256 at rest
- **Access Control**: JWT-based authentication
- **Data Retention**: Configurable retention policies
- **Audit Logging**: Comprehensive request/response logging

### Privacy Considerations
- **Consent Management**: Explicit consent for data usage
- **Anonymization**: PII removal from training data
- **Right to Deletion**: GDPR-compliant data deletion

## Monitoring & Observability

### Metrics
- **Performance**: Request latency, throughput, error rates
- **Model**: Accuracy, confidence distributions, KG compliance
- **Infrastructure**: CPU/GPU utilization, memory usage

### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Log Aggregation**: ELK stack or similar
- **Alerting**: Prometheus + Grafana for monitoring

## Deployment Options

### Development
```bash
docker-compose up -d
```

### Production (Kubernetes)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smrp-api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smrp-api-gateway
  template:
    spec:
      containers:
      - name: api-gateway
        image: smrp/api-gateway:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### Cloud Deployment
- **AWS**: EKS + S3 + RDS + ElastiCache
- **GCP**: GKE + Cloud Storage + Cloud SQL + Memorystore
- **Azure**: AKS + Blob Storage + Azure Database + Redis Cache

## API Specification

### Core Endpoints
- `POST /upload` - Upload manuscript image
- `POST /ocr` - Extract text from image
- `POST /reconstruct` - Reconstruct damaged text
- `POST /translate` - Generate translations
- `POST /assistant/query` - Query IMA assistant
- `GET /export/{id}` - Export results

### Response Format
```json
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "request_id": "uuid",
    "timestamp": "2024-01-01T00:00:00Z",
    "processing_time_ms": 1250
  }
}
```

## Quality Assurance

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end pipeline testing
- **Performance Tests**: Load testing with realistic data
- **Accuracy Tests**: Philologist evaluation on real manuscripts

### Evaluation Metrics
- **Reconstruction**: Exact match, BLEU, chrF, KG compliance
- **Translation**: BLEU, METEOR, COMET, human evaluation
- **System**: Latency (p95 < 5s), availability (99.9%), accuracy (>80%)

## Future Enhancements

### Short Term (3-6 months)
- Advanced damage detection with U-Net
- Expanded KG with more sutras and rules
- Voice interface with Sanskrit TTS/STT
- Mobile app for field researchers

### Long Term (6-12 months)
- Multi-language support (Tamil, Telugu, etc.)
- Collaborative annotation platform
- Advanced visualization with AR/VR
- Integration with digital libraries and archives
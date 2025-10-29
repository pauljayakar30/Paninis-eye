# Project Structure

This document describes the organization of the Sanskrit Manuscript Reconstruction Portal codebase.

## Root Directory

```
sanskrit-manuscript-portal/
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── backend_server.py        # Main FastAPI backend server
├── CHANGELOG.md             # Version history and changes
├── CONTRIBUTING.md          # Contribution guidelines
├── docker-compose.yml       # Docker orchestration config
├── HACKATHON_NOTES.md       # Development notes and limitations
├── LICENSE                  # MIT License
├── README.md                # Main project documentation
├── run.py                   # System startup script
├── setup-local.ps1          # Windows PowerShell setup script
├── setup-simple.ps1         # Simplified Windows setup
└── SETUP.md                 # Detailed setup instructions
```

## Source Code (`src/`)

### API Layer (`src/api/`)
Backend API implementation and routing.

```
src/api/
├── __init__.py
└── server.py               # API endpoints (alternative server)
```

### Models (`src/models/`)
Machine learning models and training code.

```
src/models/
├── __init__.py
├── panini_t5.py           # Main MT5 model with advanced features
├── panini_t5_simple.py    # Simplified model version
├── service.py             # Model service API
└── train_panini_t5.py     # Training pipeline (not executed)
```

**Status**: Architecture defined, not trained due to hackathon time constraints.

### OCR Service (`src/ocr/`)
Optical Character Recognition for manuscript text extraction.

```
src/ocr/
├── __init__.py
└── service.py             # OCR processing and damage detection
```

**Features**:
- Tesseract integration
- PaddleOCR support (basic)
- Unicode normalization
- Confidence scoring

### Knowledge Graph (`src/kg/`)
Neo4j knowledge graph for grammatical rules and context.

```
src/kg/
└── build_kg.py            # Graph construction script
```

**Status**: Structure defined, not populated. Needs Paninian grammar data.

### Data Processing (`src/data/`)
Data generation and processing utilities.

```
src/data/
└── synthetic_damage.py    # Synthetic manuscript damage generation
```

### Frontend (`src/frontend/`)

#### React Application
Modern web interface built with React and Material-UI.

```
src/frontend/react-app/
├── package.json           # Node dependencies
├── public/               # Static assets
│   ├── index.html
│   └── manifest.json
└── src/                  # Source code
    ├── App.js           # Main application component
    ├── index.js         # Entry point
    ├── components/      # Reusable components
    ├── pages/           # Page components
    ├── providers/       # Context providers
    ├── services/        # API clients
    └── store/           # Redux state management
```

#### Components (`src/frontend/react-app/src/components/`)

```
components/
├── AIGuruChat.jsx                 # AI assistant chat interface
├── ExportOptions.jsx              # Export functionality
├── GeminiDemo.js                  # Gemini AI demo
├── GeminiTextTest.js              # Gemini text testing
├── MultilingualTranslations.jsx   # Translation display
├── TextToSpeechPlayer.jsx         # TTS controls
├── TTSDemo.jsx                    # TTS demo component
├── Analytics/
│   └── PerformanceMetrics.js     # System metrics
├── Assistant/
│   └── RealtimeAssistant.js      # Real-time AI assistant
├── Layout/
│   ├── Navbar.js                 # Top navigation
│   └── Sidebar.js                # Side navigation
└── Reconstruction/
    ├── CandidatesList.js         # Reconstruction candidates
    ├── EpisodicMemoryViewer.js   # Memory visualization
    ├── GrammarAnalysis.js        # Grammar rule display
    ├── ManuscriptViewer.js       # Image viewer
    ├── TranslationPanel.js       # Translation display
    └── UncertaintyVisualization.js # Confidence visualization
```

#### Pages (`src/frontend/react-app/src/pages/`)

```
pages/
├── Analytics.js              # Analytics dashboard
├── AssistantChat.js         # AI chat page
├── Dashboard.js             # Main dashboard
├── GeminiRestoration.js     # Gemini restoration interface ⭐
├── KnowledgeGraph.js        # Graph visualization
├── ManuscriptUpload.js      # Upload interface
├── ReconstructionWorkspace.js # Main workspace
└── Settings.js              # User settings
```

**⭐ Primary Interface**: `GeminiRestoration.js` is the main working feature.

#### State Management (`src/frontend/react-app/src/store/`)

```
store/
├── store.js                 # Redux store configuration
└── slices/
    ├── assistantSlice.js    # AI assistant state
    ├── knowledgeGraphSlice.js # Graph state
    ├── manuscriptSlice.js   # Manuscript state
    ├── reconstructionSlice.js # Reconstruction state
    └── uiSlice.js           # UI state
```

## Configuration Files

### Python Requirements (`requirements/`)

```
requirements/
├── api-gateway.txt          # Backend dependencies
├── frontend.txt             # Streamlit (unused)
├── model-service.txt        # ML model dependencies
└── ocr-service.txt          # OCR dependencies
```

**Note**: Install `api-gateway.txt` for basic functionality.

### Docker Configuration (`docker/`)

```
docker/
├── api-gateway.Dockerfile   # Backend container
├── frontend.Dockerfile      # React container
├── frontend-simple.Dockerfile # Simplified frontend
├── model-service.Dockerfile # Model service container
├── nginx.conf              # Nginx configuration
└── ocr-service.Dockerfile  # OCR service container
```

**Status**: Defined but not fully tested.

## Data Directories

```
data/
├── processed/              # Processed manuscript data
├── raw/                    # Raw input data
│   └── sample_texts.txt
├── synthetic/              # Generated training data
└── uploads/                # User uploaded files
```

**Note**: Created automatically on first run.

## Documentation (`docs/`)

```
docs/
├── api.md                  # API reference
└── architecture.md         # System architecture
```

## Models Directory

```
models/
├── kg_data.json           # Knowledge graph data
└── panini_t5/             # Trained model files (empty in hackathon version)
```

## Configuration Files (`configs/`)

```
configs/
└── finetune_synth.yaml    # Model training configuration
```

## Logs

```
logs/                       # Application logs (generated)
```

## File Naming Conventions

### Python Files
- `snake_case.py` for modules
- Classes use `PascalCase`
- Functions use `snake_case`

### JavaScript/React Files
- `PascalCase.js` for components
- `camelCase.js` for utilities
- `.jsx` extension for JSX components

### Configuration Files
- `kebab-case.yml` for YAML configs
- `kebab-case.txt` for requirements
- `.example` suffix for templates

## Import Paths

### Python
```python
from src.api.server import app
from src.models.panini_t5 import PaniniT5Model
from src.ocr.service import OCRService
```

### React
```javascript
import { Dashboard } from './pages/Dashboard';
import { AIGuruChat } from './components/AIGuruChat';
import api from './services/api';
```

## Key Entry Points

1. **Backend Server**: `backend_server.py`
   - Main FastAPI application
   - All API endpoints
   - Gemini integration

2. **Frontend**: `src/frontend/react-app/src/index.js`
   - React app entry point
   - Redux store setup
   - Router configuration

3. **Startup**: `run.py`
   - System launcher
   - Prerequisite checking
   - Multi-process management

## Working vs. Partial Features

### ✅ Fully Implemented
- `backend_server.py` - Backend API
- `src/frontend/react-app/src/pages/GeminiRestoration.js` - Main UI
- `src/frontend/react-app/src/components/AIGuruChat.jsx` - Chat
- `src/frontend/react-app/src/components/MultilingualTranslations.jsx` - Translations
- `src/frontend/react-app/src/components/TextToSpeechPlayer.jsx` - TTS

### 🚧 Partially Implemented
- `src/models/panini_t5.py` - Model architecture only
- `src/ocr/service.py` - Basic OCR
- `src/kg/build_kg.py` - Structure only
- `docker-compose.yml` - Not fully tested

### ⏳ Planned but Not Started
- User authentication system
- Database integration
- Advanced caching
- Production deployment configs
- Comprehensive test suite

## Architecture Patterns

### Backend
- **Pattern**: Layered architecture
- **API**: RESTful with WebSocket support
- **Async**: Async/await throughout
- **Error Handling**: Try-catch with logging

### Frontend
- **Pattern**: Component-based architecture
- **State**: Redux Toolkit for global state
- **Routing**: React Router
- **Styling**: Material-UI + custom CSS

### Data Flow
```
User Input → React Component → API Call → FastAPI → Gemini API → Response → State Update → UI Render
```

## Build Artifacts (Ignored by Git)

```
__pycache__/               # Python bytecode
node_modules/              # Node dependencies
build/                     # React production build
*.pyc                      # Compiled Python files
.env                       # Environment variables (secrets)
logs/                      # Log files
data/uploads/              # User uploads
data/processed/            # Processed data
```

## Getting Help

- **Setup Issues**: See `SETUP.md`
- **Contributing**: See `CONTRIBUTING.md`
- **Development Notes**: See `HACKATHON_NOTES.md`
- **API Reference**: Visit http://localhost:8000/docs when running

---

**Note**: This structure reflects the hackathon version. Some directories and files represent planned features not yet fully implemented. See `HACKATHON_NOTES.md` for detailed status of each component.

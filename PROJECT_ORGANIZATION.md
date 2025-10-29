# Project Organization

This document describes the clean, organized structure of the Sanskrit Manuscript Reconstruction Portal.

## 📁 Root Directory Structure

```
paninis-eye/
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules (comprehensive)
├── backend_server.py        # Main FastAPI backend server (CORE)
├── docker-compose.yml       # Docker orchestration
├── run.py                   # System startup launcher
├── requirements.txt         # Python dependencies for production
├── README.md                # Main project documentation
├── CONTRIBUTING.md          # Contribution guidelines
├── SETUP.md                 # Setup instructions
├── LICENSE                  # MIT License
│
├── deployment/              # Deployment configurations
│   ├── Procfile            # Heroku/Render deployment
│   ├── render.yaml         # Render.com configuration
│   ├── runtime.txt         # Python version specification
│   └── vercel.json         # Vercel frontend deployment
│
├── docs/                    # Documentation
│   ├── api.md              # API documentation
│   ├── architecture.md     # System architecture
│   └── project/            # Project-specific docs
│       ├── CHANGELOG.md    # Version history
│       ├── HACKATHON_NOTES.md  # Development notes & limitations
│       └── PROJECT_STRUCTURE.md # Detailed structure guide
│
├── configs/                 # Configuration files
│   └── finetune_synth.yaml # Model fine-tuning config
│
├── data/                    # Data directory (in .gitignore)
│   ├── raw/                # Raw manuscript images
│   ├── processed/          # Processed OCR outputs
│   ├── synthetic/          # Synthetic training data
│   └── uploads/            # User uploaded files
│
├── docker/                  # Docker configurations
│   ├── api-gateway.Dockerfile
│   ├── frontend-simple.Dockerfile
│   ├── frontend.Dockerfile
│   ├── model-service.Dockerfile
│   ├── ocr-service.Dockerfile
│   └── nginx.conf
│
├── kg/                      # Knowledge Graph (partial)
│   └── import/             # Graph import data
│
├── logs/                    # Application logs (in .gitignore)
│
├── models/                  # ML models directory
│   ├── kg_data.json        # Knowledge graph data
│   └── panini_t5/          # Model checkpoints (in .gitignore)
│
├── requirements/            # Detailed requirements for services
│   ├── api-gateway.txt     # Backend API dependencies
│   ├── frontend.txt        # Frontend dependencies
│   ├── model-service.txt   # ML model service dependencies
│   └── ocr-service.txt     # OCR service dependencies
│
├── scripts/                 # Utility scripts
│   ├── setup.sh            # Linux/Mac setup script
│   └── setup/              # Setup scripts
│       ├── setup-local.ps1 # Windows local setup
│       └── setup-simple.ps1 # Simplified Windows setup
│
└── src/                     # Source code
    ├── __init__.py
    │
    ├── api/                 # API layer
    │   ├── __init__.py
    │   └── server.py       # Alternative API server
    │
    ├── data/                # Data processing utilities
    │   └── synthetic_damage.py  # Synthetic data generation
    │
    ├── frontend/            # Frontend applications
    │   ├── __init__.py
    │   └── react-app/      # React web application
    │       ├── package.json
    │       ├── public/     # Static assets
    │       └── src/        # React source code
    │           ├── App.js
    │           ├── index.js
    │           ├── components/  # Reusable components
    │           ├── pages/       # Page components
    │           ├── providers/   # Context providers
    │           ├── services/    # API services
    │           └── store/       # Redux state management
    │
    ├── kg/                  # Knowledge Graph builder
    │   └── build_kg.py     # Neo4j graph construction
    │
    ├── models/              # Machine Learning models
    │   ├── __init__.py
    │   ├── panini_t5.py    # Advanced MT5 transformer (1690 lines)
    │   ├── panini_t5_simple.py  # Simplified version
    │   ├── service.py      # Model service API
    │   └── train_panini_t5.py   # Training pipeline
    │
    └── ocr/                 # OCR service
        ├── __init__.py
        └── service.py      # Tesseract OCR integration
```

## 🎯 Core Files

### Essential Production Files
- **backend_server.py** - Main FastAPI server with Gemini AI integration
- **run.py** - System launcher that starts backend and frontend
- **requirements.txt** - Production dependencies
- **docker-compose.yml** - Multi-service orchestration

### Configuration Files
- **.env.example** - Template for environment variables
- **.gitignore** - Comprehensive ignore rules
- **configs/** - Application configuration files

### Source Code
- **src/frontend/react-app/** - React frontend (Material-UI)
- **src/models/** - ML model architecture
- **src/ocr/** - OCR processing service
- **src/api/** - API routing and endpoints

## 📦 Dependencies

### Backend (production)
```txt
fastapi==0.108.0
uvicorn[standard]==0.25.0
httpx==0.25.2
pydantic==2.5.3
python-multipart==0.0.6
aiohttp==3.9.1
requests==2.31.0
```

### Frontend
```json
{
  "react": "^18.x",
  "@mui/material": "^5.x",
  "react-router-dom": "^6.x",
  "@reduxjs/toolkit": "^1.x"
}
```

## 🚀 Quick Start

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/pauljayakar30/Paninis-eye.git
cd Paninis-eye

# 2. Setup environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# 4. Run system
python run.py
```

### Docker Deployment
```bash
docker-compose up --build
```

## 📝 File Naming Conventions

- **Python files**: `lowercase_with_underscores.py`
- **React components**: `PascalCase.js` or `PascalCase.jsx`
- **Configuration files**: `lowercase-with-dashes.yml/yaml/json`
- **Documentation**: `UPPERCASE_WITH_UNDERSCORES.md`
- **Scripts**: `lowercase-with-dashes.sh/ps1`

## 🗂️ Directory Purposes

| Directory | Purpose | Git Tracked |
|-----------|---------|-------------|
| `deployment/` | Deployment configs for various platforms | ✅ Yes |
| `docs/` | All documentation | ✅ Yes |
| `configs/` | Application configuration files | ✅ Yes |
| `data/` | Data storage (excluding uploads) | ⚠️ Partial |
| `logs/` | Application logs | ❌ No |
| `models/` | Model architecture and checkpoints | ⚠️ Partial |
| `src/` | All source code | ✅ Yes |
| `scripts/` | Utility and setup scripts | ✅ Yes |
| `venv/` | Python virtual environment | ❌ No |

## 🔒 Security Notes

### Never commit:
- **.env** files with real credentials
- **data/uploads/** (user uploaded files)
- **logs/** (may contain sensitive data)
- **models/panini_t5/** (large model files)
- **venv/** (virtual environment)
- Any ***.key**, ***.pem** files

### Always use:
- Environment variables for API keys
- .gitignore for sensitive paths
- .env.example as a template (no real values)

## 📊 Code Organization Principles

1. **Separation of Concerns**: Frontend, backend, models are separate
2. **Configuration Management**: All configs in dedicated directories
3. **Documentation First**: README and docs explain everything
4. **Clean Dependencies**: requirements.txt for production, detailed files in requirements/
5. **No Test/Demo Code**: All test files removed for clean production repo
6. **Deployment Ready**: Multiple deployment options configured

## 🎨 Frontend Structure

The React app follows a clean architecture:
- **components/** - Reusable UI components
- **pages/** - Top-level page components
- **store/** - Redux state management
- **services/** - API communication layer
- **providers/** - React context providers

## 🤖 Backend Architecture

FastAPI backend with:
- RESTful API endpoints
- WebSocket support for real-time updates
- Google Gemini AI integration
- In-memory session management
- CORS middleware for frontend communication

## 📋 Maintenance

### Adding New Features
1. Create feature branch
2. Add code to appropriate `src/` subdirectory
3. Update documentation in `docs/`
4. Update `CHANGELOG.md`
5. Submit pull request

### Updating Dependencies
1. Update `requirements.txt` for production
2. Update specific files in `requirements/` for services
3. Update `package.json` for frontend
4. Test thoroughly
5. Document changes in `CHANGELOG.md`

---

**Last Updated**: 2025-10-30  
**Project**: Sanskrit Manuscript Reconstruction Portal  
**Hackathon**: Samartha 2025  
**Team**: CodeStorm (Yamasani Srinivas Reddy, Chitturi Varshith, Vasu Paul Jayakar)  
**Repository**: https://github.com/pauljayakar30/Paninis-eye

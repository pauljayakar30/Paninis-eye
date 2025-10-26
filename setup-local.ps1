# Local Development Setup for Sanskrit Manuscript Portal
# This script sets up the system without Docker for local development

Write-Host "🔥 Setting up Sanskrit Manuscript Reconstruction Portal (Local Development)" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Yellow

# Create virtual environment for Python services
Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Green
if (!(Test-Path "venv")) {
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# Install Python dependencies
Write-Host "📥 Installing Python dependencies..." -ForegroundColor Green

# Create a combined requirements file for local development
@"
# API Gateway
fastapi==0.104.1
uvicorn[standard]==0.24.0
httpx==0.25.2
pydantic==2.5.0
python-multipart==0.0.6
websockets==12.0

# OCR Service
opencv-python==4.8.1.78
pytesseract==0.3.10
Pillow==10.1.0
numpy==1.24.3
unicodedata2==15.1.0

# Model Service
torch==2.0.1
transformers==4.35.2
tokenizers==0.15.0
scipy==1.11.4
scikit-learn==1.3.2

# Knowledge Graph
neo4j==5.14.1
py2neo==2021.2.4

# Data Processing
pandas==2.1.4
matplotlib==3.8.2
seaborn==0.13.0

# Utilities
pyyaml==6.0.1
tqdm==4.66.1
requests==2.31.0
python-jose[cryptography]==3.3.0
"@ | Out-File -FilePath "requirements-local.txt" -Encoding UTF8

pip install -r requirements-local.txt

# Setup React frontend
Write-Host "⚛️ Setting up React frontend..." -ForegroundColor Green
Set-Location "src/frontend/react-app"

# Install Node.js dependencies
npm install

# Build the React app
npm run build

# Go back to root
Set-Location "../../.."

# Create local configuration
Write-Host "⚙️ Creating local configuration..." -ForegroundColor Green

# Create environment file
@"
# Local Development Environment
API_BASE_URL=http://localhost:8000
OCR_SERVICE_URL=http://localhost:8001
MODEL_SERVICE_URL=http://localhost:8002
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
SERVE_FRONTEND=true
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

# Create startup scripts
Write-Host "📝 Creating startup scripts..." -ForegroundColor Green

# API Gateway startup script
@"
# Start API Gateway
Write-Host "🚀 Starting API Gateway on port 8000..." -ForegroundColor Green
$env:SERVE_FRONTEND = "true"
python -m uvicorn src.api.server:app --host 0.0.0.0 --port 8000 --reload
"@ | Out-File -FilePath "start-api.ps1" -Encoding UTF8

# OCR Service startup script
@"
# Start OCR Service
Write-Host "👁️ Starting OCR Service on port 8001..." -ForegroundColor Green
python -m uvicorn src.ocr.service:app --host 0.0.0.0 --port 8001 --reload
"@ | Out-File -FilePath "start-ocr.ps1" -Encoding UTF8

# Model Service startup script
@"
# Start Model Service
Write-Host "🧠 Starting Model Service on port 8002..." -ForegroundColor Green
python -m uvicorn src.models.service:app --host 0.0.0.0 --port 8002 --reload
"@ | Out-File -FilePath "start-model.ps1" -Encoding UTF8

# Create directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "data/raw", "data/processed", "data/synthetic", "data/uploads"
New-Item -ItemType Directory -Force -Path "models/panini_t5"
New-Item -ItemType Directory -Force -Path "logs"
New-Item -ItemType Directory -Force -Path "kg/import"

# Generate sample data
Write-Host "📊 Generating sample data..." -ForegroundColor Green
python src/data/synthetic_damage.py --output data/synthetic --num_samples 10

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the system:" -ForegroundColor Yellow
Write-Host "1. Start services in separate terminals:" -ForegroundColor White
Write-Host "   Terminal 1: .\start-api.ps1" -ForegroundColor Cyan
Write-Host "   Terminal 2: .\start-ocr.ps1" -ForegroundColor Cyan
Write-Host "   Terminal 3: .\start-model.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Access the application:" -ForegroundColor White
Write-Host "   🌐 Web Interface: http://localhost:8000" -ForegroundColor Cyan
Write-Host "   📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Note: For full functionality, install Neo4j separately" -ForegroundColor Yellow
Write-Host "   Download from: https://neo4j.com/download/" -ForegroundColor Cyan
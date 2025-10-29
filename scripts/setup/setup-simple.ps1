# Simple setup script for local development
Write-Host "Setting up Sanskrit Manuscript Portal..." -ForegroundColor Green

# Create virtual environment
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Create requirements file
Write-Host "Creating requirements file..." -ForegroundColor Yellow
$requirements = @"
fastapi==0.104.1
uvicorn[standard]==0.24.0
httpx==0.25.2
pydantic==2.5.0
python-multipart==0.0.6
websockets==12.0
opencv-python==4.8.1.78
pytesseract==0.3.10
Pillow==10.1.0
numpy==1.24.3
torch==2.0.1
transformers==4.35.2
pandas==2.1.4
pyyaml==6.0.1
tqdm==4.66.1
requests==2.31.0
"@

$requirements | Out-File -FilePath "requirements-local.txt" -Encoding UTF8

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements-local.txt

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "data\raw" | Out-Null
New-Item -ItemType Directory -Force -Path "data\processed" | Out-Null
New-Item -ItemType Directory -Force -Path "data\synthetic" | Out-Null
New-Item -ItemType Directory -Force -Path "data\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "models\panini_t5" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Run 'python test_services.py' to test the installation" -ForegroundColor Cyan
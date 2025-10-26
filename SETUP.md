# Setup Guide - Sanskrit Manuscript Reconstruction Portal

This guide will help you set up and run the project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Python 3.8 or higher** - [Download](https://www.python.org/downloads/)
- **Node.js 14 or higher** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/downloads)

### Optional
- **Neo4j 5.x** (for knowledge graph features - not required for basic functionality)
- **Docker** (if you want to use containerized deployment)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sanskrit-manuscript-portal.git
cd sanskrit-manuscript-portal
```

### 2. Set Up Backend

#### Windows
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements/api-gateway.txt
```

#### Linux/Mac
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements/api-gateway.txt
```

### 3. Set Up Frontend

```bash
# Navigate to React app directory
cd src/frontend/react-app

# Install Node dependencies
npm install

# Return to project root
cd ../../..
```

### 4. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Google Gemini API key
# Get your key from: https://makersuite.google.com/app/apikey
```

Edit `.env` and set:
```
GOOGLE_API_KEY=your-actual-api-key-here
```

### 5. Create Required Directories

```bash
# Windows PowerShell
New-Item -ItemType Directory -Force -Path data\raw, data\uploads, data\processed, data\synthetic, logs

# Linux/Mac
mkdir -p data/raw data/uploads data/processed data/synthetic logs
```

## Running the Application

### Option 1: Using the Run Script (Recommended)

```bash
python run.py
```

This will:
1. Check prerequisites
2. Set up the system
3. Start both backend and frontend
4. Open your browser automatically

### Option 2: Manual Start (Two Terminals)

#### Terminal 1 - Backend
```bash
# Activate virtual environment
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Start backend server
python backend_server.py
```

Backend will run on: http://localhost:8000

#### Terminal 2 - Frontend
```bash
# Navigate to React app
cd src/frontend/react-app

# Start development server
npm start
```

Frontend will run on: http://localhost:3000

## Verification

### Check Backend
Open http://localhost:8000/health in your browser or:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T...",
  "services": {
    "api": "running",
    "gemini": "configured"
  }
}
```

### Check Frontend
Open http://localhost:3000 in your browser. You should see the Sanskrit Manuscript Portal dashboard.

### Check Gemini Integration
Navigate to http://localhost:3000/gemini-restoration and try uploading a sample image.

## Troubleshooting

### Backend Issues

#### "Module not found" errors
```bash
# Make sure virtual environment is activated
# Reinstall dependencies
pip install -r requirements/api-gateway.txt
```

#### Port 8000 already in use
```bash
# Find and kill the process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

#### Gemini API errors
- Verify your API key in `.env` file
- Check internet connection
- Ensure API key has proper permissions
- Check API quota limits

### Frontend Issues

#### "npm install" fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

#### Port 3000 already in use
```bash
# Change port by setting environment variable
# Windows
set PORT=3001 && npm start

# Linux/Mac
PORT=3001 npm start
```

#### Build errors
```bash
# Update Node.js to latest LTS version
# Clear React cache
rm -rf node_modules/.cache
```

### Common Issues

#### CORS errors
- Ensure backend is running on port 8000
- Check CORS middleware configuration in `backend_server.py`

#### WebSocket connection failures
- Check firewall settings
- Ensure both frontend and backend are running
- Verify WebSocket endpoint in frontend configuration

#### OCR not working
- Check if Tesseract is installed: `tesseract --version`
- Install Tesseract: 
  - Windows: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
  - Linux: `sudo apt-get install tesseract-ocr`
  - Mac: `brew install tesseract`

## Optional Features

### Running with Docker (Experimental)

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down
```

**Note**: Docker setup is not fully tested in hackathon version.

### Setting up Neo4j (Optional)

```bash
# Download and install Neo4j
# Start Neo4j service
# Access at http://localhost:7474
# Default credentials: neo4j/neo4j (change on first login)
```

Update `.env`:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

## Development Tips

### Hot Reloading
- **Backend**: FastAPI auto-reloads on file changes
- **Frontend**: React auto-reloads on file changes

### Debug Mode
```bash
# Backend with debug logging
python backend_server.py --log-level DEBUG

# Frontend with debug mode
REACT_APP_DEBUG=true npm start
```

### API Documentation
Access interactive API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Next Steps

1. **Test the system** - Upload a sample Sanskrit manuscript image
2. **Explore features** - Try translation, AI assistant, export options
3. **Read documentation** - Check `docs/` folder for detailed info
4. **Contribute** - See `CONTRIBUTING.md` for contribution guidelines
5. **Report issues** - Open GitHub issues for bugs or feature requests

## Getting Help

- Check `HACKATHON_NOTES.md` for known limitations
- Read `docs/api.md` for API reference
- Open an issue on GitHub
- Check logs in `logs/` directory

## System Requirements

### Minimum
- 4GB RAM
- 2GB free disk space
- Internet connection (for Gemini API)

### Recommended
- 8GB RAM
- 5GB free disk space
- SSD storage
- Stable internet connection

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- First load may take 10-15 seconds for model initialization
- Image processing time depends on image size and complexity
- Gemini API calls may take 2-5 seconds depending on network
- Larger images (>5MB) may take longer to process

---

**Successfully set up?** Start by uploading a Sanskrit manuscript image and explore the restoration features! 🏛️✨

For questions or issues, please refer to our [CONTRIBUTING.md](CONTRIBUTING.md) guide.

#!/bin/bash

# Sanskrit Manuscript Reconstruction Portal Setup Script

set -e

echo "🔥 Setting up Sanskrit Manuscript Reconstruction Portal"
echo "======================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/{raw,processed,synthetic,uploads}
mkdir -p models/panini_t5
mkdir -p logs
mkdir -p kg/import

echo "✅ Directories created"

# Download sample data (placeholder)
echo "📥 Setting up sample data..."
cat > data/raw/sample_texts.txt << 'EOF'
राम वनं गच्छति। सीता गृहे तिष्ठति।
धर्मो रक्षति रक्षितः। सत्यमेव जयते।
विद्या ददाति विनयं विनयाद् याति पात्रताम्।
अहिंसा परमो धर्मः धर्म हिंसा तथैव च।
सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः।
EOF

echo "✅ Sample data created"

# Generate synthetic training data
echo "🔄 Generating synthetic training data..."
python3 src/data/synthetic_damage.py --output data/synthetic --num_samples 100

echo "✅ Synthetic data generated"

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

echo "✅ Docker images built"

# Start services
echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
python3 scripts/demo.py --test-api

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Services running:"
echo "  📊 Web Interface: http://localhost:8501"
echo "  🔌 API Gateway: http://localhost:8000"
echo "  👁️ OCR Service: http://localhost:8001"
echo "  🧠 Model Service: http://localhost:8002"
echo "  📈 Neo4j Browser: http://localhost:7474"
echo "  💾 MinIO Console: http://localhost:9001"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:8501 in your browser"
echo "  2. Upload a manuscript image or use sample data"
echo "  3. Explore reconstruction and translation features"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f [service-name]"
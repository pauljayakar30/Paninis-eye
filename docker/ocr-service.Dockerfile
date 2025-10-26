FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-san \
    tesseract-ocr-eng \
    libtesseract-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download additional Tesseract data for Sanskrit
RUN wget -O /usr/share/tesseract-ocr/5/tessdata/san.traineddata \
    https://github.com/tesseract-ocr/tessdata/raw/main/san.traineddata

# Copy requirements
COPY requirements/ocr-service.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ocr/ ./src/ocr/
COPY src/__init__.py ./src/

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 8001

# Run the application
CMD ["uvicorn", "src.ocr.service:app", "--host", "0.0.0.0", "--port", "8001"]
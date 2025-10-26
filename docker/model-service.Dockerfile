FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements/model-service.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/models/ ./src/models/
COPY src/__init__.py ./src/

# Create directories
RUN mkdir -p models data

# Expose port
EXPOSE 8002

# Run the application
CMD ["uvicorn", "src.models.service:app", "--host", "0.0.0.0", "--port", "8002"]
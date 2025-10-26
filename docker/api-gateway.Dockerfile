FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements/api-gateway.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/api/ ./src/api/
COPY src/__init__.py ./src/

# Create directories
RUN mkdir -p data logs

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "src.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
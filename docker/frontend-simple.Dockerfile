FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements/frontend.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/frontend/ ./src/frontend/
COPY src/__init__.py ./src/

# Expose port
EXPOSE 8501

# Run Streamlit
CMD ["streamlit", "run", "src/frontend/demo_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
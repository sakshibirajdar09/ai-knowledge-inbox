FROM python:3.11-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure data directory exists for SQLite
RUN mkdir -p /app/data

ENV PORT=3000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

# Start with dynamic PORT support (works on Render, Railway, Fly, Heroku, Docker)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000}"]

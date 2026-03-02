# Docker Setup for Trip Architect

This setup includes Ollama (with Qwen 2.5 7B), PostgreSQL, and Redis in a self-contained Docker environment.

## Prerequisites

- Docker Desktop or Docker Engine installed
- At least 8GB RAM available for Docker
- (Optional) For faster inference on Apple Silicon Macs, you can run Ollama natively instead of in Docker

## Quick Start

1. **Start all services:**

   ```bash
   docker-compose up -d
   ```

2. **Wait for Qwen model to download** (first time only, ~4.7GB):

   ```bash
   docker-compose logs -f ollama-init
   ```

   Wait until you see: "Model pulled successfully!"

3. **Create your .env file:**

   ```bash
   cp .env.example .env
   ```

4. **Start the Next.js dev server:**

   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000** and start planning trips!

## Services

### Ollama (Port 11434)

- **Model:** Qwen 2.5 7B (quantized)
- **Access:** http://localhost:11434
- **API:** http://localhost:11434/api

### PostgreSQL (Port 5432)

- **User:** triparchitect
- **Password:** triparchitect
- **Database:** triparchitect

### Redis (Port 6379)

- Used for caching and session management

## Useful Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ollama
docker-compose logs -f postgres
```

### Restart services

```bash
docker-compose restart
```

### Stop all services

```bash
docker-compose down
```

### Stop and remove volumes (clean slate)

```bash
docker-compose down -v
```

### Use a different model

Edit `.env`:

```
OLLAMA_MODEL=llama3.2:3b
```

Then pull the model:

```bash
docker-compose exec ollama ollama pull llama3.2:3b
docker-compose restart
```

## Performance Notes

### Apple Silicon (M1/M2/M3/M4)

- Docker runs Ollama in CPU mode (still fast enough for most uses)
- For maximum performance, consider running Ollama natively on macOS:

  ```bash
  # Install Ollama natively
  brew install ollama

  # Pull the model
  ollama pull qwen2.5:7b

  # Update .env to use native Ollama
  OLLAMA_BASE_URL=http://localhost:11434
  ```

- Then stop the Docker Ollama container to save resources:
  ```bash
  docker-compose stop ollama
  ```

### NVIDIA GPU

The docker-compose.yml can be configured to use NVIDIA GPUs. Add the following to the `ollama` service:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

## Switching to OpenAI

To use OpenAI instead of the local LLM:

1. Edit `.env`:

   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_api_key_here
   ```

2. Restart the Next.js server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Ollama is slow

- Ensure you're using GPU acceleration (NVIDIA)
- Try a smaller model: `OLLAMA_MODEL=qwen2.5:3b`
- Increase Docker memory allocation

### Out of memory errors

- Reduce model size
- Increase Docker memory limit
- Close other applications

### Connection refused errors

- Wait for services to fully start (check `docker-compose ps`)
- Ensure ports 11434, 5432, 6379 are not in use by other applications

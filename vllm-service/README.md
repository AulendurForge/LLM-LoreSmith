# vLLM Service

This service provides LLM inference and fine-tuning capabilities for the LLM LoreSmith application using [vLLM](https://github.com/vllm-project/vllm).

## Requirements

### GPU Requirements
- NVIDIA GPU with CUDA compute capability 7.0+ (Volta architecture or newer)
- Minimum 8GB VRAM (16GB+ recommended for larger models)
- CUDA Toolkit 11.8 or newer
- cuDNN 8.6 or newer

## Setup

### CUDA Setup
1. Install the [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)
2. Set the CUDA_HOME environment variable:
   ```
   # Windows
   setx CUDA_HOME "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8"
   
   # Linux
   export CUDA_HOME=/usr/local/cuda-11.8
   ```
3. Ensure NVIDIA drivers are installed and working:
   ```
   # Windows
   nvidia-smi
   
   # Linux
   nvidia-smi
   ```

## Usage

### With Docker Compose

#### GPU Version
1. Ensure NVIDIA Container Toolkit is installed:
   ```
   # Verify with:
   nvidia-container-cli info
   ```

2. Build and start the service:
   ```
   # From the project root:
   docker-compose build vllm-service
   docker-compose up -d vllm-service
   ```

3. Check logs to verify GPU accessibility:
   ```
   docker-compose logs vllm-service
   ```
   
   You should see CUDA/GPU detection messages if everything is working correctly.

### Building Manually

If you need to build the Docker images outside of docker-compose:

```bash
# From project root
docker build -t llm-loresmith/vllm-service:latest \
  -f infrastructure/docker/vllm/Dockerfile \
  --build-arg CUDA_VERSION=11.8.0 \
  .
```

### API Endpoints
- `POST /api/generate`: Generate text with the LLM
- `POST /api/finetune`: Fine-tune a model
- `GET /api/models`: List available models

For full API documentation, visit `http://localhost:8000/docs` when the service is running. 
# Running vLLM with Docker

This guide provides step-by-step instructions for setting up and running the vLLM service using Docker with GPU acceleration.

## Prerequisites

- NVIDIA GPU with compute capability 7.0+ (Volta architecture or newer)
- [Docker](https://docs.docker.com/get-docker/) installed
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) installed

## Setup Steps

### 1. Install NVIDIA Container Toolkit

If you haven't already installed the NVIDIA Container Toolkit, follow these steps:

**Ubuntu:**
```bash
# Add the NVIDIA repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Install the toolkit
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Restart Docker
sudo systemctl restart docker
```

**Windows:**

For Windows, make sure you're using WSL2 with Docker Desktop and have the NVIDIA CUDA drivers installed. Docker Desktop should automatically detect and enable GPU support.

### 2. Verify NVIDIA Container Toolkit

Verify that your NVIDIA Container Toolkit is working correctly:

```bash
docker run --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

You should see your GPU information displayed.

### 3. Build and Run the vLLM Service

From the project root directory:

```bash
# Build the vLLM service
docker-compose build vllm-service

# Start the vLLM service
docker-compose up -d vllm-service
```

### 4. Verify the Service

Check if the service is running correctly:

```bash
# Check the container status
docker-compose ps vllm-service

# View the logs
docker-compose logs -f vllm-service

# Test the API (once it's fully started)
curl http://localhost:8000/health
```

The health endpoint should return information about your GPU and loaded models.

### 5. Using a Custom Model

By default, the service will download the Llama-2-7b-chat-hf model. To use a different model:

1. **Store the model files** in the `data/models` directory
2. **Update environment variable** in docker-compose.yml:
   ```yaml
   environment:
     - DEFAULT_MODEL=your-model-name
   ```
3. **Restart the service**:
   ```bash
   docker-compose restart vllm-service
   ```

## Troubleshooting

### GPU Not Detected

If the container can't access the GPU:

1. Ensure NVIDIA drivers are up to date
2. Verify NVIDIA Container Toolkit is installed correctly
3. Check `docker-compose.yml` has the correct GPU configuration:
   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: 1
             capabilities: [gpu]
   ```

### Model Loading Issues

If you see model loading errors:

1. Check if your GPU has enough VRAM for the model
2. Verify the model path is correct
3. Ensure the model is compatible with vLLM 0.4.2

### Docker Build Failures

If the build fails:

1. Make sure your NVIDIA drivers match CUDA 12.1
2. Verify you have sufficient disk space
3. Check the build logs for specific error details

## API Usage

Once running, the vLLM service provides these endpoints:

- `GET /health` - Check service status
- `GET /api/models` - List available models
- `POST /api/generate` - Generate text from a prompt

Example text generation request:

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Once upon a time",
    "max_tokens": 100,
    "temperature": 0.7
  }'
``` 
<p align="right">
  <a href="https://www.aulendur.com">
    <img src="frontend/src/assets/Aulendur Block Logo and Name.png" alt="Aulendur Logo" width="150">
  </a>
</p>

# LLM LoreSmith

<p align="center">
  <img src="frontend/src/assets/LLM LoreSmith.png" alt="LoreSmith Dwarf Logo" width="300">
</p>

LLM LoreSmith is a system designed to empower users—regardless of their machine learning expertise—to fine-tune large language models (LLMs) quickly and securely using their own credible, authoritative documents and references.

## Key Features

- **Document Ingestion & Validation**: Upload trusted documents and sources with automatic validation
- **Automated Dataset Generation**: Multistage pipeline to extract and refine content for training
- **Adaptive Fine-Tuning**: Automated fine-tuning with vLLM, dynamically adjusting training epochs
- **Data Security & Privacy**: Local execution with encryption and access controls
- **Scalable Architecture**: Designed to work locally or scale to cloud deployment
- **User-Friendly Interface**: Guided workflow with advanced options for experts
- **Customizable Metadata**: Configure and track custom metadata for documents and training samples
- **Multiple Training Schemas**: Support for various training formats beyond question-answer pairs
- **Semantic Integrity Preservation**: Advanced processing to maintain meaning and context in training data
- **Collaboration Features**: Team-based workflows for enterprise users
- **Progress Management**: Save and resume capabilities for long-running operations
- **Advanced Model Evaluation**: Comprehensive benchmarking and comparison tools
- **Observability Framework**: End-to-end monitoring and performance tracking

## Project Structure

LLM LoreSmith follows a modern microservices architecture with containerization support:

```
/LLM-LoreSmith
├── frontend/                  # React frontend application
├── backend/                   # Node.js/Python backend services
├── vllm-service/              # vLLM integration service
├── infrastructure/            # Docker, Kubernetes, and Terraform configs
│   ├── docker/                # Docker configurations
│   ├── k8s/                   # Kubernetes manifests
│   └── terraform/             # Infrastructure as Code
├── docs/                      # Documentation
├── data/                      # Data storage
└── scripts/                   # Utility scripts
```

## Architecture

### System Architecture

The application is built with a modern stack:

- **Frontend**: React with Redux Toolkit and TypeScript
- **Backend**: Node.js and Python microservices
- **ML Integration**: vLLM for fine-tuning and inference
- **Deployment**: Docker containers orchestrated with Kubernetes
- **Monitoring**: Prometheus, Grafana, ELK Stack

### UI Architecture

The main components are:

- **MainUI**: The main UI application that integrates all other UI components
- **Document Ingestion UI**: UI for uploading and managing documents
- **Dataset Generation UI**: UI for creating and managing datasets
- **Fine-Tuning UI**: UI for fine-tuning and evaluating models
- **Metadata Configuration UI**: UI for configuring document and sample metadata
- **Schema UI**: UI for managing training schemas
- **Workflow UI**: Guided workflow UI that walks users through the entire process
- **LLM Assistant UI**: Built-in AI assistant for user guidance

### Processing Pipeline

The application follows a sequential processing pipeline:

1. **Document Ingestion**: Documents are uploaded, validated, and stored
2. **Dataset Generation**: Training samples are extracted from documents
3. **Fine-Tuning**: Models are fine-tuned on datasets
4. **Evaluation**: Models are evaluated for quality

Each step produces artifacts that are used in subsequent steps, allowing for traceability and reproducibility.

## Development Setup

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Docker and Docker Compose
- Kubernetes CLI (kubectl)
- Git
- **NVIDIA GPU with CUDA Support** (Required for vLLM)
  - NVIDIA CUDA Toolkit (v11.8+ recommended)
  - Compatible NVIDIA GPU drivers
  - Properly configured CUDA_HOME environment variable

### System Requirements

#### GPU Requirements for vLLM
LLM LoreSmith uses vLLM for efficient large language model fine-tuning and inference, which requires:

- NVIDIA GPU with CUDA compute capability 7.0+ (Volta architecture or newer)
- Minimum 8GB VRAM (16GB+ recommended for larger models)
- CUDA Toolkit 11.8 or newer
- cuDNN 8.6 or newer

If you don't have a compatible GPU or CUDA installation:
- For development: Use the `pip install -r requirements-dev.txt` command which excludes vLLM
- For deployment: Consider using pre-built Docker images with CUDA support

#### Setting up CUDA

1. Install the [NVIDIA CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)
2. Set the CUDA_HOME environment variable:
   - In either windows or linux, be sure to replace the version (Example: `v11.8`) with your installed CUDA version
   - Windows: `setx CUDA_HOME "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8"`
   - Linux: `export CUDA_HOME=/usr/local/cuda-11.8`
3. Ensure CUDA is in your PATH variable

#### Docker with NVIDIA GPU Support

To use vLLM with Docker containers:

1. Install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html):
   ```bash
   # Ubuntu example
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

2. Verify installation:
   ```bash
   # Should display your GPU information
   docker run --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
   ```

3. The docker-compose.yml file is already configured with GPU support:
   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: 1
             capabilities: [gpu]
   ```

### Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/aulendur/llm-loresmith.git
   cd llm-loresmith
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```
   cd ../backend
   npm install
   pip install -r requirements.txt
   ```

4. Docker setup:

   Build and start all services (with GPU support):
   ```
   cd ..
   docker-compose build
   docker-compose up -d
   ```

5. Access the application:
   ```
   Frontend: http://localhost:3000
   Backend API: http://localhost:5000
   ```

### Docker Container Management

The application is containerized using Docker, with the following containers:

- **frontend**: React application for the user interface
- **backend**: Node.js API service
- **vllm-service**: GPU-accelerated language model service
- **postgres**: Database for storing application data
- **redis**: Caching and job queue
- **prometheus/grafana**: Monitoring and metrics
- **elasticsearch/kibana/logstash**: Logging and log analysis

#### Building the Containers

To rebuild containers after code changes:
```
docker-compose build [service_name]
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## Contact

This project is under active development by Aulendur LLC.

- Website: [www.aulendur.com](https://www.aulendur.com)
- LinkedIn: [Aulendur LLC](https://www.linkedin.com/company/aulendur-llc/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### CUDA and vLLM Issues

#### "Cannot find CUDA_HOME" Error
If you encounter this error during installation:
```
RuntimeError: Cannot find CUDA_HOME. CUDA must be available to build the package.
```

**Solutions:**
1. Verify CUDA installation:
   ```
   # Windows
   nvcc --version
   # Linux
   nvidia-smi
   ```

2. Set CUDA_HOME environment variable:
   - Windows: 
     ```
     setx CUDA_HOME "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8"
     ```
   - Linux: 
     ```
     export CUDA_HOME=/usr/local/cuda-11.8
     echo 'export CUDA_HOME=/usr/local/cuda-11.8' >> ~/.bashrc
     ```

3. If you cannot install CUDA (e.g., no compatible GPU):
   - Use the development requirements: `pip install -r requirements-dev.txt`
   - Use Docker images with pre-configured CUDA

#### GPU Memory Issues
If you encounter out-of-memory errors while using vLLM:
1. Reduce batch size in configuration
2. Use a smaller model
3. Enable CPU offloading options (see vLLM documentation)

### Docker Issues

If Docker containers fail to start due to CUDA/GPU issues:

#### "Unknown runtime specified nvidia" Error
```
docker: Error response from daemon: Unknown runtime specified nvidia.
```

**Solution:**
1. Ensure NVIDIA Container Toolkit is properly installed:
   ```bash
   sudo apt-get install -y nvidia-container-toolkit
   ```

2. Configure Docker to use NVIDIA Container Toolkit:
   ```bash
   sudo nvidia-ctk runtime configure --runtime=docker
   sudo systemctl restart docker
   ```

3. Verify setup:
   ```bash
   # Test with this command - should display GPU info
   docker run --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
   ```

#### "Failed to initialize NVML" Error
```
docker: Error response from daemon: failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: error running hook #0: error running hook: exit status 1, stdout: , stderr: nvml error: driver/library version mismatch.
```

**Solution:**
1. Make sure your NVIDIA drivers match the CUDA version:
   ```bash
   # Check driver version
   nvidia-smi
   # Check CUDA version
   nvcc --version
   ```

2. Update NVIDIA drivers if needed:
   ```bash
   # Ubuntu example
   sudo apt-get install --reinstall nvidia-driver-XXX
   # Replace XXX with your version number
   ```

3. Reboot your system after driver update

#### CUDA Version Compatibility with vLLM

If you're experiencing compatibility issues between your CUDA version and vLLM:

1. Use a specific version of vLLM compatible with your CUDA version:
   ```bash
   # For CUDA 11.8
   pip install vllm-cu118
   # For CUDA 12.1
   pip install vllm-cu121
   ```

2. Or build vLLM from source for your specific CUDA version:
   ```bash
   git clone https://github.com/vllm-project/vllm.git
   cd vllm
   pip install -e .
   ```

## Value Proposition

- **Democratize LLM Fine-Tuning**: Make advanced AI customization accessible to non-experts
- **Ensure Data Quality**: Maintain semantic integrity of source documents in training data
- **Preserve Context**: Sophisticated processing to maintain meaning and relationships
- **Flexible Deployment**: Run locally for privacy or scale to cloud for collaboration
- **Customizable Workflows**: Adapt to different organizational needs and security requirements
- **Transparent Process**: Clear visibility into dataset generation and model training
- **Enterprise-Ready**: Collaboration, security, and scalability built-in from the ground up
- **Future-Proof**: Modular architecture designed for extensibility and technology evolution

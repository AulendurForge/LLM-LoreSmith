<p align="right">
  <a href="https://www.aulendur.com">
    <img src="frontend/public/assets/Aulendur Block Logo and Name.png" alt="Aulendur Logo" width="150">
  </a>
</p>

# LLM LoreSmith

<p align="center">
  <img src="frontend/public/assets/LLM LoreSmith.png" alt="LoreSmith Dwarf Logo" width="300">
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

<p align="center">
  <img src="frontend/public/assets/LoreSmith Snippet for README.png" alt="LoreSmith Snippet for README" width="900">
</p>

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

<p align="center">
  <img src="frontend/public/assets/LoreSmith Doc Ingestion for README.png" alt="LoreSmith Snippet for README" width="900">
</p>

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
- **PostgreSQL** (v13+)
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
   git clone https://github.com/AulendurForge/LLM-LoreSmith
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

4. Set up PostgreSQL database:
   
   Ensure PostgreSQL is installed and running:
   - Windows: PostgreSQL service should be running in Services
   - Linux: `sudo service postgresql start`
   - Mac: `brew services start postgresql`
   
   Configure the database connection in `.env` file:
   ```
   # Create .env file in the backend directory
   cd backend
   touch .env
   ```
   
   Add the following configuration to the `.env` file:
   ```
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/loresmith
   STORAGE_PATH=./data/documents
   JWT_SECRET=devSecret123
   LOG_LEVEL=debug
   ```
   
   > **Important**: Make sure to use `localhost` as the hostname in `DATABASE_URL` (not `postgres`), which ensures proper connection between the application and the database.
   
   The application will automatically:
   - Create the database if it doesn't exist
   - Run migrations to create the required tables
   - Seed initial data for testing

5. Start the application:

   ### Running in Development Mode (with Hot Reloading)
   
   This mode provides real-time code updates and is ideal for active development.
   
   **Method 1: Using the convenience script**
   ```bash
   # Make the script executable (first time only)
   chmod +x dev.sh
   
   # Start development environment
   ./dev.sh
   ```
   
   **Method 2: Starting components individually**
   
   Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Start the frontend (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   
   Features:
   - Hot Module Replacement (HMR) for real-time UI updates without page reloads
   - Source maps for easier debugging
   - Development tools and logging
   - Changes to React components update immediately in the browser
   
   ### Running in Production Mode
   
   This mode builds optimized static files and is suitable for testing production builds.
   
   **Method 1: Using the convenience script**
   ```bash
   # Make the script executable (first time only)
   chmod +x prod.sh
   
   # Start production environment
   ./prod.sh
   ```
   
   **Method 2: Using Docker Compose directly**
   ```bash
   # Build and start all services
   docker compose up -d
   
   # View logs
   docker compose logs -f
   
   # Stop containers
   docker compose down
   ```

6. Access the application:
   ```
   Frontend: http://localhost:3000
   Backend API: http://localhost:5000
   ```
   
### Troubleshooting Common Issues

#### Backend Cannot Connect to Database
If you see database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # Windows
   sc query postgresql
   
   # Linux/Mac
   ps aux | grep postgres
   ```

2. Check database connection settings in `.env`:
   - Ensure `DATABASE_URL` uses `localhost` (not `postgres`) as the hostname
   - Verify username, password, and database name are correct

3. Run database connection test:
   ```bash
   cd backend
   npm run test:db-connection
   ```

#### API Connection Refused Errors
If the frontend cannot connect to the backend (e.g., "ERR_CONNECTION_REFUSED"):

1. Verify the backend server is running:
   ```bash
   # Check if something is listening on port 5000
   netstat -ano | grep 5000
   ```

2. If running, but still getting connection errors, try restarting both frontend and backend:
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory (separate terminal)
   npm run dev
   ```

3. Test API connectivity directly:
   ```bash
   cd backend
   npm run test:api
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

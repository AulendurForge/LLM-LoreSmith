<p align="center">
  <img src="src/assets/Aulendur Block Logo and Name.png" alt="Aulendur Logo" width="300">
</p>

# LLM LoreSmith

<p align="center">
  <img src="src\assets\LLM LoreSmith.png" alt="LoreSmith Dwarf Logo" width="300">
</p>

LLM LoreSmith is a system designed to empower users—regardless of their machine learning expertise—to fine-tune large language models (LLMs) quickly and securely using credible, authoritative documents.

## Features

- **Document Ingestion & Validation**: Upload trusted documents and sources with automatic validation
- **Automated Dataset Generation**: Multistage pipeline to extract and refine content for training
- **Adaptive Fine-Tuning**: Automated fine-tuning with vLLM, dynamically adjusting training epochs
- **Enhanced Metadata System**: Configure and track custom metadata for documents and training samples
- **Multiple Training Schemas**: Support for various training formats including instruction-response, question-answer, summarization, classification, and completion
- **Data Security & Privacy**: Local execution with encryption and access controls
- **Scalable Architecture**: Designed to work locally or scale to cloud deployment
- **User-Friendly Interface**: Integrated UI with specialized components for each feature
- **Semantic Integrity Preservation**: Advanced processing to maintain meaning and context in training data

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- vLLM compatible environment

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/AulendurForge/LLM-LoreSmith.git
   cd LLM-LoreSmith
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python -m src.app
   ```

### Usage Modes

LLM LoreSmith can be run in different modes:

- **All (Default)**: Run both API and UI components
  ```
  python -m src.app --mode all
  ```

- **API Only**: Run only the API server
  ```
  python -m src.app --mode api
  ```

- **UI Only**: Run only the UI components
  ```
  python -m src.app --mode ui
  ```

Additional options:
- `--port`: Specify port number (default: 8000)
- `--host`: Specify host address (default: 0.0.0.0)
- `--debug`: Enable debug mode
- `--share`: Create a public link (UI mode only)

## Architecture

LLM LoreSmith follows a modular, API-first design with support for Model Context Protocol (MCP). The system is designed to run locally while being prepared for potential cloud deployment with multi-user support.

### Training Data Schemas

LLM LoreSmith supports multiple training data schemas to accommodate different fine-tuning needs:

1. **Instruction-Response Format**: For general instruction following tasks
2. **Question-Answer Format**: For knowledge-based applications
3. **Summarization Format**: For text summarization tasks
4. **Classification Format**: For categorization tasks
5. **Completion Format**: For text completion tasks

Each schema is optimized for specific use cases and includes appropriate preprocessing.

### Metadata System

The metadata system allows users to:
- Define custom metadata fields for documents (source, classification, author, etc.)
- Associate metadata with training samples for better organization and filtering
- Track provenance of training data throughout the fine-tuning process
- Apply security classifications and access controls based on metadata

## Development

This project is under active development by Aulendur LLC.

## Value Proposition

- **Democratize LLM Fine-Tuning**: Make advanced AI customization accessible to non-experts
- **Ensure Data Quality**: Maintain semantic integrity of source documents in training data
- **Preserve Context**: Sophisticated processing to maintain meaning and relationships
- **Flexible Deployment**: Run locally for privacy or scale to cloud for collaboration
- **Customizable Workflows**: Adapt to different organizational needs and security requirements
- **Transparent Process**: Clear visibility into dataset generation and model training

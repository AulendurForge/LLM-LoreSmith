# LLM LoreSmith Guided Workflow

This document provides an overview of the guided workflow interface in LLM LoreSmith, which helps users fine-tune large language models with credible documents through a step-by-step process.

## Overview

The guided workflow interface is designed to simplify the fine-tuning process by breaking it down into manageable steps. It guides users through the entire process from document upload to model fine-tuning, ensuring that each step is completed correctly before proceeding to the next.

## Workflow Steps

### Step 1: Document Upload

In this step, users can upload the documents they want to use for fine-tuning their LLM. The interface provides:
- Document upload functionality
- Optional metadata configuration
- A list of uploaded documents

Users should upload all relevant documents before proceeding to the next step.

### Step 2: Metadata Configuration

This step allows users to configure metadata for both documents and training samples:
- Document metadata (source, author, date, classification, tags)
- Training sample metadata (source document, sample type, quality, domain, tags)

Proper metadata configuration helps with organization, filtering, and tracking the provenance of training data.

### Step 3: Dataset Generation

In this step, users can create datasets from their uploaded documents:
- Select documents to include in the dataset
- Optionally provide a dataset name
- Generate the dataset
- View dataset statistics and quality metrics

The system analyzes the generated dataset and provides feedback on its sufficiency for fine-tuning.

### Step 4: Training Schema Selection

This step guides users in selecting the appropriate training schema for their use case:
- Instruction-Response Format: For general instruction following tasks
- Question-Answer Format: For knowledge-based applications
- Summarization Format: For text summarization tasks
- Classification Format: For categorization tasks
- Completion Format: For text completion tasks

Each schema includes a description, use cases, and examples to help users make the right choice.

### Step 5: Fine-Tuning

The final step allows users to configure and start the fine-tuning process:
- Select a base model
- Specify the dataset to use
- Configure training parameters (epochs, learning rate)
- Monitor fine-tuning progress
- View training results

## Expert Mode

For advanced users, the interface provides an "Expert Mode" toggle that gives direct access to all features and options without the step-by-step guidance. This mode is recommended for users who are already familiar with the fine-tuning process and want more control over each aspect.

## Progress Tracking

The guided workflow includes a progress bar that shows the user's current position in the overall process. This helps users understand how much they've completed and how much remains.

## Best Practices

1. **Document Quality**: Upload high-quality, authoritative documents for the best results.
2. **Metadata**: Take time to configure proper metadata to enhance organization and traceability.
3. **Dataset Size**: Ensure your dataset has sufficient samples for effective fine-tuning.
4. **Schema Selection**: Choose the training schema that best matches your intended use case.
5. **Parameter Tuning**: Start with the default fine-tuning parameters and adjust as needed based on results.

## Troubleshooting

If you encounter issues during the workflow:
- Check that all required fields are filled in each step
- Ensure your documents are in a supported format
- Verify that your dataset has sufficient samples for fine-tuning
- Check the system logs for any error messages

For additional help, refer to the full documentation or contact support.

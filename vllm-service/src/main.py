"""
vLLM Service for LLM LoreSmith
Provides API endpoints for text generation and fine-tuning.
"""

import os
import logging
from typing import List, Optional, Dict, Any, Union

import torch
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from vllm import LLM, SamplingParams

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="vLLM Service",
    description="API for LLM inference and fine-tuning with vLLM",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
MODEL_DIR = os.environ.get("MODEL_DIR", "./models")
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "meta-llama/Llama-2-7b-chat-hf")
llm = None  # Will be lazily loaded


# Request/Response models
class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = Field(default=512, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    stop_sequences: Optional[List[str]] = None


class GenerateResponse(BaseModel):
    text: str
    usage: Dict[str, int]


class HealthResponse(BaseModel):
    status: str
    gpu_available: bool
    cuda_version: Optional[str] = None
    models_loaded: List[str]


# Lazy loading of LLM model
def get_llm():
    global llm
    if llm is None:
        logger.info(f"Loading model {DEFAULT_MODEL}")
        try:
            model_path = os.path.join(MODEL_DIR, DEFAULT_MODEL) if os.path.exists(os.path.join(MODEL_DIR, DEFAULT_MODEL)) else DEFAULT_MODEL
            llm = LLM(model=model_path)
            logger.info(f"Model loaded successfully: {DEFAULT_MODEL}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise RuntimeError(f"Failed to load model: {e}")
    return llm


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    gpu_available = torch.cuda.is_available()
    cuda_version = torch.version.cuda if gpu_available else None
    
    # Get list of available models
    models = []
    if os.path.exists(MODEL_DIR):
        models = [d for d in os.listdir(MODEL_DIR) if os.path.isdir(os.path.join(MODEL_DIR, d))]
    
    return {
        "status": "healthy",
        "gpu_available": gpu_available,
        "cuda_version": cuda_version,
        "models_loaded": [DEFAULT_MODEL] if llm else [],
    }


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """Generate text from a prompt"""
    try:
        model = get_llm()
        
        # Configure sampling parameters
        sampling_params = SamplingParams(
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            stop=request.stop_sequences,
        )
        
        # Generate text
        outputs = model.generate([request.prompt], sampling_params)
        generated_text = outputs[0].outputs[0].text
        
        # Calculate token usage (approximate)
        prompt_tokens = len(request.prompt.split())
        completion_tokens = len(generated_text.split())
        
        return {
            "text": generated_text,
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
        }
    except Exception as e:
        logger.error(f"Text generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models")
async def list_models():
    """List available models"""
    models = []
    if os.path.exists(MODEL_DIR):
        models = [d for d in os.listdir(MODEL_DIR) if os.path.isdir(os.path.join(MODEL_DIR, d))]
    return {"models": models}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 
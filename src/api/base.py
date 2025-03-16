"""
Base API module for LLM LoreSmith.
Defines the core API structure and endpoints.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional

# Create the FastAPI application
app = FastAPI(
    title="LLM LoreSmith API",
    description="API for fine-tuning large language models with credible documents",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this would be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint returning API information."""
    return {
        "name": "LLM LoreSmith API",
        "version": "0.1.0",
        "status": "operational"
    }

# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}

# API version endpoint
@app.get("/version")
async def version() -> Dict[str, str]:
    """Get API version information."""
    return {"version": "0.1.0"}

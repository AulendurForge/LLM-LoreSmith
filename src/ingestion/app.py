"""
Main application entry point for LLM LoreSmith document ingestion module.
"""

import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from ..api.base import app as base_app
from ..api.document_routes import router as document_router
from ..config.config_manager import config

# Create data directories
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "documents"), exist_ok=True)

# Include document routes
base_app.include_router(document_router)

# Add additional middleware for document handling
base_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this would be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add startup event
@base_app.on_event("startup")
async def startup_event():
    """Initialize components on startup."""
    print(f"Starting LLM LoreSmith document ingestion module (v{config.get('app.version', '0.1.0')})")
    print(f"Deployment mode: {config.get('deployment.mode', 'local')}")
    print(f"Debug mode: {config.get('deployment.debug', False)}")

# Add shutdown event
@base_app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    print("Shutting down LLM LoreSmith document ingestion module")

# Export the app
app = base_app

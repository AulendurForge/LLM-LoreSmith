"""
Main application entry point for LLM LoreSmith.
"""

import os
import argparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import gradio as gr
import uvicorn

from src.api.base import app as api_app
from src.ui.main_ui import main_ui
from src.config.config_manager import config


def create_app(mode="all"):
    """
    Create the main application.
    
    Args:
        mode: Application mode (all, api, ui)
        
    Returns:
        Application instance
    """
    if mode == "api":
        return api_app
    
    # Create Gradio UI
    ui = main_ui.create_ui()
    
    if mode == "ui":
        return ui
    
    # Combine API and UI
    app = FastAPI(
        title="LLM LoreSmith",
        description="Fine-tune large language models with credible documents",
        version=config.get('app.version', '0.1.0')
    )
    
    # Mount the API
    app.mount("/api", api_app)
    
    # Mount the UI
    app = gr.mount_gradio_app(app, ui, path="/")
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, this would be restricted
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="LLM LoreSmith")
    parser.add_argument("--mode", choices=["all", "api", "ui"], default="all",
                        help="Application mode (all, api, ui)")
    parser.add_argument("--port", type=int, default=8000,
                        help="Port number")
    parser.add_argument("--host", default="0.0.0.0",
                        help="Host address")
    parser.add_argument("--debug", action="store_true",
                        help="Enable debug mode")
    parser.add_argument("--share", action="store_true",
                        help="Create a public link (UI mode only)")
    
    args = parser.parse_args()
    
    # Create data directories
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "documents"), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "datasets"), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "models"), exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "metadata"), exist_ok=True)
    
    print(f"Starting LLM LoreSmith (v{config.get('app.version', '0.1.0')})")
    print(f"Mode: {args.mode}")
    print(f"Debug: {args.debug}")
    
    if args.mode == "ui":
        app = create_app(mode="ui")
        app.launch(server_name=args.host, server_port=args.port, share=args.share)
    else:
        app = create_app(mode=args.mode)
        uvicorn.run(app, host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()

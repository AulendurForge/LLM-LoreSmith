"""
API endpoints for fine-tuning in LLM LoreSmith.
"""

from fastapi import APIRouter, HTTPException, Body, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
import json
import os

from ..fine_tuning.fine_tuning_manager import fine_tuning_manager

# Create router
router = APIRouter(
    prefix="/fine-tuning",
    tags=["fine-tuning"],
    responses={404: {"description": "Not found"}},
)

@router.post("/start")
async def start_fine_tuning(
    background_tasks: BackgroundTasks,
    dataset_id: str = Body(..., description="Dataset ID to use for fine-tuning"),
    model_name: Optional[str] = Body(None, description="Base model name"),
    training_config: Optional[Dict[str, Any]] = Body(None, description="Optional training configuration")
):
    """
    Start fine-tuning a model on a dataset.
    
    Args:
        dataset_id: Dataset ID
        model_name: Optional base model name
        training_config: Optional training configuration
    
    Returns:
        JSON response with fine-tuning job information
    """
    # Start fine-tuning in background
    def run_fine_tuning():
        fine_tuning_manager.fine_tune(dataset_id, model_name, training_config)
    
    background_tasks.add_task(run_fine_tuning)
    
    return {
        "success": True,
        "message": "Fine-tuning job started",
        "dataset_id": dataset_id,
        "model_name": model_name or fine_tuning_manager.default_model
    }

@router.get("/models")
async def list_models():
    """
    List all fine-tuned models.
    
    Returns:
        List of model metadata
    """
    models = fine_tuning_manager.list_models()
    return models

@router.get("/models/{model_id}")
async def get_model_info(model_id: str):
    """
    Get information about a specific model.
    
    Args:
        model_id: Model ID
    
    Returns:
        Model metadata
    """
    models = fine_tuning_manager.list_models()
    for model in models:
        if model.get("model_id") == model_id:
            return model
    
    raise HTTPException(status_code=404, detail="Model not found")

@router.post("/models/{model_id}/evaluate")
async def evaluate_model(
    background_tasks: BackgroundTasks,
    model_id: str,
    dataset_id: Optional[str] = Body(None, description="Optional dataset ID for evaluation")
):
    """
    Evaluate a fine-tuned model.
    
    Args:
        model_id: Model ID
        dataset_id: Optional dataset ID for evaluation
    
    Returns:
        JSON response with evaluation job information
    """
    # Start evaluation in background
    def run_evaluation():
        fine_tuning_manager.evaluate_model(model_id, dataset_id)
    
    background_tasks.add_task(run_evaluation)
    
    return {
        "success": True,
        "message": "Evaluation job started",
        "model_id": model_id,
        "dataset_id": dataset_id
    }

@router.delete("/models/{model_id}")
async def delete_model(model_id: str):
    """
    Delete a fine-tuned model.
    
    Args:
        model_id: Model ID
    
    Returns:
        Success message
    """
    success = fine_tuning_manager.delete_model(model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return {"success": True, "message": "Model deleted successfully"}

@router.get("/config/defaults")
async def get_default_config():
    """
    Get default fine-tuning configuration.
    
    Returns:
        Default configuration
    """
    return {
        "default_model": fine_tuning_manager.default_model,
        "default_lora_r": fine_tuning_manager.default_lora_r,
        "default_lora_alpha": fine_tuning_manager.default_lora_alpha,
        "default_lora_dropout": fine_tuning_manager.default_lora_dropout,
        "default_learning_rate": fine_tuning_manager.default_learning_rate,
        "default_batch_size": fine_tuning_manager.default_batch_size,
        "default_max_steps": fine_tuning_manager.default_max_steps,
        "default_eval_steps": fine_tuning_manager.default_eval_steps,
        "default_save_steps": fine_tuning_manager.default_save_steps,
        "default_warmup_steps": fine_tuning_manager.default_warmup_steps,
        "default_max_epochs": fine_tuning_manager.default_max_epochs,
        "default_eval_interval": fine_tuning_manager.default_eval_interval
    }

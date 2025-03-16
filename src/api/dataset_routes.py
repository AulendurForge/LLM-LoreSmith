"""
API endpoints for dataset generation in LLM LoreSmith.
"""

from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
import json

from ..dataset_generation.dataset_pipeline import dataset_pipeline, dataset_structurer

# Create router
router = APIRouter(
    prefix="/datasets",
    tags=["datasets"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate")
async def generate_dataset(
    doc_ids: List[str] = Body(..., description="List of document IDs to include in the dataset"),
    dataset_name: Optional[str] = Body(None, description="Optional dataset name")
):
    """
    Generate a dataset from documents.
    
    Args:
        doc_ids: List of document IDs
        dataset_name: Optional dataset name
    
    Returns:
        JSON response with generation result
    """
    if not doc_ids:
        raise HTTPException(status_code=400, detail="No document IDs provided")
    
    result = dataset_pipeline.generate_dataset(doc_ids, dataset_name)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@router.get("/")
async def list_datasets():
    """
    List all generated datasets.
    
    Returns:
        List of dataset IDs and metadata
    """
    dataset_ids = dataset_structurer.list_datasets()
    result = []
    
    for dataset_id in dataset_ids:
        metadata = dataset_structurer.get_dataset_metadata(dataset_id)
        result.append({
            "dataset_id": dataset_id,
            "metadata": metadata or {}
        })
    
    return result

@router.get("/{dataset_id}")
async def get_dataset_info(dataset_id: str):
    """
    Get information about a specific dataset.
    
    Args:
        dataset_id: Dataset ID
    
    Returns:
        Dataset metadata and analysis
    """
    metadata = dataset_structurer.get_dataset_metadata(dataset_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load analysis
    import os
    import json
    analysis_path = os.path.join(dataset_structurer.base_dir, dataset_id, "analysis.json")
    analysis = None
    if os.path.isfile(analysis_path):
        with open(analysis_path, 'r', encoding='utf-8') as f:
            analysis = json.load(f)
    
    return {
        "dataset_id": dataset_id,
        "metadata": metadata,
        "analysis": analysis
    }

@router.get("/{dataset_id}/samples")
async def get_dataset_samples(
    dataset_id: str,
    limit: int = Query(10, description="Maximum number of samples to return"),
    offset: int = Query(0, description="Number of samples to skip")
):
    """
    Get samples from a dataset.
    
    Args:
        dataset_id: Dataset ID
        limit: Maximum number of samples to return
        offset: Number of samples to skip
    
    Returns:
        Dataset samples
    """
    samples = dataset_structurer.get_dataset(dataset_id)
    if not samples:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Apply pagination
    paginated_samples = samples[offset:offset + limit]
    
    return {
        "dataset_id": dataset_id,
        "total_samples": len(samples),
        "offset": offset,
        "limit": limit,
        "samples": paginated_samples
    }

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """
    Delete a dataset.
    
    Args:
        dataset_id: Dataset ID
    
    Returns:
        Success message
    """
    success = dataset_structurer.delete_dataset(dataset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return {"success": True, "message": "Dataset deleted successfully"}

"""
API endpoints for document ingestion in LLM LoreSmith.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
import os
import tempfile
import shutil
import json
from datetime import datetime

from ..ingestion.document_manager import document_ingestion, document_storage, document_validator

# Create router
router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    responses={404: {"description": "Not found"}},
)

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: str = Form(None)
):
    """
    Upload and ingest a document.
    
    Args:
        file: Document file
        metadata: Optional JSON string with document metadata
    
    Returns:
        JSON response with ingestion result
    """
    # Parse metadata if provided
    meta_dict = None
    if metadata:
        try:
            meta_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid metadata format")
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    try:
        # Write uploaded file to temporary file
        shutil.copyfileobj(file.file, temp_file)
        temp_file.close()
        
        # Add file name to metadata if not provided
        if meta_dict is None:
            meta_dict = {}
        if "filename" not in meta_dict:
            meta_dict["filename"] = file.filename
        if "upload_time" not in meta_dict:
            meta_dict["upload_time"] = datetime.now().isoformat()
        
        # Ingest document
        success, message, doc_id = document_ingestion.ingest_document(temp_file.name, meta_dict)
        
        if not success:
            raise HTTPException(status_code=400, detail=message)
        
        return {
            "success": True,
            "message": message,
            "document_id": doc_id,
            "filename": file.filename
        }
    finally:
        # Clean up temporary file in background
        background_tasks.add_task(os.unlink, temp_file.name)

@router.get("/")
async def list_documents():
    """
    List all ingested documents.
    
    Returns:
        List of document IDs and metadata
    """
    doc_ids = document_storage.list_documents()
    result = []
    
    for doc_id in doc_ids:
        metadata = document_storage.get_document_metadata(doc_id)
        result.append({
            "document_id": doc_id,
            "metadata": metadata or {}
        })
    
    return result

@router.get("/{document_id}")
async def get_document_info(document_id: str):
    """
    Get information about a specific document.
    
    Args:
        document_id: Document ID
    
    Returns:
        Document metadata
    """
    doc_path = document_storage.get_document_path(document_id)
    if not doc_path:
        raise HTTPException(status_code=404, detail="Document not found")
    
    metadata = document_storage.get_document_metadata(document_id)
    
    return {
        "document_id": document_id,
        "file_path": doc_path,
        "metadata": metadata or {}
    }

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document.
    
    Args:
        document_id: Document ID
    
    Returns:
        Success message
    """
    success = document_storage.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"success": True, "message": "Document deleted successfully"}

@router.get("/validate")
async def get_validation_info():
    """
    Get information about document validation rules.
    
    Returns:
        Validation rules
    """
    return {
        "supported_types": list(document_validator.SUPPORTED_TYPES.keys()),
        "min_size_bytes": document_validator.MIN_SIZE,
        "max_size_bytes": document_validator.max_size
    }

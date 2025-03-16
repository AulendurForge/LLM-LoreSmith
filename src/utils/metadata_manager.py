"""
Enhanced metadata configuration for LLM LoreSmith.
Provides support for custom metadata at document and training sample levels.
"""

import os
import json
from typing import Dict, List, Optional, Any, Set, Tuple
from pathlib import Path
import uuid
import time

from ..config.config_manager import config


class MetadataManager:
    """Manages metadata for documents and training samples."""
    
    def __init__(self):
        """Initialize the metadata manager."""
        self.base_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data",
            "metadata"
        )
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Default metadata schemas
        self.default_document_schema = {
            "source": {
                "type": "string",
                "description": "Source of the document",
                "required": False
            },
            "author": {
                "type": "string",
                "description": "Author of the document",
                "required": False
            },
            "date": {
                "type": "string",
                "description": "Date of the document",
                "required": False
            },
            "classification": {
                "type": "string",
                "description": "Security classification",
                "required": False,
                "enum": ["Unclassified", "Confidential", "Secret", "Top Secret"]
            },
            "tags": {
                "type": "array",
                "description": "Tags for categorization",
                "required": False,
                "items": {
                    "type": "string"
                }
            }
        }
        
        self.default_sample_schema = {
            "source_document": {
                "type": "string",
                "description": "ID of the source document",
                "required": True
            },
            "sample_type": {
                "type": "string",
                "description": "Type of training sample",
                "required": True,
                "enum": ["instruction", "question-answer", "summarization", "classification", "completion"]
            },
            "quality": {
                "type": "number",
                "description": "Quality score (0-100)",
                "required": False,
                "minimum": 0,
                "maximum": 100
            },
            "domain": {
                "type": "string",
                "description": "Knowledge domain",
                "required": False
            },
            "tags": {
                "type": "array",
                "description": "Tags for categorization",
                "required": False,
                "items": {
                    "type": "string"
                }
            }
        }
        
        # Load custom schemas if they exist
        self.document_schema = self._load_schema("document_schema.json") or self.default_document_schema
        self.sample_schema = self._load_schema("sample_schema.json") or self.default_sample_schema
    
    def get_document_schema(self) -> Dict[str, Any]:
        """
        Get the current document metadata schema.
        
        Returns:
            Document metadata schema
        """
        return self.document_schema
    
    def get_sample_schema(self) -> Dict[str, Any]:
        """
        Get the current training sample metadata schema.
        
        Returns:
            Sample metadata schema
        """
        return self.sample_schema
    
    def update_document_schema(self, schema: Dict[str, Any]) -> bool:
        """
        Update the document metadata schema.
        
        Args:
            schema: New document metadata schema
            
        Returns:
            True if schema was updated successfully
        """
        try:
            # Validate schema
            self._validate_schema(schema)
            
            # Update schema
            self.document_schema = schema
            
            # Save schema
            self._save_schema("document_schema.json", schema)
            
            return True
        except Exception as e:
            print(f"Error updating document schema: {str(e)}")
            return False
    
    def update_sample_schema(self, schema: Dict[str, Any]) -> bool:
        """
        Update the training sample metadata schema.
        
        Args:
            schema: New sample metadata schema
            
        Returns:
            True if schema was updated successfully
        """
        try:
            # Validate schema
            self._validate_schema(schema)
            
            # Update schema
            self.sample_schema = schema
            
            # Save schema
            self._save_schema("sample_schema.json", schema)
            
            return True
        except Exception as e:
            print(f"Error updating sample schema: {str(e)}")
            return False
    
    def validate_document_metadata(self, metadata: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate document metadata against the schema.
        
        Args:
            metadata: Document metadata
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        return self._validate_metadata(metadata, self.document_schema)
    
    def validate_sample_metadata(self, metadata: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate sample metadata against the schema.
        
        Args:
            metadata: Sample metadata
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        return self._validate_metadata(metadata, self.sample_schema)
    
    def get_metadata_fields(self, schema_type: str = "document") -> List[Dict[str, Any]]:
        """
        Get metadata fields for UI display.
        
        Args:
            schema_type: Type of schema ("document" or "sample")
            
        Returns:
            List of metadata fields with UI information
        """
        schema = self.document_schema if schema_type == "document" else self.sample_schema
        fields = []
        
        for field_name, field_info in schema.items():
            field = {
                "name": field_name,
                "description": field_info.get("description", ""),
                "type": field_info.get("type", "string"),
                "required": field_info.get("required", False)
            }
            
            # Add enum values if present
            if "enum" in field_info:
                field["enum"] = field_info["enum"]
            
            # Add min/max if present
            if "minimum" in field_info:
                field["minimum"] = field_info["minimum"]
            if "maximum" in field_info:
                field["maximum"] = field_info["maximum"]
            
            fields.append(field)
        
        return fields
    
    def _load_schema(self, filename: str) -> Optional[Dict[str, Any]]:
        """
        Load a schema from file.
        
        Args:
            filename: Schema filename
            
        Returns:
            Schema or None if file doesn't exist
        """
        file_path = os.path.join(self.base_dir, filename)
        if not os.path.isfile(file_path):
            return None
        
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading schema {filename}: {str(e)}")
            return None
    
    def _save_schema(self, filename: str, schema: Dict[str, Any]) -> bool:
        """
        Save a schema to file.
        
        Args:
            filename: Schema filename
            schema: Schema to save
            
        Returns:
            True if schema was saved successfully
        """
        file_path = os.path.join(self.base_dir, filename)
        
        try:
            with open(file_path, "w") as f:
                json.dump(schema, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving schema {filename}: {str(e)}")
            return False
    
    def _validate_schema(self, schema: Dict[str, Any]) -> bool:
        """
        Validate a metadata schema.
        
        Args:
            schema: Schema to validate
            
        Returns:
            True if schema is valid
        
        Raises:
            ValueError: If schema is invalid
        """
        if not isinstance(schema, dict):
            raise ValueError("Schema must be a dictionary")
        
        for field_name, field_info in schema.items():
            if not isinstance(field_info, dict):
                raise ValueError(f"Field {field_name} must be a dictionary")
            
            if "type" not in field_info:
                raise ValueError(f"Field {field_name} must have a type")
            
            field_type = field_info["type"]
            if field_type not in ["string", "number", "boolean", "array", "object"]:
                raise ValueError(f"Field {field_name} has invalid type: {field_type}")
            
            if field_type == "array" and "items" not in field_info:
                raise ValueError(f"Array field {field_name} must have items definition")
        
        return True
    
    def _validate_metadata(self, metadata: Dict[str, Any], schema: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate metadata against a schema.
        
        Args:
            metadata: Metadata to validate
            schema: Schema to validate against
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not isinstance(metadata, dict):
            return False, "Metadata must be a dictionary"
        
        # Check required fields
        for field_name, field_info in schema.items():
            if field_info.get("required", False) and field_name not in metadata:
                return False, f"Required field {field_name} is missing"
        
        # Validate field types and values
        for field_name, field_value in metadata.items():
            if field_name not in schema:
                continue  # Allow extra fields
            
            field_info = schema[field_name]
            field_type = field_info["type"]
            
            # Validate type
            if field_type == "string" and not isinstance(field_value, str):
                return False, f"Field {field_name} must be a string"
            elif field_type == "number" and not isinstance(field_value, (int, float)):
                return False, f"Field {field_name} must be a number"
            elif field_type == "boolean" and not isinstance(field_value, bool):
                return False, f"Field {field_name} must be a boolean"
            elif field_type == "array" and not isinstance(field_value, list):
                return False, f"Field {field_name} must be an array"
            elif field_type == "object" and not isinstance(field_value, dict):
                return False, f"Field {field_name} must be an object"
            
            # Validate enum
            if "enum" in field_info and field_value not in field_info["enum"]:
                return False, f"Field {field_name} must be one of: {', '.join(field_info['enum'])}"
            
            # Validate min/max
            if field_type == "number":
                if "minimum" in field_info and field_value < field_info["minimum"]:
                    return False, f"Field {field_name} must be at least {field_info['minimum']}"
                if "maximum" in field_info and field_value > field_info["maximum"]:
                    return False, f"Field {field_name} must be at most {field_info['maximum']}"
            
            # Validate array items
            if field_type == "array" and "items" in field_info:
                item_type = field_info["items"]["type"]
                for i, item in enumerate(field_value):
                    if item_type == "string" and not isinstance(item, str):
                        return False, f"Item {i} in field {field_name} must be a string"
                    elif item_type == "number" and not isinstance(item, (int, float)):
                        return False, f"Item {i} in field {field_name} must be a number"
                    elif item_type == "boolean" and not isinstance(item, bool):
                        return False, f"Item {i} in field {field_name} must be a boolean"
        
        return True, ""


# Create singleton instance
metadata_manager = MetadataManager()

"""
API module for LLM LoreSmith.
Implements Model Context Protocol (MCP) for enhanced context management.
"""

from typing import Dict, Any, List, Optional
import json


class ModelContextProtocol:
    """
    Implementation of Model Context Protocol (MCP) for LLM context management.
    
    MCP provides standardized methods for managing context between the application
    and language models during fine-tuning and inference.
    """
    
    def __init__(self):
        """Initialize the MCP handler."""
        self.contexts = {}
        self.active_context_id = None
    
    def create_context(self, context_id: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a new context with optional metadata.
        
        Args:
            context_id: Unique identifier for the context
            metadata: Optional metadata associated with the context
            
        Returns:
            The context ID
        """
        self.contexts[context_id] = {
            "messages": [],
            "metadata": metadata or {},
            "created_at": "2025-03-16T01:10:00Z",  # Would use actual timestamp in production
        }
        return context_id
    
    def set_active_context(self, context_id: str) -> None:
        """
        Set the active context for subsequent operations.
        
        Args:
            context_id: The context ID to set as active
        """
        if context_id not in self.contexts:
            self.create_context(context_id)
        self.active_context_id = context_id
    
    def add_message(self, 
                   content: str, 
                   role: str = "user", 
                   context_id: Optional[str] = None) -> None:
        """
        Add a message to a context.
        
        Args:
            content: The message content
            role: The role of the message sender (user, assistant, system)
            context_id: The context ID to add the message to, or active context if None
        """
        target_context = context_id or self.active_context_id
        if not target_context or target_context not in self.contexts:
            raise ValueError("No active or valid context specified")
        
        self.contexts[target_context]["messages"].append({
            "role": role,
            "content": content,
            "timestamp": "2025-03-16T01:10:00Z",  # Would use actual timestamp in production
        })
    
    def get_context(self, context_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get a context by ID.
        
        Args:
            context_id: The context ID to retrieve, or active context if None
            
        Returns:
            The context data
        """
        target_context = context_id or self.active_context_id
        if not target_context or target_context not in self.contexts:
            raise ValueError("No active or valid context specified")
        
        return self.contexts[target_context]
    
    def get_messages(self, context_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all messages in a context.
        
        Args:
            context_id: The context ID to retrieve messages from, or active context if None
            
        Returns:
            List of messages in the context
        """
        return self.get_context(context_id)["messages"]
    
    def clear_context(self, context_id: Optional[str] = None) -> None:
        """
        Clear all messages in a context.
        
        Args:
            context_id: The context ID to clear, or active context if None
        """
        target_context = context_id or self.active_context_id
        if not target_context or target_context not in self.contexts:
            raise ValueError("No active or valid context specified")
        
        self.contexts[target_context]["messages"] = []
    
    def delete_context(self, context_id: str) -> None:
        """
        Delete a context.
        
        Args:
            context_id: The context ID to delete
        """
        if context_id in self.contexts:
            del self.contexts[context_id]
            if self.active_context_id == context_id:
                self.active_context_id = None
    
    def export_context(self, context_id: Optional[str] = None) -> str:
        """
        Export a context as a JSON string.
        
        Args:
            context_id: The context ID to export, or active context if None
            
        Returns:
            JSON string representation of the context
        """
        return json.dumps(self.get_context(context_id))
    
    def import_context(self, context_data: str, context_id: Optional[str] = None) -> str:
        """
        Import a context from a JSON string.
        
        Args:
            context_data: JSON string representation of the context
            context_id: The context ID to import into, or generate a new one if None
            
        Returns:
            The context ID
        """
        data = json.loads(context_data)
        target_id = context_id or data.get("id", f"ctx_{len(self.contexts)}")
        self.contexts[target_id] = data
        return target_id


# Create a singleton instance
mcp = ModelContextProtocol()

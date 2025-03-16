"""
Document ingestion UI components for LLM LoreSmith.
Provides a user interface for document upload and management.
"""

import os
import json
from typing import Dict, List, Optional, Any
import gradio as gr

from ..ingestion.document_manager import document_ingestion, document_storage
from ..config.config_manager import config


class DocumentIngestionUI:
    """UI components for document ingestion."""
    
    def __init__(self):
        """Initialize the document ingestion UI."""
        self.ui_colors = config.get_ui_colors()
        self.ui_fonts = config.get_ui_fonts()
    
    def upload_document(self, file_obj, metadata_json):
        """
        Handle document upload from UI.
        
        Args:
            file_obj: Uploaded file object
            metadata_json: JSON string with document metadata
            
        Returns:
            Result message
        """
        if file_obj is None:
            return "No file selected"
        
        # Parse metadata if provided
        metadata = None
        if metadata_json:
            try:
                metadata = json.loads(metadata_json)
            except json.JSONDecodeError:
                return "Invalid metadata format (must be valid JSON)"
        
        # Ingest document
        success, message, doc_id = document_ingestion.ingest_document(file_obj.name, metadata)
        
        if not success:
            return f"Error: {message}"
        
        return f"Document uploaded successfully. ID: {doc_id}"
    
    def list_documents(self):
        """
        List all ingested documents.
        
        Returns:
            HTML table of documents
        """
        doc_ids = document_storage.list_documents()
        if not doc_ids:
            return "No documents found"
        
        html = "<table style='width:100%; border-collapse: collapse;'>"
        html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Document ID</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Filename</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Upload Time</th>"
        html += "</tr>"
        
        for doc_id in doc_ids:
            metadata = document_storage.get_document_metadata(doc_id) or {}
            filename = metadata.get("filename", "Unknown")
            upload_time = metadata.get("upload_time", "Unknown")
            
            html += "<tr style='background-color: #FFFEFB;'>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{doc_id}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{filename}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{upload_time}</td>"
            html += "</tr>"
        
        html += "</table>"
        return html
    
    def delete_document(self, doc_id):
        """
        Delete a document.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Result message
        """
        if not doc_id:
            return "No document ID provided"
        
        success = document_storage.delete_document(doc_id)
        if not success:
            return f"Error: Document with ID {doc_id} not found"
        
        return f"Document {doc_id} deleted successfully"
    
    def create_ui_block(self):
        """
        Create a Gradio UI block for document ingestion.
        
        Returns:
            Gradio UI block
        """
        with gr.Blocks(theme=self._create_custom_theme()) as document_block:
            gr.Markdown("# Document Ingestion")
            gr.Markdown("Upload and manage documents for fine-tuning")
            
            with gr.Tabs():
                with gr.TabItem("Upload Document"):
                    with gr.Row():
                        with gr.Column():
                            file_input = gr.File(label="Select Document")
                            metadata_input = gr.Textbox(
                                label="Metadata (JSON format, optional)",
                                placeholder='{"source": "academic", "author": "Example Author", "year": 2025}'
                            )
                            upload_button = gr.Button("Upload Document", variant="primary")
                            upload_result = gr.Textbox(label="Result")
                            
                            upload_button.click(
                                fn=self.upload_document,
                                inputs=[file_input, metadata_input],
                                outputs=upload_result
                            )
                
                with gr.TabItem("Manage Documents"):
                    with gr.Row():
                        with gr.Column():
                            refresh_button = gr.Button("Refresh Document List")
                            document_list = gr.HTML(self.list_documents())
                            
                            refresh_button.click(
                                fn=self.list_documents,
                                inputs=[],
                                outputs=document_list
                            )
                    
                    with gr.Row():
                        with gr.Column():
                            doc_id_input = gr.Textbox(label="Document ID")
                            delete_button = gr.Button("Delete Document", variant="stop")
                            delete_result = gr.Textbox(label="Result")
                            
                            delete_button.click(
                                fn=self.delete_document,
                                inputs=[doc_id_input],
                                outputs=delete_result
                            )
        
        return document_block
    
    def _create_custom_theme(self):
        """
        Create a custom Gradio theme with Aulendur LLC branding.
        
        Returns:
            Gradio theme
        """
        return gr.themes.Base(
            primary_hue=gr.themes.colors.slate,
            secondary_hue=gr.themes.colors.gray,
            neutral_hue=gr.themes.colors.gray,
            font=[self.ui_fonts.get("body", "Nunito Sans"), "ui-sans-serif", "system-ui", "sans-serif"],
            font_mono=[self.ui_fonts.get("code", "Source Code Pro"), "ui-monospace", "monospace"],
        ).set(
            body_background_fill=self.ui_colors.get("primary", "#FFFEFB"),
            body_background_fill_dark=self.ui_colors.get("darker", "#182241"),
            body_text_color=self.ui_colors.get("dark", "#213C4E"),
            body_text_color_dark=self.ui_colors.get("primary", "#FFFEFB"),
            button_primary_background_fill=self.ui_colors.get("accent", "#5C798B"),
            button_primary_background_fill_hover=self.ui_colors.get("dark", "#213C4E"),
            button_primary_text_color=self.ui_colors.get("primary", "#FFFEFB"),
            button_secondary_background_fill=self.ui_colors.get("secondary", "#7B949C"),
            button_secondary_background_fill_hover=self.ui_colors.get("accent", "#5C798B"),
            button_secondary_text_color=self.ui_colors.get("primary", "#FFFEFB"),
        )


# Create singleton instance
document_ui = DocumentIngestionUI()

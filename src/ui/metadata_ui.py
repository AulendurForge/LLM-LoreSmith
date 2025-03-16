"""
UI components for metadata configuration in LLM LoreSmith.
Provides a user interface for managing document and training sample metadata.
"""

import os
import json
from typing import Dict, List, Optional, Any
import gradio as gr

from ..utils.metadata_manager import metadata_manager
from ..config.config_manager import config


class MetadataUI:
    """UI components for metadata configuration."""
    
    def __init__(self):
        """Initialize the metadata UI."""
        self.ui_colors = config.get_ui_colors()
        self.ui_fonts = config.get_ui_fonts()
    
    def get_document_schema(self):
        """
        Get the current document metadata schema.
        
        Returns:
            Document metadata schema as formatted text
        """
        schema = metadata_manager.get_document_schema()
        return json.dumps(schema, indent=2)
    
    def get_sample_schema(self):
        """
        Get the current training sample metadata schema.
        
        Returns:
            Sample metadata schema as formatted text
        """
        schema = metadata_manager.get_sample_schema()
        return json.dumps(schema, indent=2)
    
    def update_document_schema(self, schema_json):
        """
        Update the document metadata schema.
        
        Args:
            schema_json: JSON string of the new schema
            
        Returns:
            Result message
        """
        try:
            schema = json.loads(schema_json)
            success = metadata_manager.update_document_schema(schema)
            
            if success:
                return "Document metadata schema updated successfully"
            else:
                return "Error updating document metadata schema"
        except json.JSONDecodeError:
            return "Invalid JSON format"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def update_sample_schema(self, schema_json):
        """
        Update the training sample metadata schema.
        
        Args:
            schema_json: JSON string of the new schema
            
        Returns:
            Result message
        """
        try:
            schema = json.loads(schema_json)
            success = metadata_manager.update_sample_schema(schema)
            
            if success:
                return "Training sample metadata schema updated successfully"
            else:
                return "Error updating training sample metadata schema"
        except json.JSONDecodeError:
            return "Invalid JSON format"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def get_document_metadata_fields_html(self):
        """
        Get HTML representation of document metadata fields.
        
        Returns:
            HTML table of document metadata fields
        """
        fields = metadata_manager.get_metadata_fields("document")
        
        if not fields:
            return "No metadata fields defined"
        
        html = "<table style='width:100%; border-collapse: collapse;'>"
        html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Field Name</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Type</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Description</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Required</th>"
        html += "</tr>"
        
        for field in fields:
            name = field.get("name", "")
            field_type = field.get("type", "")
            description = field.get("description", "")
            required = "Yes" if field.get("required", False) else "No"
            
            html += "<tr style='background-color: #FFFEFB;'>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{name}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{field_type}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{description}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{required}</td>"
            html += "</tr>"
        
        html += "</table>"
        return html
    
    def get_sample_metadata_fields_html(self):
        """
        Get HTML representation of sample metadata fields.
        
        Returns:
            HTML table of sample metadata fields
        """
        fields = metadata_manager.get_metadata_fields("sample")
        
        if not fields:
            return "No metadata fields defined"
        
        html = "<table style='width:100%; border-collapse: collapse;'>"
        html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Field Name</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Type</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Description</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Required</th>"
        html += "</tr>"
        
        for field in fields:
            name = field.get("name", "")
            field_type = field.get("type", "")
            description = field.get("description", "")
            required = "Yes" if field.get("required", False) else "No"
            
            html += "<tr style='background-color: #FFFEFB;'>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{name}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{field_type}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{description}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{required}</td>"
            html += "</tr>"
        
        html += "</table>"
        return html
    
    def create_ui_block(self):
        """
        Create a Gradio UI block for metadata configuration.
        
        Returns:
            Gradio UI block
        """
        with gr.Blocks(theme=self._create_custom_theme()) as metadata_block:
            gr.Markdown("# Metadata Configuration")
            gr.Markdown("Configure metadata schemas for documents and training samples")
            
            with gr.Tabs():
                with gr.TabItem("Document Metadata"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### Current Document Metadata Fields")
                            doc_fields_html = gr.HTML(self.get_document_metadata_fields_html())
                            refresh_doc_button = gr.Button("Refresh")
                            
                            refresh_doc_button.click(
                                fn=self.get_document_metadata_fields_html,
                                inputs=[],
                                outputs=doc_fields_html
                            )
                    
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### Edit Document Metadata Schema")
                            doc_schema_json = gr.Textbox(
                                label="Document Schema (JSON)",
                                value=self.get_document_schema(),
                                lines=10
                            )
                            update_doc_button = gr.Button("Update Schema")
                            update_doc_result = gr.Textbox(label="Result")
                            
                            update_doc_button.click(
                                fn=self.update_document_schema,
                                inputs=[doc_schema_json],
                                outputs=update_doc_result
                            )
                
                with gr.TabItem("Training Sample Metadata"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### Current Training Sample Metadata Fields")
                            sample_fields_html = gr.HTML(self.get_sample_metadata_fields_html())
                            refresh_sample_button = gr.Button("Refresh")
                            
                            refresh_sample_button.click(
                                fn=self.get_sample_metadata_fields_html,
                                inputs=[],
                                outputs=sample_fields_html
                            )
                    
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("### Edit Training Sample Metadata Schema")
                            sample_schema_json = gr.Textbox(
                                label="Sample Schema (JSON)",
                                value=self.get_sample_schema(),
                                lines=10
                            )
                            update_sample_button = gr.Button("Update Schema")
                            update_sample_result = gr.Textbox(label="Result")
                            
                            update_sample_button.click(
                                fn=self.update_sample_schema,
                                inputs=[sample_schema_json],
                                outputs=update_sample_result
                            )
                
                with gr.TabItem("Help"):
                    gr.Markdown("""
                    ## Metadata Schema Help
                    
                    ### Schema Format
                    
                    Metadata schemas are defined in JSON format with the following structure:
                    
                    ```json
                    {
                      "field_name": {
                        "type": "string",
                        "description": "Field description",
                        "required": false
                      }
                    }
                    ```
                    
                    ### Supported Field Types
                    
                    - `string`: Text values
                    - `number`: Numeric values
                    - `boolean`: True/false values
                    - `array`: Lists of values
                    - `object`: Nested objects
                    
                    ### Additional Field Properties
                    
                    - `enum`: List of allowed values
                    - `minimum`: Minimum value (for numbers)
                    - `maximum`: Maximum value (for numbers)
                    - `items`: Definition for array items
                    
                    ### Example
                    
                    ```json
                    {
                      "source": {
                        "type": "string",
                        "description": "Source of the document",
                        "required": false
                      },
                      "classification": {
                        "type": "string",
                        "description": "Security classification",
                        "required": false,
                        "enum": ["Unclassified", "Confidential", "Secret", "Top Secret"]
                      },
                      "tags": {
                        "type": "array",
                        "description": "Tags for categorization",
                        "required": false,
                        "items": {
                          "type": "string"
                        }
                      }
                    }
                    ```
                    """)
        
        return metadata_block
    
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
metadata_ui = MetadataUI()

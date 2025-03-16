"""
UI components for training schema selection in LLM LoreSmith.
Provides a user interface for selecting and configuring training data schemas.
"""

import os
import json
from typing import Dict, List, Optional, Any
import gradio as gr

from ..utils.training_schema_manager import schema_manager
from ..config.config_manager import config


class SchemaUI:
    """UI components for training schema selection."""
    
    def __init__(self):
        """Initialize the schema UI."""
        self.ui_colors = config.get_ui_colors()
        self.ui_fonts = config.get_ui_fonts()
    
    def list_schemas(self):
        """
        List all available training schemas.
        
        Returns:
            List of schema names and descriptions
        """
        schemas = schema_manager.list_schemas()
        return [(schema["name"], f"{schema['name']} - {schema['description']}") for schema in schemas]
    
    def get_schema_info(self, schema_name):
        """
        Get information about a specific schema.
        
        Args:
            schema_name: Schema name
            
        Returns:
            HTML with schema information
        """
        if not schema_name:
            return "No schema selected"
        
        schema = schema_manager.get_schema(schema_name)
        if not schema:
            return "Schema not found"
        
        # Build HTML
        html = f"<h3>{schema.name.title()} Schema</h3>"
        html += f"<p><strong>Description:</strong> {schema.description}</p>"
        
        # Template
        html += "<h4>Template</h4>"
        html += "<pre style='background-color: #F5F5F5; padding: 10px; border-radius: 5px;'>"
        html += json.dumps(schema.get_template(), indent=2)
        html += "</pre>"
        
        # Use cases
        html += "<h4>Use Cases</h4>"
        html += "<ul>"
        for use_case in schema.get_use_cases():
            html += f"<li>{use_case}</li>"
        html += "</ul>"
        
        # Examples
        html += "<h4>Examples</h4>"
        for i, example in enumerate(schema.get_examples()):
            html += f"<div style='margin-bottom: 15px; padding: 10px; border: 1px solid #7B949C; border-radius: 5px;'>"
            html += f"<h5>Example {i+1}</h5>"
            
            for key, value in example.items():
                html += f"<p><strong>{key.title()}:</strong></p>"
                html += f"<pre style='background-color: #F5F5F5; padding: 10px; border-radius: 5px;'>{value}</pre>"
            
            html += "</div>"
        
        return html
    
    def preview_format(self, schema_name, input_text, output_text):
        """
        Preview a training sample formatted according to a schema.
        
        Args:
            schema_name: Schema name
            input_text: Input text
            output_text: Output text
            
        Returns:
            Formatted sample as JSON
        """
        if not schema_name or not input_text or not output_text:
            return "Please provide schema name, input text, and output text"
        
        try:
            sample = schema_manager.format_sample(schema_name, input_text, output_text)
            return json.dumps(sample, indent=2)
        except Exception as e:
            return f"Error formatting sample: {str(e)}"
    
    def detect_schema(self, input_text):
        """
        Detect the appropriate schema for input text.
        
        Args:
            input_text: Input text
            
        Returns:
            Detected schema name
        """
        if not input_text:
            return "Please provide input text"
        
        detected_schema = schema_manager.detect_schema(input_text)
        return f"Detected schema: {detected_schema}"
    
    def create_ui_block(self):
        """
        Create a Gradio UI block for schema selection.
        
        Returns:
            Gradio UI block
        """
        with gr.Blocks(theme=self._create_custom_theme()) as schema_block:
            gr.Markdown("# Training Schema Selection")
            gr.Markdown("Select and configure training data schemas for fine-tuning")
            
            with gr.Tabs():
                with gr.TabItem("Schema Information"):
                    with gr.Row():
                        with gr.Column():
                            schema_dropdown = gr.Dropdown(
                                choices=self.list_schemas(),
                                label="Select Schema"
                            )
                            
                            schema_info = gr.HTML()
                            
                            schema_dropdown.change(
                                fn=self.get_schema_info,
                                inputs=[schema_dropdown],
                                outputs=schema_info
                            )
                
                with gr.TabItem("Format Preview"):
                    with gr.Row():
                        with gr.Column():
                            preview_schema_dropdown = gr.Dropdown(
                                choices=self.list_schemas(),
                                label="Select Schema"
                            )
                            
                            input_text = gr.Textbox(
                                label="Input Text",
                                placeholder="Enter input text (e.g., instruction, question, document)",
                                lines=5
                            )
                            
                            output_text = gr.Textbox(
                                label="Output Text",
                                placeholder="Enter output text (e.g., response, answer, summary)",
                                lines=5
                            )
                            
                            preview_button = gr.Button("Preview Format")
                            
                            preview_result = gr.Code(
                                label="Formatted Sample",
                                language="json"
                            )
                            
                            preview_button.click(
                                fn=self.preview_format,
                                inputs=[preview_schema_dropdown, input_text, output_text],
                                outputs=preview_result
                            )
                
                with gr.TabItem("Schema Detection"):
                    with gr.Row():
                        with gr.Column():
                            detect_input = gr.Textbox(
                                label="Input Text",
                                placeholder="Enter text to detect appropriate schema",
                                lines=5
                            )
                            
                            detect_button = gr.Button("Detect Schema")
                            
                            detect_result = gr.Textbox(label="Result")
                            
                            detect_button.click(
                                fn=self.detect_schema,
                                inputs=[detect_input],
                                outputs=detect_result
                            )
                
                with gr.TabItem("Help"):
                    gr.Markdown("""
                    ## Training Schema Help
                    
                    ### Available Schemas
                    
                    1. **Instruction-Response Format**
                       - For general instruction following tasks
                       - Example: "Write a poem about..." → "Here's a poem..."
                    
                    2. **Question-Answer Format**
                       - For knowledge-based applications
                       - Example: "What is the capital of France?" → "The capital of France is Paris."
                    
                    3. **Summarization Format**
                       - For text summarization tasks
                       - Example: [Long document] → [Concise summary]
                    
                    4. **Classification Format**
                       - For categorization tasks
                       - Example: "I love this product!" → "positive"
                    
                    5. **Completion Format**
                       - For text completion tasks
                       - Example: "Once upon a time" → "there was a magical kingdom..."
                    
                    ### When to Use Each Schema
                    
                    - **Instruction-Response**: Use for teaching the model to follow instructions, perform tasks, or generate content based on specific directions.
                    
                    - **Question-Answer**: Use for factual knowledge, information retrieval, and building Q&A systems.
                    
                    - **Summarization**: Use when you want the model to condense information while preserving key points.
                    
                    - **Classification**: Use for sentiment analysis, topic categorization, or any task where the output is a label or category.
                    
                    - **Completion**: Use for creative writing, code completion, or any task where the model should continue from a prompt.
                    
                    ### Best Practices
                    
                    - Choose the schema that best matches your intended use case
                    - Be consistent with your schema throughout your dataset
                    - Provide clear examples that demonstrate the expected behavior
                    - Consider using multiple schemas for different aspects of your application
                    """)
        
        return schema_block
    
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
schema_ui = SchemaUI()

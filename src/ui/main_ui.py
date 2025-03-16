"""
Main UI application for LLM LoreSmith.
Integrates all UI components into a single interface.
"""

import os
import gradio as gr
from typing import Dict, Any

from .document_ui import document_ui
from .dataset_ui import dataset_ui
from .fine_tuning_ui import fine_tuning_ui
from .metadata_ui import metadata_ui
from .schema_ui import schema_ui
from .workflow_ui import workflow_ui
from ..config.config_manager import config


class MainUI:
    """Main UI application for LLM LoreSmith."""
    
    def __init__(self):
        """Initialize the main UI application."""
        self.ui_colors = config.get_ui_colors()
        self.ui_fonts = config.get_ui_fonts()
        self.app_version = config.get('app.version', '0.1.0')
        
    def create_ui(self):
        """
        Create the main UI application.
        
        Returns:
            Gradio Blocks application
        """
        with gr.Blocks(theme=self._create_custom_theme(), title="LLM LoreSmith") as app:
            gr.Markdown(f"# LLM LoreSmith v{self.app_version}")
            gr.Markdown("Fine-tune large language models with credible documents")
            
            with gr.Tabs() as tabs:
                with gr.TabItem("Guided Workflow", id="workflow"):
                    workflow_ui.create_ui_block()
                
                with gr.TabItem("Documents"):
                    document_ui.create_ui_block()
                
                with gr.TabItem("Datasets"):
                    dataset_ui.create_ui_block()
                
                with gr.TabItem("Fine-Tuning"):
                    fine_tuning_ui.create_ui_block()
                
                with gr.TabItem("Metadata Configuration"):
                    metadata_ui.create_ui_block()
                
                with gr.TabItem("Training Schemas"):
                    schema_ui.create_ui_block()
                
                with gr.TabItem("About"):
                    self._create_about_tab()
            
        return app
    
    def _create_about_tab(self):
        """Create the About tab content."""
        gr.Markdown("""
        ## About LLM LoreSmith
        
        LLM LoreSmith is a system designed to empower users—regardless of their machine learning expertise—to fine-tune large language models (LLMs) quickly and securely using credible, authoritative documents.
        
        ### Features
        
        - **Document Ingestion & Validation**: Upload trusted documents and sources with automatic validation
        - **Automated Dataset Generation**: Multistage pipeline to extract and refine content for training
        - **Adaptive Fine-Tuning**: Automated fine-tuning with vLLM, dynamically adjusting training epochs
        - **Data Security & Privacy**: Local execution with encryption and access controls
        - **Scalable Architecture**: Designed to work locally or scale to cloud deployment
        - **User-Friendly Interface**: Guided workflow with advanced options for experts
        - **Customizable Metadata**: Configure and track custom metadata for documents and training samples
        - **Multiple Training Schemas**: Support for various training formats beyond question-answer pairs
        - **Semantic Integrity Preservation**: Advanced processing to maintain meaning and context in training data
        
        ### Development
        
        This project is under active development by Aulendur LLC.
        """)
    
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
main_ui = MainUI()

# Function to launch the UI
def launch_ui(port=7860, share=False):
    """
    Launch the main UI application.
    
    Args:
        port: Port number to use
        share: Whether to create a public link
        
    Returns:
        Gradio application instance
    """
    app = main_ui.create_ui()
    app.launch(server_port=port, share=share)
    return app


if __name__ == "__main__":
    launch_ui()

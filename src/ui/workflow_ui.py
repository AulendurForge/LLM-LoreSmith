"""
Guided workflow UI components for LLM LoreSmith.
Provides a step-by-step wizard and advanced mode for fine-tuning LLMs.
"""

import os
import json
from typing import Dict, List, Optional, Any
import gradio as gr
import time

from .document_ui import document_ui
from .dataset_ui import dataset_ui
from .fine_tuning_ui import fine_tuning_ui
from .metadata_ui import metadata_ui
from .schema_ui import schema_ui
from ..ingestion.document_manager import document_storage
from ..dataset_generation.dataset_pipeline import dataset_structurer
from ..config.config_manager import config


class WorkflowUI:
    """UI components for guided workflow."""
    
    def __init__(self):
        """Initialize the workflow UI."""
        self.ui_colors = config.get_ui_colors()
        self.ui_fonts = config.get_ui_fonts()
        self.current_step = 0
        self.total_steps = 5
        self.workflow_state = {}
        self.expert_mode = False
        
    def set_expert_mode(self, expert_mode):
        """
        Set expert mode.
        
        Args:
            expert_mode: Whether to enable expert mode
            
        Returns:
            Updated visibility for components
        """
        self.expert_mode = expert_mode
        return gr.update(visible=expert_mode), gr.update(visible=not expert_mode)
    
    def next_step(self, current_step, workflow_state):
        """
        Move to the next step in the wizard.
        
        Args:
            current_step: Current step index
            workflow_state: Current workflow state
            
        Returns:
            Updated step index, progress percentage, and component visibility
        """
        # Save current state
        self.workflow_state.update(workflow_state)
        
        # Move to next step
        next_step = min(current_step + 1, self.total_steps - 1)
        progress = (next_step / (self.total_steps - 1)) * 100
        
        # Update visibility for all steps
        visibilities = []
        for i in range(self.total_steps):
            visibilities.append(gr.update(visible=(i == next_step)))
        
        return next_step, progress, *visibilities
    
    def prev_step(self, current_step):
        """
        Move to the previous step in the wizard.
        
        Args:
            current_step: Current step index
            
        Returns:
            Updated step index, progress percentage, and component visibility
        """
        # Move to previous step
        prev_step = max(current_step - 1, 0)
        progress = (prev_step / (self.total_steps - 1)) * 100
        
        # Update visibility for all steps
        visibilities = []
        for i in range(self.total_steps):
            visibilities.append(gr.update(visible=(i == prev_step)))
        
        return prev_step, progress, *visibilities
    
    def update_progress(self, progress_value):
        """
        Update progress indicator.
        
        Args:
            progress_value: Progress value (0-100)
            
        Returns:
            Updated progress value
        """
        return progress_value
    
    def simulate_task_progress(self, task_name, progress_bar):
        """
        Simulate task progress for demonstration.
        
        Args:
            task_name: Name of the task
            progress_bar: Progress bar component
            
        Returns:
            Task status message
        """
        for i in range(0, 101, 10):
            progress_bar.update(value=i)
            time.sleep(0.2)  # Simulate processing time
        
        return f"{task_name} completed successfully"
    
    def create_ui_block(self):
        """
        Create a Gradio UI block for guided workflow.
        
        Returns:
            Gradio UI block
        """
        with gr.Blocks(theme=self._create_custom_theme()) as workflow_block:
            # Header
            with gr.Row(equal_height=True):
                with gr.Column(scale=3):
                    gr.Markdown("# Guided Workflow")
                    gr.Markdown("Step-by-step process to fine-tune your LLM with credible documents")
                
                with gr.Column(scale=1, min_width=200):
                    expert_mode_checkbox = gr.Checkbox(
                        label="Expert Mode",
                        value=False,
                        info="Enable advanced options"
                    )
            
            # Mode containers
            with gr.Row() as wizard_container:
                with gr.Column():
                    # Progress tracking
                    current_step = gr.State(value=0)
                    progress_bar = gr.Slider(
                        minimum=0,
                        maximum=100,
                        value=0,
                        step=1,
                        label="Progress",
                        interactive=False
                    )
                    
                    # Step containers
                    with gr.Group() as step1_container:
                        gr.Markdown("## Step 1: Document Upload")
                        gr.Markdown("Upload the documents you want to use for fine-tuning")
                        
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
                                    fn=document_ui.upload_document,
                                    inputs=[file_input, metadata_input],
                                    outputs=upload_result
                                )
                        
                        with gr.Row():
                            with gr.Column():
                                document_list = gr.HTML(document_ui.list_documents())
                                refresh_button = gr.Button("Refresh Document List")
                                
                                refresh_button.click(
                                    fn=document_ui.list_documents,
                                    inputs=[],
                                    outputs=document_list
                                )
                        
                        with gr.Row():
                            prev_button1 = gr.Button("Previous", visible=False)
                            next_button1 = gr.Button("Next", variant="primary")
                    
                    with gr.Group(visible=False) as step2_container:
                        gr.Markdown("## Step 2: Metadata Configuration")
                        gr.Markdown("Configure metadata for your documents and training samples")
                        
                        with gr.Tabs():
                            with gr.TabItem("Document Metadata"):
                                doc_fields_html = gr.HTML(metadata_ui.get_document_metadata_fields_html())
                            
                            with gr.TabItem("Training Sample Metadata"):
                                sample_fields_html = gr.HTML(metadata_ui.get_sample_metadata_fields_html())
                        
                        with gr.Row():
                            prev_button2 = gr.Button("Previous")
                            next_button2 = gr.Button("Next", variant="primary")
                    
                    with gr.Group(visible=False) as step3_container:
                        gr.Markdown("## Step 3: Dataset Generation")
                        gr.Markdown("Create a dataset from your documents")
                        
                        with gr.Row():
                            with gr.Column():
                                # Get available documents
                                doc_choices = dataset_ui.list_available_documents()
                                
                                doc_dropdown = gr.Dropdown(
                                    choices=doc_choices,
                                    multiselect=True,
                                    label="Select Documents"
                                )
                                
                                dataset_name = gr.Textbox(
                                    label="Dataset Name (optional)",
                                    placeholder="Leave blank for auto-generated name"
                                )
                                
                                generate_button = gr.Button("Generate Dataset", variant="primary")
                                dataset_result = gr.Textbox(label="Result")
                                dataset_report = gr.HTML()
                                
                                generate_button.click(
                                    fn=dataset_ui.generate_dataset,
                                    inputs=[doc_dropdown, dataset_name],
                                    outputs=[dataset_result, dataset_report]
                                )
                        
                        with gr.Row():
                            prev_button3 = gr.Button("Previous")
                            next_button3 = gr.Button("Next", variant="primary")
                    
                    with gr.Group(visible=False) as step4_container:
                        gr.Markdown("## Step 4: Training Schema Selection")
                        gr.Markdown("Select the training schema that best fits your use case")
                        
                        with gr.Row():
                            with gr.Column():
                                schema_dropdown = gr.Dropdown(
                                    choices=schema_ui.list_schemas(),
                                    label="Select Schema"
                                )
                                
                                schema_info = gr.HTML()
                                
                                schema_dropdown.change(
                                    fn=schema_ui.get_schema_info,
                                    inputs=[schema_dropdown],
                                    outputs=schema_info
                                )
                        
                        with gr.Row():
                            prev_button4 = gr.Button("Previous")
                            next_button4 = gr.Button("Next", variant="primary")
                    
                    with gr.Group(visible=False) as step5_container:
                        gr.Markdown("## Step 5: Fine-Tuning")
                        gr.Markdown("Fine-tune your model with the generated dataset")
                        
                        with gr.Row():
                            with gr.Column():
                                # Fine-tuning form
                                model_name = gr.Textbox(
                                    label="Base Model Name",
                                    value="meta-llama/Llama-2-7b",
                                    info="Name of the base model to fine-tune"
                                )
                                
                                dataset_id = gr.Textbox(
                                    label="Dataset ID",
                                    info="ID of the dataset to use for fine-tuning"
                                )
                                
                                epochs = gr.Slider(
                                    minimum=1,
                                    maximum=10,
                                    value=3,
                                    step=1,
                                    label="Maximum Epochs",
                                    info="Maximum number of training epochs"
                                )
                                
                                learning_rate = gr.Slider(
                                    minimum=1e-6,
                                    maximum=1e-4,
                                    value=2e-5,
                                    step=1e-6,
                                    label="Learning Rate",
                                    info="Learning rate for training"
                                )
                                
                                fine_tune_button = gr.Button("Start Fine-Tuning", variant="primary")
                                fine_tune_progress = gr.Slider(
                                    minimum=0,
                                    maximum=100,
                                    value=0,
                                    step=1,
                                    label="Fine-Tuning Progress",
                                    interactive=False
                                )
                                fine_tune_status = gr.Textbox(label="Status")
                                
                                fine_tune_button.click(
                                    fn=lambda: self.simulate_task_progress("Fine-tuning", fine_tune_progress),
                                    inputs=[],
                                    outputs=fine_tune_status
                                )
                        
                        with gr.Row():
                            prev_button5 = gr.Button("Previous")
                            finish_button = gr.Button("Finish", variant="primary")
            
            # Advanced mode container
            with gr.Row(visible=False) as advanced_container:
                with gr.Column():
                    gr.Markdown("## Advanced Mode")
                    gr.Markdown("Access all features and options directly")
                    
                    with gr.Tabs():
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
            
            # Button actions
            next_button1.click(
                fn=self.next_step,
                inputs=[current_step, gr.State({})],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            prev_button2.click(
                fn=self.prev_step,
                inputs=[current_step],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            next_button2.click(
                fn=self.next_step,
                inputs=[current_step, gr.State({})],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            prev_button3.click(
                fn=self.prev_step,
                inputs=[current_step],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            next_button3.click(
                fn=self.next_step,
                inputs=[current_step, gr.State({})],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            prev_button4.click(
                fn=self.prev_step,
                inputs=[current_step],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            next_button4.click(
                fn=self.next_step,
                inputs=[current_step, gr.State({})],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            prev_button5.click(
                fn=self.prev_step,
                inputs=[current_step],
                outputs=[current_step, progress_bar, step1_container, step2_container, step3_container, step4_container, step5_container]
            )
            
            # Expert mode toggle
            expert_mode_checkbox.change(
                fn=self.set_expert_mode,
                inputs=[expert_mode_checkbox],
                outputs=[advanced_container, wizard_container]
            )
        
        return workflow_block
    
    def _create_custom_theme(self):
        """
        Create a custom Gradio theme with Aulendur LLC branding.
        Designed to be sleek and modern, similar to tech companies like Palantir or Anduril.
        
        Returns:
            Gradio theme
        """
        return gr.themes.Base(
            primary_hue=gr.themes.colors.slate,
            secondary_hue=gr.themes.colors.gray,
            neutral_hue=gr.themes.colors.gray,
            font=[self.ui_fonts.get("heading", "Oswald"), self.ui_fonts.get("body", "Nunito Sans"), "ui-sans-serif", "system-ui", "sans-serif"],
            font_mono=[self.ui_fonts.get("code", "Source Code Pro"), "ui-monospace", "monospace"],
        ).set(
            # Light mode
            body_background_fill=self.ui_colors.get("primary", "#FFFEFB"),
            body_text_color=self.ui_colors.get("dark", "#213C4E"),
            color_accent=self.ui_colors.get("accent", "#5C798B"),
            
            # Dark mode
            body_background_fill_dark=self.ui_colors.get("darker", "#182241"),
            body_text_color_dark=self.ui_colors.get("primary", "#FFFEFB"),
            
            # Buttons
            button_primary_background_fill=self.ui_colors.get("accent", "#5C798B"),
            button_primary_background_fill_hover=self.ui_colors.get("dark", "#213C4E"),
            button_primary_text_color=self.ui_colors.get("primary", "#FFFEFB"),
            button_secondary_background_fill=self.ui_colors.get("secondary", "#7B949C"),
            button_secondary_background_fill_hover=self.ui_colors.get("accent", "#5C798B"),
            button_secondary_text_color=self.ui_colors.get("primary", "#FFFEFB"),
            
            # Components
            background_fill_primary=self.ui_colors.get("primary", "#FFFEFB"),
            background_fill_secondary="#F8F9FA",
            border_color_primary=self.ui_colors.get("secondary", "#7B949C"),
            border_color_accent=self.ui_colors.get("accent", "#5C798B"),
            
            # Shadows for depth
            shadow_spread="1px",
            shadow_inset="0px 0px 2px 0px rgba(0, 0, 0, 0.1) inset",
        )


# Create singleton instance
workflow_ui = WorkflowUI()

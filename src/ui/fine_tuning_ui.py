"""
UI components for fine-tuning in LLM LoreSmith.
Provides a user interface for model fine-tuning and management.
"""

import os
import json
from typing import Dict, List, Optional, Any
import gradio as gr

from ..fine_tuning.fine_tuning_manager import fine_tuning_manager
from ..dataset_generation.dataset_pipeline import dataset_structurer
from ..config.config_manager import config


class FineTuningUI:
    """UI components for fine-tuning."""
    
    def __init__(self):
        """Initialize the fine-tuning UI."""
        self.ui_colors = config.get_ui_colors()
        self.ui_fonts = config.get_ui_fonts()
    
    def list_available_datasets(self):
        """
        List all available datasets for fine-tuning.
        
        Returns:
            List of dataset IDs and metadata
        """
        dataset_ids = dataset_structurer.list_datasets()
        result = []
        
        for dataset_id in dataset_ids:
            metadata = dataset_structurer.get_dataset_metadata(dataset_id) or {}
            sample_count = metadata.get("sample_count", 0)
            is_sufficient = metadata.get("is_sufficient", False)
            
            # Only include sufficient datasets
            if is_sufficient:
                result.append((dataset_id, f"{dataset_id} ({sample_count} samples)"))
        
        return result
    
    def start_fine_tuning(self, dataset_id, model_name, lora_r, lora_alpha, learning_rate, batch_size, num_epochs):
        """
        Start fine-tuning a model.
        
        Args:
            dataset_id: Dataset ID
            model_name: Base model name
            lora_r: LoRA rank
            lora_alpha: LoRA alpha
            learning_rate: Learning rate
            batch_size: Batch size
            num_epochs: Number of epochs
            
        Returns:
            Result message
        """
        if not dataset_id:
            return "No dataset selected", ""
        
        # Create training configuration
        training_config = {
            "lora_r": int(lora_r),
            "lora_alpha": int(lora_alpha),
            "learning_rate": float(learning_rate),
            "batch_size": int(batch_size),
            "num_epochs": int(num_epochs)
        }
        
        # Start fine-tuning
        result = fine_tuning_manager.fine_tune(dataset_id, model_name, training_config)
        
        if not result["success"]:
            return f"Error: {result['message']}", ""
        
        # Create HTML report
        html = self._create_fine_tuning_report(result)
        
        return f"Fine-tuning started successfully. Model ID: {result['model_id']}", html
    
    def list_models(self):
        """
        List all fine-tuned models.
        
        Returns:
            HTML table of models
        """
        models = fine_tuning_manager.list_models()
        if not models:
            return "No models found"
        
        html = "<table style='width:100%; border-collapse: collapse;'>"
        html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Model ID</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Base Model</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Dataset</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Created</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Perplexity</th>"
        html += "</tr>"
        
        for model in models:
            model_id = model.get("model_id", "Unknown")
            base_model = model.get("base_model", "Unknown")
            dataset_id = model.get("dataset_id", "Unknown")
            created_at = model.get("created_at", "Unknown")
            
            # Get perplexity if available
            perplexity = "Not evaluated"
            if "evaluation" in model and "perplexity" in model["evaluation"]:
                perplexity = f"{model['evaluation']['perplexity']:.2f}"
            
            html += "<tr style='background-color: #FFFEFB;'>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{model_id}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{os.path.basename(base_model)}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{dataset_id}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{created_at}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{perplexity}</td>"
            html += "</tr>"
        
        html += "</table>"
        return html
    
    def evaluate_model(self, model_id, dataset_id):
        """
        Evaluate a fine-tuned model.
        
        Args:
            model_id: Model ID
            dataset_id: Dataset ID for evaluation
            
        Returns:
            Result message
        """
        if not model_id:
            return "No model selected"
        
        # Start evaluation
        result = fine_tuning_manager.evaluate_model(model_id, dataset_id if dataset_id else None)
        
        if not result["success"]:
            return f"Error: {result['message']}"
        
        # Format metrics
        metrics = result.get("metrics", {})
        perplexity = metrics.get("perplexity", "N/A")
        
        return f"Model evaluated successfully. Perplexity: {perplexity:.2f}"
    
    def delete_model(self, model_id):
        """
        Delete a fine-tuned model.
        
        Args:
            model_id: Model ID
            
        Returns:
            Result message
        """
        if not model_id:
            return "No model ID provided"
        
        success = fine_tuning_manager.delete_model(model_id)
        if not success:
            return f"Error: Model with ID {model_id} not found"
        
        return f"Model {model_id} deleted successfully"
    
    def _create_fine_tuning_report(self, result):
        """
        Create an HTML report for a fine-tuning result.
        
        Args:
            result: Fine-tuning result
            
        Returns:
            HTML report
        """
        model_id = result.get("model_id")
        metadata = result.get("metadata", {})
        
        html = f"<h3>Fine-Tuning Report: {model_id}</h3>"
        
        # Metadata section
        html += "<div style='margin-bottom: 20px;'>"
        html += "<h4>Metadata</h4>"
        html += "<table style='width:100%; border-collapse: collapse;'>"
        html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Property</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Value</th>"
        html += "</tr>"
        
        for key, value in metadata.items():
            if key != "training_config":  # Skip training config for now
                html += "<tr style='background-color: #FFFEFB;'>"
                html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{key}</td>"
                html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{value}</td>"
                html += "</tr>"
        
        html += "</table>"
        html += "</div>"
        
        # Training configuration section
        if "training_config" in metadata:
            html += "<div style='margin-bottom: 20px;'>"
            html += "<h4>Training Configuration</h4>"
            html += "<table style='width:100%; border-collapse: collapse;'>"
            html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
            html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Parameter</th>"
            html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Value</th>"
            html += "</tr>"
            
            for key, value in metadata["training_config"].items():
                html += "<tr style='background-color: #FFFEFB;'>"
                html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{key}</td>"
                html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{value}</td>"
                html += "</tr>"
            
            html += "</table>"
            html += "</div>"
        
        return html
    
    def create_ui_block(self):
        """
        Create a Gradio UI block for fine-tuning.
        
        Returns:
            Gradio UI block
        """
        with gr.Blocks(theme=self._create_custom_theme()) as fine_tuning_block:
            gr.Markdown("# Model Fine-Tuning")
            gr.Markdown("Fine-tune and manage language models")
            
            with gr.Tabs():
                with gr.TabItem("Start Fine-Tuning"):
                    with gr.Row():
                        with gr.Column():
                            # Get available datasets
                            dataset_choices = self.list_available_datasets()
                            
                            dataset_dropdown = gr.Dropdown(
                                choices=dataset_choices,
                                label="Select Dataset"
                            )
                            
                            model_name = gr.Textbox(
                                label="Base Model",
                                value=fine_tuning_manager.default_model,
                                placeholder="e.g., meta-llama/Llama-2-7b-hf"
                            )
                            
                            with gr.Accordion("Advanced Options", open=False):
                                lora_r = gr.Slider(
                                    minimum=1,
                                    maximum=64,
                                    value=fine_tuning_manager.default_lora_r,
                                    step=1,
                                    label="LoRA Rank (r)"
                                )
                                
                                lora_alpha = gr.Slider(
                                    minimum=1,
                                    maximum=64,
                                    value=fine_tuning_manager.default_lora_alpha,
                                    step=1,
                                    label="LoRA Alpha"
                                )
                                
                                learning_rate = gr.Slider(
                                    minimum=1e-6,
                                    maximum=1e-4,
                                    value=fine_tuning_manager.default_learning_rate,
                                    step=1e-6,
                                    label="Learning Rate"
                                )
                                
                                batch_size = gr.Slider(
                                    minimum=1,
                                    maximum=16,
                                    value=fine_tuning_manager.default_batch_size,
                                    step=1,
                                    label="Batch Size"
                                )
                                
                                num_epochs = gr.Slider(
                                    minimum=1,
                                    maximum=fine_tuning_manager.default_max_epochs,
                                    value=3,
                                    step=1,
                                    label="Number of Epochs"
                                )
                            
                            fine_tune_button = gr.Button("Start Fine-Tuning", variant="primary")
                            result_text = gr.Textbox(label="Result")
                            report_html = gr.HTML()
                            
                            fine_tune_button.click(
                                fn=self.start_fine_tuning,
                                inputs=[
                                    dataset_dropdown,
                                    model_name,
                                    lora_r,
                                    lora_alpha,
                                    learning_rate,
                                    batch_size,
                                    num_epochs
                                ],
                                outputs=[result_text, report_html]
                            )
                
                with gr.TabItem("Manage Models"):
                    with gr.Row():
                        with gr.Column():
                            refresh_button = gr.Button("Refresh Model List")
                            model_list = gr.HTML(self.list_models())
                            
                            refresh_button.click(
                                fn=self.list_models,
                                inputs=[],
                                outputs=model_list
                            )
                    
                    with gr.Row():
                        with gr.Column():
                            model_id_input = gr.Textbox(label="Model ID")
                            delete_button = gr.Button("Delete Model", variant="stop")
                            delete_result = gr.Textbox(label="Result")
                            
                            delete_button.click(
                                fn=self.delete_model,
                                inputs=[model_id_input],
                                outputs=delete_result
                            )
                
                with gr.TabItem("Evaluate Model"):
                    with gr.Row():
                        with gr.Column():
                            eval_model_id = gr.Textbox(label="Model ID")
                            
                            # Get available datasets
                            eval_dataset_choices = self.list_available_datasets()
                            eval_dataset_choices.insert(0, ("", "Use original training dataset"))
                            
                            eval_dataset_dropdown = gr.Dropdown(
                                choices=eval_dataset_choices,
                                label="Evaluation Dataset (optional)"
                            )
                            
                            evaluate_button = gr.Button("Evaluate Model")
                            evaluate_result = gr.Textbox(label="Result")
                            
                            evaluate_button.click(
                                fn=self.evaluate_model,
                                inputs=[eval_model_id, eval_dataset_dropdown],
                                outputs=evaluate_result
                            )
        
        return fine_tuning_block
    
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
fine_tuning_ui = FineTuningUI()

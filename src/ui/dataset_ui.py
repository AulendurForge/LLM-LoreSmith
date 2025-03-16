"""
UI components for dataset generation in LLM LoreSmith.
Provides a user interface for creating and managing datasets.
"""

import os
import json
from typing import Dict, List, Optional, Any
import gradio as gr

from ..dataset_generation.dataset_pipeline import dataset_pipeline, dataset_structurer
from ..ingestion.document_manager import document_storage
from ..config.config_manager import config


class DatasetGenerationUI:
    """UI components for dataset generation."""
    
    def __init__(self):
        """Initialize the dataset generation UI."""
        self.ui_colors = config.get_ui_colors()
        self.ui_fonts = config.get_ui_fonts()
    
    def list_available_documents(self):
        """
        List all available documents for dataset generation.
        
        Returns:
            List of document IDs and names
        """
        doc_ids = document_storage.list_documents()
        result = []
        
        for doc_id in doc_ids:
            metadata = document_storage.get_document_metadata(doc_id) or {}
            filename = metadata.get("filename", "Unknown")
            result.append((doc_id, f"{filename} ({doc_id})"))
        
        return result
    
    def generate_dataset(self, doc_ids, dataset_name):
        """
        Generate a dataset from selected documents.
        
        Args:
            doc_ids: List of selected document IDs
            dataset_name: Optional dataset name
            
        Returns:
            Result message and HTML report
        """
        if not doc_ids:
            return "No documents selected", ""
        
        # Generate dataset
        result = dataset_pipeline.generate_dataset(doc_ids, dataset_name if dataset_name else None)
        
        if not result["success"]:
            return f"Error: {result['message']}", ""
        
        # Create HTML report
        html = self._create_dataset_report(result)
        
        return f"Dataset generated successfully. ID: {result['dataset_id']}", html
    
    def list_datasets(self):
        """
        List all generated datasets.
        
        Returns:
            HTML table of datasets
        """
        dataset_ids = dataset_structurer.list_datasets()
        if not dataset_ids:
            return "No datasets found"
        
        html = "<table style='width:100%; border-collapse: collapse;'>"
        html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Dataset ID</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Sample Count</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Sufficiency Score</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Status</th>"
        html += "</tr>"
        
        for dataset_id in dataset_ids:
            metadata = dataset_structurer.get_dataset_metadata(dataset_id) or {}
            sample_count = metadata.get("sample_count", 0)
            sufficiency_score = metadata.get("sufficiency_score", 0)
            is_sufficient = metadata.get("is_sufficient", False)
            
            status_color = "#4CAF50" if is_sufficient else "#F44336"
            status_text = "Sufficient" if is_sufficient else "Insufficient"
            
            html += "<tr style='background-color: #FFFEFB;'>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{dataset_id}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{sample_count}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{sufficiency_score:.1f}/100</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C; color: {status_color};'>{status_text}</td>"
            html += "</tr>"
        
        html += "</table>"
        return html
    
    def view_dataset_samples(self, dataset_id, num_samples):
        """
        View samples from a dataset.
        
        Args:
            dataset_id: Dataset ID
            num_samples: Number of samples to view
            
        Returns:
            HTML display of samples
        """
        if not dataset_id:
            return "No dataset selected"
        
        samples = dataset_structurer.get_dataset(dataset_id)
        if not samples:
            return f"Dataset {dataset_id} not found"
        
        # Limit number of samples
        samples = samples[:int(num_samples)]
        
        html = f"<h3>Samples from Dataset: {dataset_id}</h3>"
        
        for i, sample in enumerate(samples):
            input_text = sample.get("input", "")
            output_text = sample.get("output", "")
            
            html += f"<div style='margin-bottom: 20px; padding: 10px; border: 1px solid #7B949C; border-radius: 5px;'>"
            html += f"<h4>Sample {i+1}</h4>"
            html += f"<div style='margin-bottom: 10px;'>"
            html += f"<strong>Input:</strong>"
            html += f"<pre style='background-color: #F5F5F5; padding: 10px; border-radius: 5px; white-space: pre-wrap;'>{input_text}</pre>"
            html += f"</div>"
            html += f"<div>"
            html += f"<strong>Output:</strong>"
            html += f"<pre style='background-color: #F5F5F5; padding: 10px; border-radius: 5px; white-space: pre-wrap;'>{output_text}</pre>"
            html += f"</div>"
            html += f"</div>"
        
        return html
    
    def delete_dataset(self, dataset_id):
        """
        Delete a dataset.
        
        Args:
            dataset_id: Dataset ID
            
        Returns:
            Result message
        """
        if not dataset_id:
            return "No dataset ID provided"
        
        success = dataset_structurer.delete_dataset(dataset_id)
        if not success:
            return f"Error: Dataset with ID {dataset_id} not found"
        
        return f"Dataset {dataset_id} deleted successfully"
    
    def _create_dataset_report(self, result):
        """
        Create an HTML report for a dataset generation result.
        
        Args:
            result: Dataset generation result
            
        Returns:
            HTML report
        """
        dataset_id = result.get("dataset_id")
        metadata = result.get("metadata", {})
        analysis = result.get("analysis", {})
        suggestions = result.get("suggestions", [])
        
        html = f"<h3>Dataset Report: {dataset_id}</h3>"
        
        # Metadata section
        html += "<div style='margin-bottom: 20px;'>"
        html += "<h4>Metadata</h4>"
        html += "<table style='width:100%; border-collapse: collapse;'>"
        html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Property</th>"
        html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Value</th>"
        html += "</tr>"
        
        for key, value in metadata.items():
            html += "<tr style='background-color: #FFFEFB;'>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{key}</td>"
            html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{value}</td>"
            html += "</tr>"
        
        html += "</table>"
        html += "</div>"
        
        # Analysis section
        if analysis:
            stats = analysis.get("stats", {})
            is_sufficient = analysis.get("is_sufficient", False)
            message = analysis.get("message", "")
            
            status_color = "#4CAF50" if is_sufficient else "#F44336"
            
            html += "<div style='margin-bottom: 20px;'>"
            html += "<h4>Analysis</h4>"
            html += f"<p><strong>Status:</strong> <span style='color: {status_color};'>{message}</span></p>"
            
            html += "<table style='width:100%; border-collapse: collapse;'>"
            html += "<tr style='background-color: #213C4E; color: #FFFEFB;'>"
            html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Metric</th>"
            html += "<th style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>Value</th>"
            html += "</tr>"
            
            for key, value in stats.items():
                html += "<tr style='background-color: #FFFEFB;'>"
                html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{key}</td>"
                html += f"<td style='padding: 8px; text-align: left; border: 1px solid #7B949C;'>{value}</td>"
                html += "</tr>"
            
            html += "</table>"
            html += "</div>"
        
        # Suggestions section
        if suggestions:
            html += "<div style='margin-bottom: 20px;'>"
            html += "<h4>Improvement Suggestions</h4>"
            html += "<ul>"
            
            for suggestion in suggestions:
                html += f"<li>{suggestion}</li>"
            
            html += "</ul>"
            html += "</div>"
        
        return html
    
    def create_ui_block(self):
        """
        Create a Gradio UI block for dataset generation.
        
        Returns:
            Gradio UI block
        """
        with gr.Blocks(theme=self._create_custom_theme()) as dataset_block:
            gr.Markdown("# Dataset Generation")
            gr.Markdown("Create and manage datasets for fine-tuning")
            
            with gr.Tabs():
                with gr.TabItem("Generate Dataset"):
                    with gr.Row():
                        with gr.Column():
                            # Get available documents
                            doc_choices = self.list_available_documents()
                            
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
                            result_text = gr.Textbox(label="Result")
                            report_html = gr.HTML()
                            
                            generate_button.click(
                                fn=self.generate_dataset,
                                inputs=[doc_dropdown, dataset_name],
                                outputs=[result_text, report_html]
                            )
                
                with gr.TabItem("Manage Datasets"):
                    with gr.Row():
                        with gr.Column():
                            refresh_button = gr.Button("Refresh Dataset List")
                            dataset_list = gr.HTML(self.list_datasets())
                            
                            refresh_button.click(
                                fn=self.list_datasets,
                                inputs=[],
                                outputs=dataset_list
                            )
                    
                    with gr.Row():
                        with gr.Column():
                            dataset_id_input = gr.Textbox(label="Dataset ID")
                            delete_button = gr.Button("Delete Dataset", variant="stop")
                            delete_result = gr.Textbox(label="Result")
                            
                            delete_button.click(
                                fn=self.delete_dataset,
                                inputs=[dataset_id_input],
                                outputs=delete_result
                            )
                
                with gr.TabItem("View Samples"):
                    with gr.Row():
                        with gr.Column():
                            view_dataset_id = gr.Textbox(label="Dataset ID")
                            num_samples = gr.Slider(
                                minimum=1,
                                maximum=50,
                                value=10,
                                step=1,
                                label="Number of Samples to View"
                            )
                            view_button = gr.Button("View Samples")
                            samples_html = gr.HTML()
                            
                            view_button.click(
                                fn=self.view_dataset_samples,
                                inputs=[view_dataset_id, num_samples],
                                outputs=samples_html
                            )
        
        return dataset_block
    
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
dataset_ui = DatasetGenerationUI()

"""
Fine-tuning module for LLM LoreSmith.
Handles model fine-tuning with vLLM integration, dynamic training adjustment, and evaluation.
"""

import os
import json
import time
import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, Union
from pathlib import Path
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling,
    EarlyStoppingCallback
)
from datasets import Dataset
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType
)
from tqdm import tqdm

from ..config.config_manager import config
from ..dataset_generation.dataset_pipeline import dataset_structurer


class FineTuningManager:
    """Manages the fine-tuning process with vLLM integration."""
    
    def __init__(self):
        """Initialize the fine-tuning manager."""
        self.base_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data",
            "models"
        )
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Default settings
        self.default_model = "meta-llama/Llama-2-7b-hf"
        self.default_lora_r = 8
        self.default_lora_alpha = 16
        self.default_lora_dropout = 0.05
        self.default_learning_rate = 2e-5
        self.default_batch_size = 4
        self.default_max_steps = 1000
        self.default_eval_steps = 100
        self.default_save_steps = 200
        self.default_warmup_steps = 100
        self.default_max_epochs = config.get('model.max_epochs', 10)
        self.default_eval_interval = config.get('model.evaluation_interval', 1)
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger("fine_tuning")
    
    def prepare_dataset_for_training(self, dataset_id: str) -> Tuple[bool, str, Optional[Dataset]]:
        """
        Prepare a dataset for fine-tuning.
        
        Args:
            dataset_id: Dataset ID
            
        Returns:
            Tuple of (success, message, dataset)
        """
        # Get dataset
        samples = dataset_structurer.get_dataset(dataset_id)
        if not samples:
            return False, f"Dataset with ID {dataset_id} not found", None
        
        # Check if dataset is sufficient
        metadata = dataset_structurer.get_dataset_metadata(dataset_id)
        if metadata and not metadata.get("is_sufficient", False):
            return False, "Dataset is not sufficient for fine-tuning", None
        
        try:
            # Convert to HuggingFace dataset format
            formatted_samples = []
            for sample in samples:
                input_text = sample.get("input", "")
                output_text = sample.get("output", "")
                
                # Format as instruction-following format
                formatted_text = f"### Instruction:\n{input_text}\n\n### Response:\n{output_text}"
                formatted_samples.append({"text": formatted_text})
            
            # Create dataset
            hf_dataset = Dataset.from_list(formatted_samples)
            
            return True, f"Dataset prepared with {len(formatted_samples)} samples", hf_dataset
        except Exception as e:
            self.logger.error(f"Error preparing dataset: {str(e)}")
            return False, f"Error preparing dataset: {str(e)}", None
    
    def fine_tune(
        self,
        dataset_id: str,
        model_name: Optional[str] = None,
        training_config: Optional[Dict[str, Any]] = None,
        output_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fine-tune a model on a dataset.
        
        Args:
            dataset_id: Dataset ID
            model_name: Base model name (default: meta-llama/Llama-2-7b-hf)
            training_config: Optional training configuration
            output_dir: Optional output directory
            
        Returns:
            Fine-tuning result
        """
        # Prepare dataset
        success, message, dataset = self.prepare_dataset_for_training(dataset_id)
        if not success or dataset is None:
            return {
                "success": False,
                "message": message,
                "model_id": None
            }
        
        # Set up model name and output directory
        model_name = model_name or self.default_model
        model_id = f"ft_{int(time.time())}_{os.path.basename(model_name)}"
        output_dir = output_dir or os.path.join(self.base_dir, model_id)
        os.makedirs(output_dir, exist_ok=True)
        
        # Set up training configuration
        config_dict = training_config or {}
        
        # Create adaptive training configuration
        training_config = self._create_adaptive_training_config(
            dataset=dataset,
            output_dir=output_dir,
            config_dict=config_dict
        )
        
        try:
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            tokenizer.pad_token = tokenizer.eos_token
            
            # Tokenize dataset
            def tokenize_function(examples):
                return tokenizer(
                    examples["text"],
                    truncation=True,
                    max_length=training_config.get("max_length", 512),
                    padding="max_length"
                )
            
            tokenized_dataset = dataset.map(tokenize_function, batched=True)
            
            # Split dataset
            split_dataset = tokenized_dataset.train_test_split(
                test_size=0.1,
                seed=42
            )
            
            # Load model
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            # Set up LoRA configuration
            peft_config = LoraConfig(
                task_type=TaskType.CAUSAL_LM,
                r=training_config.get("lora_r", self.default_lora_r),
                lora_alpha=training_config.get("lora_alpha", self.default_lora_alpha),
                lora_dropout=training_config.get("lora_dropout", self.default_lora_dropout),
                target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
                bias="none",
                inference_mode=False
            )
            
            # Prepare model for training
            model = prepare_model_for_kbit_training(model)
            model = get_peft_model(model, peft_config)
            
            # Set up training arguments
            training_args = TrainingArguments(
                output_dir=output_dir,
                learning_rate=training_config.get("learning_rate", self.default_learning_rate),
                per_device_train_batch_size=training_config.get("batch_size", self.default_batch_size),
                per_device_eval_batch_size=training_config.get("batch_size", self.default_batch_size),
                num_train_epochs=training_config.get("num_epochs", 3),
                weight_decay=0.01,
                evaluation_strategy="steps",
                eval_steps=training_config.get("eval_steps", self.default_eval_steps),
                save_strategy="steps",
                save_steps=training_config.get("save_steps", self.default_save_steps),
                warmup_steps=training_config.get("warmup_steps", self.default_warmup_steps),
                load_best_model_at_end=True,
                logging_steps=10,
                report_to="none",
                save_total_limit=3,
                fp16=True,
                gradient_accumulation_steps=training_config.get("gradient_accumulation_steps", 1),
                max_steps=training_config.get("max_steps", self.default_max_steps) if training_config.get("use_max_steps", False) else -1
            )
            
            # Set up data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=tokenizer,
                mlm=False
            )
            
            # Set up early stopping
            early_stopping_callback = EarlyStoppingCallback(
                early_stopping_patience=3,
                early_stopping_threshold=0.01
            )
            
            # Set up trainer
            trainer = Trainer(
                model=model,
                args=training_args,
                train_dataset=split_dataset["train"],
                eval_dataset=split_dataset["test"],
                data_collator=data_collator,
                callbacks=[early_stopping_callback, AdaptiveTrainingCallback(self, training_config)]
            )
            
            # Start training
            self.logger.info(f"Starting fine-tuning with {len(split_dataset['train'])} training samples")
            trainer.train()
            
            # Save model
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)
            
            # Save training configuration
            with open(os.path.join(output_dir, "training_config.json"), "w") as f:
                json.dump(training_config, f, indent=2)
            
            # Save metadata
            metadata = {
                "model_id": model_id,
                "base_model": model_name,
                "dataset_id": dataset_id,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sample_count": len(dataset),
                "training_config": training_config
            }
            
            with open(os.path.join(output_dir, "metadata.json"), "w") as f:
                json.dump(metadata, f, indent=2)
            
            return {
                "success": True,
                "message": "Model fine-tuned successfully",
                "model_id": model_id,
                "output_dir": output_dir,
                "metadata": metadata
            }
        
        except Exception as e:
            self.logger.error(f"Error during fine-tuning: {str(e)}")
            return {
                "success": False,
                "message": f"Error during fine-tuning: {str(e)}",
                "model_id": None
            }
    
    def evaluate_model(self, model_id: str, dataset_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluate a fine-tuned model.
        
        Args:
            model_id: Model ID
            dataset_id: Optional dataset ID for evaluation (if different from training dataset)
            
        Returns:
            Evaluation results
        """
        model_dir = os.path.join(self.base_dir, model_id)
        if not os.path.isdir(model_dir):
            return {
                "success": False,
                "message": f"Model with ID {model_id} not found",
                "metrics": None
            }
        
        # Load metadata
        metadata_path = os.path.join(model_dir, "metadata.json")
        if not os.path.isfile(metadata_path):
            return {
                "success": False,
                "message": f"Metadata for model {model_id} not found",
                "metrics": None
            }
        
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Use training dataset if no evaluation dataset is specified
        dataset_id = dataset_id or metadata.get("dataset_id")
        if not dataset_id:
            return {
                "success": False,
                "message": "No dataset specified for evaluation",
                "metrics": None
            }
        
        # Prepare dataset
        success, message, dataset = self.prepare_dataset_for_training(dataset_id)
        if not success or dataset is None:
            return {
                "success": False,
                "message": message,
                "metrics": None
            }
        
        try:
            # Load model and tokenizer
            model = AutoModelForCausalLM.from_pretrained(
                model_dir,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            tokenizer = AutoTokenizer.from_pretrained(model_dir)
            tokenizer.pad_token = tokenizer.eos_token
            
            # Tokenize dataset
            def tokenize_function(examples):
                return tokenizer(
                    examples["text"],
                    truncation=True,
                    max_length=512,
                    padding="max_length"
                )
            
            tokenized_dataset = dataset.map(tokenize_function, batched=True)
            
            # Split dataset
            split_dataset = tokenized_dataset.train_test_split(
                test_size=0.1,
                seed=42
            )
            
            # Set up training arguments for evaluation
            training_args = TrainingArguments(
                output_dir=os.path.join(model_dir, "eval"),
                per_device_eval_batch_size=4,
                report_to="none"
            )
            
            # Set up data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=tokenizer,
                mlm=False
            )
            
            # Set up trainer
            trainer = Trainer(
                model=model,
                args=training_args,
                eval_dataset=split_dataset["test"],
                data_collator=data_collator
            )
            
            # Evaluate
            self.logger.info(f"Evaluating model {model_id} on dataset {dataset_id}")
            eval_results = trainer.evaluate()
            
            # Calculate perplexity
            perplexity = np.exp(eval_results["eval_loss"])
            
            # Save evaluation results
            eval_results["perplexity"] = perplexity
            
            with open(os.path.join(model_dir, "evaluation_results.json"), "w") as f:
                json.dump(eval_results, f, indent=2)
            
            return {
                "success": True,
                "message": "Model evaluated successfully",
                "metrics": eval_results
            }
        
        except Exception as e:
            self.logger.error(f"Error during evaluation: {str(e)}")
            return {
                "success": False,
                "message": f"Error during evaluation: {str(e)}",
                "metrics": None
            }
    
    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all fine-tuned models.
        
        Returns:
            List of model metadata
        """
        if not os.path.isdir(self.base_dir):
            return []
        
        models = []
        
        for model_id in os.listdir(self.base_dir):
            model_dir = os.path.join(self.base_dir, model_id)
            if not os.path.isdir(model_dir):
                continue
            
            metadata_path = os.path.join(model_dir, "metadata.json")
            if not os.path.isfile(metadata_path):
                continue
            
            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
                
                # Load evaluation results if available
                eval_path = os.path.join(model_dir, "evaluation_results.json")
                if os.path.isfile(eval_path):
                    with open(eval_path, "r") as f:
                        eval_results = json.load(f)
                    metadata["evaluation"] = eval_results
                
                models.append(metadata)
            except Exception as e:
                self.logger.error(f"Error loading metadata for model {model_id}: {str(e)}")
        
        return models
    
    def delete_model(self, model_id: str) -> bool:
        """
        Delete a fine-tuned model.
        
        Args:
            model_id: Model ID
            
        Returns:
            True if model was deleted, False otherwise
        """
        import shutil
        model_dir = os.path.join(self.base_dir, model_id)
        if not os.path.isdir(model_dir):
            return False
        
        shutil.rmtree(model_dir)
        return True
    
    def _create_adaptive_training_config(
        self,
        dataset: Dataset,
        output_dir: str,
        config_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create an adaptive training configuration based on dataset size.
        
        Args:
            dataset: Training dataset
            output_dir: Output directory
            config_dict: User-provided configuration
            
        Returns:
            Adaptive training configuration
        """
        # Start with default configuration
        adaptive_config = {
            "lora_r": self.default_lora_r,
            "lora_alpha": self.default_lora_alpha,
            "lora_dropout": self.default_lora_dropout,
            "learning_rate": self.default_learning_rate,
            "batch_size": self.default_batch_size,
            "max_length": 512,
            "num_epochs": 3,
            "eval_steps": self.default_eval_steps,
            "save_steps": self.default_save_steps,
            "warmup_steps": self.default_warmup_steps,
            "gradient_accumulation_steps": 1,
            "use_max_steps": False,
            "max_steps": self.default_max_steps,
            "adaptive_epochs": True,
            "min_epochs": 1,
            "max_epochs": self.default_max_epochs,
            "eval_interval": self.default_eval_interval,
            "early_stopping_threshold": 0.01,
            "early_stopping_patience": 3
        }
        
        # Adjust based on dataset size
        dataset_size = len(dataset)
        
        if dataset_size < 50:
            # Small dataset: more epochs, higher learning rate
            adaptive_config.update({
                "num_epochs": 5,
                "learning_rate": 3e-5,
                "warmup_steps": 50,
                "eval_steps": 50,
                "save_steps": 100
            })
        elif dataset_size < 200:
            # Medium dataset: moderate settings
            adaptive_config.update({
                "num_epochs": 4,
                "learning_rate": 2.5e-5,
                "warmup_steps": 75,
                "eval_steps": 75,
                "save_steps": 150
            })
        else:
            # Large dataset: fewer epochs, lower learning rate
            adaptive_config.update({
                "num_epochs": 3,
                "learning_rate": 2e-5,
                "warmup_steps": 100,
                "eval_steps": 100,
                "save_steps": 200
            })
        
        # Override with user-provided configuration
        adaptive_config.update(config_dict)
        
        return adaptive_config


class AdaptiveTrainingCallback:
    """Callback for adaptive training with dynamic epoch adjustment."""
    
    def __init__(self, manager: FineTuningManager, config: Dict[str, Any]):
        """
        Initialize the adaptive training callback.
        
        Args:
            manager: Fine-tuning manager
            config: Training configuration
        """
        self.manager = manager
        self.config = config
        self.best_eval_loss = float('inf')
        self.no_improvement_count = 0
        self.logger = logging.getLogger("adaptive_training")
    
    def on_evaluate(self, args, state, control, metrics=None, **kwargs):
        """
        Called after evaluation.
        
        Args:
            args: Training arguments
            state: Training state
            control: Training control
            metrics: Evaluation metrics
        """
        if not self.config.get("adaptive_epochs", True):
            return
        
        if metrics is None or "eval_loss" not in metrics:
            return
        
        current_loss = metrics["eval_loss"]
        improvement_threshold = self.config.get("early_stopping_threshold", 0.01)
        
        # Check if there's significant improvement
        if self.best_eval_loss - current_loss > improvement_threshold:
            self.best_eval_loss = current_loss
            self.no_improvement_count = 0
            self.logger.info(f"Evaluation loss improved to {current_loss:.4f}")
        else:
            self.no_improvement_count += 1
            self.logger.info(f"No significant improvement for {self.no_improvement_count} evaluations")
        
        # Check if we should stop early
        patience = self.config.get("early_stopping_patience", 3)
        if self.no_improvement_count >= patience:
            self.logger.info(f"No improvement for {patience} evaluations, stopping training")
            control.should_training_stop = True
    
    def on_epoch_end(self, args, state, control, **kwargs):
        """
        Called at the end of an epoch.
        
        Args:
            args: Training arguments
            state: Training state
            control: Training control
        """
        if not self.config.get("adaptive_epochs", True):
            return
        
        current_epoch = state.epoch
        min_epochs = self.config.get("min_epochs", 1)
        max_epochs = self.config.get("max_epochs", 10)
        
        # Ensure we do at least min_epochs
        if current_epoch < min_epochs:
            return
        
        # Ensure we don't exceed max_epochs
        if current_epoch >= max_epochs:
            self.logger.info(f"Reached maximum epochs ({max_epochs}), stopping training")
            control.should_training_stop = True


# Create singleton instance
fine_tuning_manager = FineTuningManager()

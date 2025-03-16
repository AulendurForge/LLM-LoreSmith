"""
Training schema manager for LLM LoreSmith.
Provides support for multiple training data formats.
"""

import os
import json
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import re

from ..config.config_manager import config


class TrainingSchema:
    """Base class for training schemas."""
    
    def __init__(self, name: str, description: str):
        """
        Initialize a training schema.
        
        Args:
            name: Schema name
            description: Schema description
        """
        self.name = name
        self.description = description
        self.template = {}
        self.use_cases = []
        self.examples = []
    
    def format_sample(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a training sample according to the schema.
        
        Args:
            input_text: Input text
            output_text: Output text
            metadata: Optional metadata
            
        Returns:
            Formatted training sample
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    def get_template(self) -> Dict[str, Any]:
        """
        Get the schema template.
        
        Returns:
            Schema template
        """
        return self.template
    
    def get_use_cases(self) -> List[str]:
        """
        Get schema use cases.
        
        Returns:
            List of use cases
        """
        return self.use_cases
    
    def get_examples(self) -> List[Dict[str, str]]:
        """
        Get schema examples.
        
        Returns:
            List of examples
        """
        return self.examples


class InstructionResponseSchema(TrainingSchema):
    """Schema for instruction-response format."""
    
    def __init__(self):
        """Initialize the instruction-response schema."""
        super().__init__(
            name="instruction-response",
            description="General instruction following format"
        )
        
        self.template = {
            "instruction": "The instruction to follow",
            "response": "The response to the instruction"
        }
        
        self.use_cases = [
            "General instruction following",
            "Task-oriented interactions",
            "Multi-step procedures",
            "Creative content generation"
        ]
        
        self.examples = [
            {
                "instruction": "Write a short poem about artificial intelligence.",
                "response": "Silicon dreams in neural space,\nLogic flows with human grace.\nLearning patterns, day by day,\nAI walks where thoughts may stray."
            },
            {
                "instruction": "Explain the concept of quantum computing to a high school student.",
                "response": "Quantum computing is like having a super-powered calculator that can try many answers at once. Regular computers use bits (0s and 1s), but quantum computers use quantum bits or 'qubits' that can be 0, 1, or both at the same time! This special property lets them solve certain problems much faster than regular computers."
            }
        ]
    
    def format_sample(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a training sample as instruction-response.
        
        Args:
            input_text: Input text (instruction)
            output_text: Output text (response)
            metadata: Optional metadata
            
        Returns:
            Formatted training sample
        """
        sample = {
            "instruction": input_text,
            "response": output_text
        }
        
        # Add metadata if provided
        if metadata:
            sample["metadata"] = metadata
        
        return sample


class QuestionAnswerSchema(TrainingSchema):
    """Schema for question-answer format."""
    
    def __init__(self):
        """Initialize the question-answer schema."""
        super().__init__(
            name="question-answer",
            description="Knowledge-based question answering format"
        )
        
        self.template = {
            "question": "The question to answer",
            "answer": "The answer to the question"
        }
        
        self.use_cases = [
            "Knowledge-based applications",
            "FAQ systems",
            "Educational tools",
            "Information retrieval"
        ]
        
        self.examples = [
            {
                "question": "What is the capital of France?",
                "answer": "The capital of France is Paris."
            },
            {
                "question": "How does photosynthesis work?",
                "answer": "Photosynthesis is the process by which plants convert light energy into chemical energy. Plants use sunlight, water, and carbon dioxide to create glucose (sugar) and oxygen. The process takes place in the chloroplasts, specifically using the green pigment chlorophyll."
            }
        ]
    
    def format_sample(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a training sample as question-answer.
        
        Args:
            input_text: Input text (question)
            output_text: Output text (answer)
            metadata: Optional metadata
            
        Returns:
            Formatted training sample
        """
        sample = {
            "question": input_text,
            "answer": output_text
        }
        
        # Add metadata if provided
        if metadata:
            sample["metadata"] = metadata
        
        return sample


class SummarizationSchema(TrainingSchema):
    """Schema for summarization format."""
    
    def __init__(self):
        """Initialize the summarization schema."""
        super().__init__(
            name="summarization",
            description="Text summarization format"
        )
        
        self.template = {
            "document": "The text to summarize",
            "summary": "The summary of the text"
        }
        
        self.use_cases = [
            "Document summarization",
            "News article condensation",
            "Meeting notes summarization",
            "Research paper abstracts"
        ]
        
        self.examples = [
            {
                "document": "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term \"artificial intelligence\" had previously been used to describe machines that mimic and display \"human\" cognitive skills that are associated with the human mind, such as \"learning\" and \"problem-solving\". This definition has since been rejected by major AI researchers who now describe AI in terms of rationality and acting rationally, which does not limit how intelligence can be articulated.",
                "summary": "Artificial intelligence (AI) refers to intelligence demonstrated by machines. It involves the study of intelligent agents that perceive their environment and take actions to achieve goals. The definition has evolved from mimicking human cognitive skills to a broader concept of rationality and acting rationally."
            }
        ]
    
    def format_sample(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a training sample as summarization.
        
        Args:
            input_text: Input text (document)
            output_text: Output text (summary)
            metadata: Optional metadata
            
        Returns:
            Formatted training sample
        """
        sample = {
            "document": input_text,
            "summary": output_text
        }
        
        # Add metadata if provided
        if metadata:
            sample["metadata"] = metadata
        
        return sample


class ClassificationSchema(TrainingSchema):
    """Schema for classification format."""
    
    def __init__(self):
        """Initialize the classification schema."""
        super().__init__(
            name="classification",
            description="Text classification format"
        )
        
        self.template = {
            "text": "The text to classify",
            "category": "The category label"
        }
        
        self.use_cases = [
            "Sentiment analysis",
            "Topic classification",
            "Intent recognition",
            "Content moderation"
        ]
        
        self.examples = [
            {
                "text": "I absolutely loved this product! It exceeded all my expectations and I would definitely recommend it to others.",
                "category": "positive"
            },
            {
                "text": "This product was a complete waste of money. It broke after two days and customer service was unhelpful.",
                "category": "negative"
            }
        ]
    
    def format_sample(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a training sample as classification.
        
        Args:
            input_text: Input text (text)
            output_text: Output text (category)
            metadata: Optional metadata
            
        Returns:
            Formatted training sample
        """
        sample = {
            "text": input_text,
            "category": output_text
        }
        
        # Add metadata if provided
        if metadata:
            sample["metadata"] = metadata
        
        return sample


class CompletionSchema(TrainingSchema):
    """Schema for completion format."""
    
    def __init__(self):
        """Initialize the completion schema."""
        super().__init__(
            name="completion",
            description="Text completion format"
        )
        
        self.template = {
            "prompt": "The beginning of the text",
            "completion": "The completion of the text"
        }
        
        self.use_cases = [
            "Text continuation",
            "Code completion",
            "Story generation",
            "Email drafting"
        ]
        
        self.examples = [
            {
                "prompt": "Once upon a time, there was a young programmer who",
                "completion": "discovered a mysterious algorithm hidden in an old textbook. The algorithm seemed simple at first, but as they implemented it, they realized it could solve problems thought to be impossible. With this newfound power, they set out to change the world of computing forever."
            },
            {
                "prompt": "def calculate_fibonacci(n):",
                "completion": "\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    else:\n        return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)"
            }
        ]
    
    def format_sample(self, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a training sample as completion.
        
        Args:
            input_text: Input text (prompt)
            output_text: Output text (completion)
            metadata: Optional metadata
            
        Returns:
            Formatted training sample
        """
        sample = {
            "prompt": input_text,
            "completion": output_text
        }
        
        # Add metadata if provided
        if metadata:
            sample["metadata"] = metadata
        
        return sample


class TrainingSchemaManager:
    """Manages training schemas for LLM LoreSmith."""
    
    def __init__(self):
        """Initialize the training schema manager."""
        self.schemas = {
            "instruction-response": InstructionResponseSchema(),
            "question-answer": QuestionAnswerSchema(),
            "summarization": SummarizationSchema(),
            "classification": ClassificationSchema(),
            "completion": CompletionSchema()
        }
        
        self.default_schema = "instruction-response"
    
    def get_schema(self, schema_name: str) -> Optional[TrainingSchema]:
        """
        Get a training schema by name.
        
        Args:
            schema_name: Schema name
            
        Returns:
            Training schema or None if not found
        """
        return self.schemas.get(schema_name)
    
    def get_default_schema(self) -> TrainingSchema:
        """
        Get the default training schema.
        
        Returns:
            Default training schema
        """
        return self.schemas[self.default_schema]
    
    def list_schemas(self) -> List[Dict[str, str]]:
        """
        List all available training schemas.
        
        Returns:
            List of schema information
        """
        return [
            {
                "name": schema.name,
                "description": schema.description
            }
            for schema in self.schemas.values()
        ]
    
    def format_sample(self, schema_name: str, input_text: str, output_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a training sample according to a schema.
        
        Args:
            schema_name: Schema name
            input_text: Input text
            output_text: Output text
            metadata: Optional metadata
            
        Returns:
            Formatted training sample
        """
        schema = self.get_schema(schema_name)
        if not schema:
            schema = self.get_default_schema()
        
        return schema.format_sample(input_text, output_text, metadata)
    
    def detect_schema(self, input_text: str) -> str:
        """
        Attempt to detect the appropriate schema for input text.
        
        Args:
            input_text: Input text
            
        Returns:
            Detected schema name
        """
        # Check for question patterns
        question_patterns = [
            r'\?$',
            r'^what\s',
            r'^how\s',
            r'^why\s',
            r'^when\s',
            r'^where\s',
            r'^who\s',
            r'^which\s'
        ]
        
        for pattern in question_patterns:
            if re.search(pattern, input_text.lower()):
                return "question-answer"
        
        # Check for summarization patterns
        summarization_patterns = [
            r'summarize',
            r'summary',
            r'tldr',
            r'in brief',
            r'in summary'
        ]
        
        for pattern in summarization_patterns:
            if re.search(pattern, input_text.lower()):
                return "summarization"
        
        # Check for classification patterns
        classification_patterns = [
            r'classify',
            r'categorize',
            r'sentiment',
            r'topic',
            r'label'
        ]
        
        for pattern in classification_patterns:
            if re.search(pattern, input_text.lower()):
                return "classification"
        
        # Check for completion patterns (typically shorter and incomplete)
        if len(input_text.split()) < 10 and not input_text.endswith(('.', '!', '?')):
            return "completion"
        
        # Default to instruction-response
        return "instruction-response"
    
    def convert_between_schemas(self, sample: Dict[str, Any], source_schema: str, target_schema: str) -> Dict[str, Any]:
        """
        Convert a sample from one schema to another.
        
        Args:
            sample: Training sample
            source_schema: Source schema name
            target_schema: Target schema name
            
        Returns:
            Converted training sample
        """
        # Extract input and output from source schema
        input_text = ""
        output_text = ""
        metadata = sample.get("metadata", {})
        
        source_schema_obj = self.get_schema(source_schema)
        if not source_schema_obj:
            raise ValueError(f"Unknown source schema: {source_schema}")
        
        if source_schema == "instruction-response":
            input_text = sample.get("instruction", "")
            output_text = sample.get("response", "")
        elif source_schema == "question-answer":
            input_text = sample.get("question", "")
            output_text = sample.get("answer", "")
        elif source_schema == "summarization":
            input_text = sample.get("document", "")
            output_text = sample.get("summary", "")
        elif source_schema == "classification":
            input_text = sample.get("text", "")
            output_text = sample.get("category", "")
        elif source_schema == "completion":
            input_text = sample.get("prompt", "")
            output_text = sample.get("completion", "")
        
        # Format with target schema
        target_schema_obj = self.get_schema(target_schema)
        if not target_schema_obj:
            raise ValueError(f"Unknown target schema: {target_schema}")
        
        return target_schema_obj.format_sample(input_text, output_text, metadata)


# Create singleton instance
schema_manager = TrainingSchemaManager()

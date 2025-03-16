"""
Dataset generation pipeline for LLM LoreSmith.
Extracts, filters, and structures data from ingested documents for fine-tuning.
"""

import os
import re
import json
import hashlib
from typing import Dict, List, Optional, Tuple, Any, Set
from pathlib import Path
import PyPDF2
import docx
from bs4 import BeautifulSoup
import nltk
from nltk.tokenize import sent_tokenize
import numpy as np

from ..ingestion.document_manager import document_storage
from ..config.config_manager import config

# Download NLTK data if not already present
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)


class TextExtractor:
    """Extracts text from various document formats."""
    
    def extract_from_document(self, doc_id: str) -> Tuple[bool, str, Optional[str]]:
        """
        Extract text from a document.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Tuple of (success, message, extracted_text)
        """
        # Get document path
        doc_path = document_storage.get_document_path(doc_id)
        if not doc_path:
            return False, f"Document with ID {doc_id} not found", None
        
        # Determine file type and extract text
        file_ext = os.path.splitext(doc_path)[1].lower()
        
        try:
            if file_ext == '.pdf':
                text = self._extract_from_pdf(doc_path)
            elif file_ext == '.docx':
                text = self._extract_from_docx(doc_path)
            elif file_ext == '.txt' or file_ext == '.md':
                text = self._extract_from_text(doc_path)
            elif file_ext == '.html':
                text = self._extract_from_html(doc_path)
            else:
                return False, f"Unsupported file format: {file_ext}", None
            
            if not text or not text.strip():
                return False, "No text content extracted from document", None
            
            return True, "Text extracted successfully", text
        except Exception as e:
            return False, f"Error extracting text: {str(e)}", None
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF document."""
        text = ""
        with open(file_path, 'rb') as f:
            pdf = PyPDF2.PdfReader(f)
            for page in pdf.pages:
                text += page.extract_text() + "\n\n"
        return text
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX document."""
        doc = docx.Document(file_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    
    def _extract_from_text(self, file_path: str) -> str:
        """Extract text from plain text document."""
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            return f.read()
    
    def _extract_from_html(self, file_path: str) -> str:
        """Extract text from HTML document."""
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.extract()
            # Get text
            text = soup.get_text(separator="\n")
            # Break into lines and remove leading and trailing space
            lines = (line.strip() for line in text.splitlines())
            # Break multi-headlines into a line each
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            # Drop blank lines
            text = '\n'.join(chunk for chunk in chunks if chunk)
            return text


class ContentFilter:
    """Filters and cleans extracted text content."""
    
    def __init__(self):
        """Initialize the content filter."""
        self.min_sentence_length = 10  # Minimum characters per sentence
        self.max_sentence_length = 1000  # Maximum characters per sentence
    
    def filter_content(self, text: str) -> str:
        """
        Filter and clean text content.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Filtered and cleaned text
        """
        # Remove excessive whitespace
        text = self._normalize_whitespace(text)
        
        # Split into sentences
        sentences = sent_tokenize(text)
        
        # Filter sentences
        filtered_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Skip empty or very short sentences
            if not sentence or len(sentence) < self.min_sentence_length:
                continue
            
            # Truncate very long sentences
            if len(sentence) > self.max_sentence_length:
                sentence = sentence[:self.max_sentence_length] + "..."
            
            # Remove sentences that are likely headers, footers, or noise
            if self._is_noise(sentence):
                continue
            
            filtered_sentences.append(sentence)
        
        # Rejoin filtered sentences
        return " ".join(filtered_sentences)
    
    def _normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace in text."""
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        # Replace multiple newlines with double newline
        text = re.sub(r'\n+', '\n\n', text)
        return text.strip()
    
    def _is_noise(self, sentence: str) -> bool:
        """Check if a sentence is likely noise (header, footer, etc.)."""
        # Check for page numbers
        if re.match(r'^[0-9]+$', sentence.strip()):
            return True
        
        # Check for common headers/footers
        noise_patterns = [
            r'^Page \d+( of \d+)?$',
            r'^\d+/\d+$',
            r'^[Cc]hapter \d+$',
            r'^[Ss]ection \d+(\.\d+)*$',
            r'^[Ff]igure \d+(\.\d+)*:',
            r'^[Tt]able \d+(\.\d+)*:',
            r'^[Cc]opyright ©',
            r'^All rights reserved',
            r'^Confidential'
        ]
        
        for pattern in noise_patterns:
            if re.match(pattern, sentence.strip()):
                return True
        
        return False


class DatasetAnalyzer:
    """Analyzes dataset sufficiency and quality."""
    
    def __init__(self):
        """Initialize the dataset analyzer."""
        self.min_dataset_size = 1000  # Minimum characters
        self.min_samples = 10  # Minimum number of samples
        self.optimal_samples = 100  # Optimal number of samples
    
    def analyze_dataset(self, samples: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Analyze dataset sufficiency and quality.
        
        Args:
            samples: List of dataset samples
            
        Returns:
            Analysis results
        """
        if not samples:
            return {
                "is_sufficient": False,
                "message": "Dataset is empty",
                "stats": {
                    "sample_count": 0,
                    "total_chars": 0,
                    "avg_sample_length": 0,
                    "sufficiency_score": 0
                }
            }
        
        # Calculate statistics
        sample_count = len(samples)
        total_chars = sum(len(sample.get("input", "")) + len(sample.get("output", "")) for sample in samples)
        avg_sample_length = total_chars / sample_count if sample_count > 0 else 0
        
        # Calculate sufficiency score (0-100)
        size_score = min(100, (total_chars / self.min_dataset_size) * 50)
        count_score = min(50, (sample_count / self.optimal_samples) * 50)
        sufficiency_score = size_score + count_score
        
        # Determine if dataset is sufficient
        is_sufficient = (total_chars >= self.min_dataset_size and sample_count >= self.min_samples)
        
        # Generate message
        if is_sufficient:
            if sufficiency_score >= 80:
                message = "Dataset is sufficient and of good quality"
            else:
                message = "Dataset is minimally sufficient but could be improved"
        else:
            if sample_count < self.min_samples:
                message = f"Insufficient samples (minimum {self.min_samples} required)"
            else:
                message = f"Insufficient content (minimum {self.min_dataset_size} characters required)"
        
        return {
            "is_sufficient": is_sufficient,
            "message": message,
            "stats": {
                "sample_count": sample_count,
                "total_chars": total_chars,
                "avg_sample_length": avg_sample_length,
                "sufficiency_score": sufficiency_score
            }
        }
    
    def suggest_improvements(self, analysis: Dict[str, Any]) -> List[str]:
        """
        Suggest improvements based on dataset analysis.
        
        Args:
            analysis: Dataset analysis results
            
        Returns:
            List of improvement suggestions
        """
        suggestions = []
        
        if not analysis["is_sufficient"]:
            if analysis["stats"]["sample_count"] < self.min_samples:
                suggestions.append(f"Add more samples (at least {self.min_samples - analysis['stats']['sample_count']} more)")
            
            if analysis["stats"]["total_chars"] < self.min_dataset_size:
                suggestions.append(f"Add more content (at least {self.min_dataset_size - analysis['stats']['total_chars']} more characters)")
        
        if analysis["stats"]["sufficiency_score"] < 80:
            if analysis["stats"]["sample_count"] < self.optimal_samples:
                suggestions.append(f"For optimal results, consider adding more samples (optimal: {self.optimal_samples})")
            
            if analysis["stats"]["avg_sample_length"] < 100:
                suggestions.append("Consider adding more detailed samples with longer content")
        
        return suggestions


class DatasetStructurer:
    """Structures extracted and filtered content into a training dataset."""
    
    def __init__(self):
        """Initialize the dataset structurer."""
        self.base_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data",
            "datasets"
        )
        os.makedirs(self.base_dir, exist_ok=True)
    
    def create_dataset(self, doc_ids: List[str], dataset_name: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
        """
        Create a dataset from documents.
        
        Args:
            doc_ids: List of document IDs
            dataset_name: Optional dataset name
            
        Returns:
            Tuple of (success, message, dataset_id)
        """
        if not doc_ids:
            return False, "No documents specified", None
        
        # Generate dataset ID if not provided
        dataset_id = dataset_name or f"dataset_{self._generate_id(doc_ids)}"
        dataset_dir = os.path.join(self.base_dir, dataset_id)
        os.makedirs(dataset_dir, exist_ok=True)
        
        # Extract and process text from each document
        extractor = TextExtractor()
        filter = ContentFilter()
        samples = []
        
        for doc_id in doc_ids:
            success, message, text = extractor.extract_from_document(doc_id)
            if not success or not text:
                continue
            
            # Filter content
            filtered_text = filter.filter_content(text)
            
            # Get document metadata
            metadata = document_storage.get_document_metadata(doc_id) or {}
            
            # Create samples from the document
            doc_samples = self._create_samples_from_text(filtered_text, metadata)
            samples.extend(doc_samples)
        
        if not samples:
            return False, "No valid samples could be created from the documents", None
        
        # Analyze dataset
        analyzer = DatasetAnalyzer()
        analysis = analyzer.analyze_dataset(samples)
        
        # Save dataset
        dataset_path = os.path.join(dataset_dir, "dataset.json")
        with open(dataset_path, 'w', encoding='utf-8') as f:
            json.dump(samples, f, indent=2)
        
        # Save analysis
        analysis_path = os.path.join(dataset_dir, "analysis.json")
        with open(analysis_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2)
        
        # Save metadata
        metadata = {
            "dataset_id": dataset_id,
            "document_ids": doc_ids,
            "sample_count": len(samples),
            "created_at": "2025-03-16T01:40:00Z",  # Would use actual timestamp in production
            "is_sufficient": analysis["is_sufficient"],
            "sufficiency_score": analysis["stats"]["sufficiency_score"]
        }
        
        metadata_path = os.path.join(dataset_dir, "metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        
        return True, f"Dataset created with {len(samples)} samples", dataset_id
    
    def get_dataset(self, dataset_id: str) -> Optional[List[Dict[str, str]]]:
        """
        Get a dataset by ID.
        
        Args:
            dataset_id: Dataset ID
            
        Returns:
            Dataset samples or None if not found
        """
        dataset_path = os.path.join(self.base_dir, dataset_id, "dataset.json")
        if not os.path.isfile(dataset_path):
            return None
        
        with open(dataset_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def get_dataset_metadata(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a dataset.
        
        Args:
            dataset_id: Dataset ID
            
        Returns:
            Dataset metadata or None if not found
        """
        metadata_path = os.path.join(self.base_dir, dataset_id, "metadata.json")
        if not os.path.isfile(metadata_path):
            return None
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def list_datasets(self) -> List[str]:
        """
        List all dataset IDs.
        
        Returns:
            List of dataset IDs
        """
        if not os.path.isdir(self.base_dir):
            return []
        
        return [d for d in os.listdir(self.base_dir) 
                if os.path.isdir(os.path.join(self.base_dir, d))]
    
    def delete_dataset(self, dataset_id: str) -> bool:
        """
        Delete a dataset.
        
        Args:
            dataset_id: Dataset ID
            
        Returns:
            True if dataset was deleted, False otherwise
        """
        import shutil
        dataset_dir = os.path.join(self.base_dir, dataset_id)
        if not os.path.isdir(dataset_dir):
            return False
        
        shutil.rmtree(dataset_dir)
        return True
    
    def _create_samples_from_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Create training samples from text.
        
        Args:
            text: Filtered text content
            metadata: Document metadata
            
        Returns:
            List of training samples
        """
        samples = []
        
        # Split text into paragraphs
        paragraphs = re.split(r'\n\s*\n', text)
        
        # Create instruction-following samples
        for i, paragraph in enumerate(paragraphs):
            if not paragraph.strip() or len(paragraph) < 100:
                continue
            
            # Create an instruction-following sample
            sample = {
                "input": f"Summarize the following text from {metadata.get('filename', 'the document')}:\n\n{paragraph}",
                "output": self._generate_summary(paragraph)
            }
            samples.append(sample)
            
            # Create a knowledge-based sample if paragraph is informative
            if len(paragraph) > 200 and self._is_informative(paragraph):
                # Extract a potential question from the paragraph
                question = self._generate_question(paragraph)
                if question:
                    sample = {
                        "input": question,
                        "output": self._generate_answer(paragraph, question)
                    }
                    samples.append(sample)
        
        return samples
    
    def _generate_summary(self, text: str) -> str:
        """
        Generate a placeholder summary for a text.
        
        In a real implementation, this would use an actual summarization algorithm.
        For now, we'll just take the first sentence and add a placeholder note.
        
        Args:
            text: Text to summarize
            
        Returns:
            Summary
        """
        sentences = sent_tokenize(text)
        if not sentences:
            return "No content to summarize."
        
        first_sentence = sentences[0]
        return f"{first_sentence}\n\n[Note: This is a placeholder summary. In the actual implementation, this would be generated using a summarization algorithm.]"
    
    def _generate_question(self, text: str) -> Optional[str]:
        """
        Generate a placeholder question from text.
        
        In a real implementation, this would use an actual question generation algorithm.
        For now, we'll just extract key phrases and create a simple question.
        
        Args:
            text: Text to generate question from
            
        Returns:
            Generated question or None
        """
        # Extract potential subject from first sentence
        sentences = sent_tokenize(text)
        if not sentences:
            return None
        
        first_sentence = sentences[0]
        
        # Simple heuristic to extract a subject
        # In a real implementation, this would use NLP techniques
        words = first_sentence.split()
        if len(words) < 3:
            return None
        
        # Try to find a noun phrase
        subject = " ".join(words[1:3])
        
        return f"What can you tell me about {subject}?"
    
    def _generate_answer(self, text: str, question: str) -> str:
        """
        Generate a placeholder answer for a question based on text.
        
        In a real implementation, this would use an actual QA algorithm.
        For now, we'll just return the original text with a placeholder note.
        
        Args:
            text: Source text
            question: Question to answer
            
        Returns:
            Generated answer
        """
        return f"{text[:200]}...\n\n[Note: This is a placeholder answer. In the actual implementation, this would be generated using a question-answering algorithm.]"
    
    def _is_informative(self, text: str) -> bool:
        """
        Check if text is likely informative (contains facts, explanations, etc.).
        
        In a real implementation, this would use more sophisticated NLP techniques.
        For now, we'll use simple heuristics.
        
        Args:
            text: Text to check
            
        Returns:
            True if text is likely informative
        """
        # Check for informative indicators
        informative_patterns = [
            r'\bis\b', r'\bare\b', r'\bwas\b', r'\bwere\b',  # Being verbs
            r'\bconsists? of\b', r'\bcontains?\b',  # Composition
            r'\bdefined as\b', r'\brefers to\b',  # Definitions
            r'\bcauses?\b', r'\bresults? in\b',  # Causality
            r'\bfor example\b', r'\bsuch as\b',  # Examples
            r'\bfirst\b', r'\bsecond\b', r'\bfinally\b',  # Sequence
            r'\baccording to\b', r'\bstudies show\b'  # References
        ]
        
        for pattern in informative_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        return False
    
    def _generate_id(self, doc_ids: List[str]) -> str:
        """
        Generate a unique dataset ID based on document IDs.
        
        Args:
            doc_ids: List of document IDs
            
        Returns:
            Generated dataset ID
        """
        # Sort document IDs for consistency
        sorted_ids = sorted(doc_ids)
        
        # Create a hash of the document IDs
        hash_input = "_".join(sorted_ids)
        hash_value = hashlib.md5(hash_input.encode()).hexdigest()[:8]
        
        # Add timestamp
        import time
        timestamp = int(time.time())
        
        return f"ds_{timestamp}_{hash_value}"


class DatasetGenerationPipeline:
    """Main pipeline for dataset generation."""
    
    def __init__(self):
        """Initialize the dataset generation pipeline."""
        self.extractor = TextExtractor()
        self.filter = ContentFilter()
        self.analyzer = DatasetAnalyzer()
        self.structurer = DatasetStructurer()
    
    def generate_dataset(self, doc_ids: List[str], dataset_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a dataset from documents.
        
        Args:
            doc_ids: List of document IDs
            dataset_name: Optional dataset name
            
        Returns:
            Generation result
        """
        # Create dataset
        success, message, dataset_id = self.structurer.create_dataset(doc_ids, dataset_name)
        
        if not success:
            return {
                "success": False,
                "message": message,
                "dataset_id": None
            }
        
        # Get dataset metadata and analysis
        metadata = self.structurer.get_dataset_metadata(dataset_id)
        
        # Load analysis
        analysis_path = os.path.join(self.structurer.base_dir, dataset_id, "analysis.json")
        analysis = None
        if os.path.isfile(analysis_path):
            with open(analysis_path, 'r', encoding='utf-8') as f:
                analysis = json.load(f)
        
        # Generate improvement suggestions if needed
        suggestions = []
        if analysis and not analysis.get("is_sufficient", False):
            suggestions = self.analyzer.suggest_improvements(analysis)
        
        return {
            "success": True,
            "message": message,
            "dataset_id": dataset_id,
            "metadata": metadata,
            "analysis": analysis,
            "suggestions": suggestions
        }


# Create singleton instances
text_extractor = TextExtractor()
content_filter = ContentFilter()
dataset_analyzer = DatasetAnalyzer()
dataset_structurer = DatasetStructurer()
dataset_pipeline = DatasetGenerationPipeline()

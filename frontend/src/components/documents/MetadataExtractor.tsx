import React, { useEffect, useState } from 'react';
import { FiInfo, FiEdit2, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiPlus, FiTrash2, FiRefreshCw, FiDownload, FiUpload } from 'react-icons/fi';
import { Document, updateDocumentMetadata } from '../../store/slices/documentsSlice';
import { useDispatch } from 'react-redux';
import { updateDocumentMetadata as updateMetadataAPI } from '../../api/documentsApi';

// Define metadata categories for better organization
export enum MetadataCategory {
  BASIC = 'Basic Information',
  CONTENT = 'Content Properties',
  SECURITY = 'Security & Compliance',
  EXTRACTION = 'Extraction Settings',
  CUSTOM = 'Custom Fields'
}

// Interface for metadata field definition
interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'tags' | 'select' | 'boolean';
  category: MetadataCategory;
  description?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: (value: any) => string | null;
  extractionRelevant?: boolean; // Flag fields important for extraction
}

interface MetadataExtractorProps {
  document: Document;
  onClose?: () => void;
}

const MetadataExtractor: React.FC<MetadataExtractorProps> = ({ document, onClose }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Document['metadata']>(document.metadata || {});
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'complete' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [customFields, setCustomFields] = useState<MetadataField[]>([]);
  const [newCustomField, setNewCustomField] = useState<{ 
    key: string; 
    label: string; 
    type: 'text' | 'date' | 'number' | 'tags' | 'select' | 'boolean';
    category: MetadataCategory;
    description: string;
    extractionRelevant: boolean;
  }>({ 
    key: '', 
    label: '', 
    type: 'text',
    category: MetadataCategory.CUSTOM,
    description: '',
    extractionRelevant: false
  });
  const [activeCategory, setActiveCategory] = useState<MetadataCategory | 'all'>('all');
  const [metadataCompleteness, setMetadataCompleteness] = useState<number>(0);
  const [metadataHistory, setMetadataHistory] = useState<Document['metadata'][]>([]);
  
  // Automatically start metadata detection if none exists
  useEffect(() => {
    if (!document.metadata || Object.keys(document.metadata).length === 0) {
      detectMetadata();
    } else {
      // If we have metadata, update the history
      updateMetadataHistory(document.metadata);
    }
  }, [document.id]);

  // Update metadata completeness score when metadata changes
  useEffect(() => {
    const completenessScore = calculateCompletenessScore(metadata, allMetadataFields);
    setMetadataCompleteness(completenessScore);
  }, [metadata]);

  // Standard metadata fields with more comprehensive definitions
  const standardMetadataFields: MetadataField[] = [
    { 
      key: 'title', 
      label: 'Title', 
      type: 'text',
      category: MetadataCategory.BASIC,
      description: 'Document title or name',
      required: true,
      extractionRelevant: true,
      validation: (value) => !value ? 'Title is required' : null
    },
    { 
      key: 'author', 
      label: 'Author', 
      type: 'text',
      category: MetadataCategory.BASIC,
      description: 'Creator or author of the document',
      extractionRelevant: true,
      validation: (value) => value && value.length < 2 ? 'Author name is too short' : null
    },
    { 
      key: 'datePublished', 
      label: 'Date Published', 
      type: 'date',
      category: MetadataCategory.BASIC,
      description: 'Publication or creation date',
      extractionRelevant: true,
      validation: (value) => {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid date format' : null;
      }
    },
    { 
      key: 'language', 
      label: 'Language', 
      type: 'select',
      category: MetadataCategory.CONTENT,
      description: 'Primary language of the document',
      extractionRelevant: true,
      options: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Other']
    },
    { 
      key: 'contentType', 
      label: 'Content Type', 
      type: 'text',
      category: MetadataCategory.CONTENT,
      description: 'Type of content or document format',
      extractionRelevant: true
    },
    { 
      key: 'pageCount', 
      label: 'Page Count', 
      type: 'number',
      category: MetadataCategory.CONTENT,
      description: 'Number of pages in the document',
      validation: (value) => value && (isNaN(Number(value)) || Number(value) < 0) 
        ? 'Page count must be a positive number' 
        : null
    },
    { 
      key: 'wordCount', 
      label: 'Word Count', 
      type: 'number',
      category: MetadataCategory.CONTENT,
      description: 'Approximate number of words in the document',
      validation: (value) => value && (isNaN(Number(value)) || Number(value) < 0) 
        ? 'Word count must be a positive number' 
        : null
    },
    { 
      key: 'keywords', 
      label: 'Keywords', 
      type: 'tags',
      category: MetadataCategory.CONTENT,
      description: 'Key terms related to the document content',
      extractionRelevant: true,
      validation: (value) => Array.isArray(value) && value.some(tag => tag.length > 50) 
        ? 'Keywords should be less than 50 characters each' 
        : null
    },
    { 
      key: 'description', 
      label: 'Description', 
      type: 'text',
      category: MetadataCategory.CONTENT,
      description: 'Brief summary of the document',
      extractionRelevant: true,
      validation: (value) => value && value.length > 500 ? 'Description is too long (max 500 characters)' : null
    },
    {
      key: 'pii',
      label: 'Contains PII',
      type: 'boolean',
      category: MetadataCategory.SECURITY,
      description: 'Document contains personally identifiable information',
      extractionRelevant: true,
      options: ['Yes', 'No']
    },
    {
      key: 'securityClassification',
      label: 'Security Classification',
      type: 'select',
      category: MetadataCategory.SECURITY,
      description: 'Security or confidentiality level',
      extractionRelevant: true,
      options: ['N/A', 'Unclassified', 'Secret', 'Top Secret'],
      validation: (value) => value && !['N/A', 'Unclassified', 'Secret', 'Top Secret'].includes(value) 
        ? 'Invalid security classification' : null
    },
    {
      key: 'retentionPolicy',
      label: 'Retention Policy',
      type: 'select',
      category: MetadataCategory.SECURITY,
      description: 'How long the document should be retained',
      options: ['Not Specified', '30 Days', '90 Days', '1 Year', '5 Years', 'Permanent']
    },
    {
      key: 'extractionMethod',
      label: 'Extraction Method',
      type: 'select',
      category: MetadataCategory.EXTRACTION,
      description: 'Preferred method for content extraction',
      extractionRelevant: true,
      options: ['Standard', 'OCR', 'Advanced']
    },
    {
      key: 'extractionPriority',
      label: 'Extraction Priority',
      type: 'select',
      category: MetadataCategory.EXTRACTION,
      description: 'Processing priority for extraction',
      extractionRelevant: true,
      options: ['Low', 'Normal', 'High']
    },
    {
      key: 'structurePreservation',
      label: 'Preserve Structure',
      type: 'boolean',
      category: MetadataCategory.EXTRACTION,
      description: 'Maintain document layout in extraction',
      extractionRelevant: true,
      options: ['Yes', 'No']
    }
  ];

  // Get all fields (standard + custom)
  const allMetadataFields = [...standardMetadataFields, ...customFields];

  // Update metadata history
  const updateMetadataHistory = (newMetadata: Document['metadata']) => {
    setMetadataHistory(prev => {
      // Limit history to 10 entries
      const updatedHistory = [newMetadata, ...prev].slice(0, 10);
      return updatedHistory;
    });
  };

  // Enhanced metadata detection with content analysis
  const detectMetadata = async () => {
    setDetectionStatus('detecting');
    setError(null);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate metadata based on document type and content
      const detectedMetadata = generateMetadataForDocument(document);
      
      // Update local state
      setMetadata(detectedMetadata);
      
      // Update Redux store
      dispatch(updateDocumentMetadata({ 
        id: document.id, 
        metadata: detectedMetadata 
      }));
      
      // Update history
      updateMetadataHistory(detectedMetadata);
      
      setDetectionStatus('complete');
    } catch (err) {
      console.error('Error detecting metadata:', err);
      setError('Failed to extract metadata. Please try again.');
      setDetectionStatus('error');
    }
  };

  // Enhanced metadata generation with deeper content analysis
  const generateMetadataForDocument = (doc: Document): Document['metadata'] => {
    // This would be replaced with actual metadata extraction in production
    const fileExtension = doc.name.split('.').pop()?.toLowerCase();
    const fileName = doc.name.replace(/\.[^/.]+$/, "");
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Extract title from filename with some intelligence
    let title = fileName
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim();
    
    // Capitalize first letter of each word for title
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Check for PII indicators in filename (this would be done with actual content analysis in production)
    const hasPII = detectPII(fileName);
    
    // Determine security classification (would be based on content analysis in production)
    const securityClass = detectSecurityClassification(fileName, doc.type);
    
    // Base metadata
    const generatedMetadata: Document['metadata'] = {
      title,
      datePublished: currentDate,
      language: 'English',
      keywords: extractKeywordsFromFilename(fileName),
      description: `This document contains information related to ${title.toLowerCase()}.`,
      pii: hasPII,
      securityClassification: securityClass
    };
    
    // Add type-specific metadata
    switch (fileExtension) {
      case 'pdf':
        generatedMetadata.pageCount = Math.floor(Math.random() * 50) + 1;
        generatedMetadata.author = findAuthorByPattern(fileName) || 'Unknown Author';
        generatedMetadata.contentType = 'PDF Document';
        generatedMetadata.extractionMethod = 'Standard';
        if (hasPII) generatedMetadata.extractionPriority = 'High';
        if (detectScannedContent(fileName)) {
          generatedMetadata.extractionMethod = 'OCR';
        }
        generatedMetadata.structurePreservation = detectComplexLayout(fileName) ? true : false;
        break;
        
      case 'docx':
      case 'doc':
        generatedMetadata.pageCount = Math.floor(Math.random() * 30) + 1;
        generatedMetadata.author = findAuthorByPattern(fileName) || 'Unknown Author';
        generatedMetadata.contentType = 'Word Document';
        generatedMetadata.extractionMethod = 'Standard';
        generatedMetadata.structurePreservation = true;
        break;
        
      case 'txt':
        generatedMetadata.contentType = 'Plain Text';
        generatedMetadata.wordCount = Math.floor(Math.random() * 5000) + 100;
        generatedMetadata.extractionMethod = 'Standard';
        generatedMetadata.structurePreservation = false;
        break;
        
      case 'md':
        generatedMetadata.contentType = 'Markdown';
        generatedMetadata.wordCount = Math.floor(Math.random() * 3000) + 100;
        generatedMetadata.extractionMethod = 'Standard';
        generatedMetadata.structurePreservation = true;
        break;
        
      default:
        generatedMetadata.contentType = 'Unknown';
        generatedMetadata.extractionMethod = 'Advanced';
    }
    
    return generatedMetadata;
  };

  // Helper functions for metadata extraction
  const findAuthorByPattern = (fileName: string): string | null => {
    // Look for patterns like "by Author Name" or "Author Name -"
    const byPattern = fileName.match(/by\s+([A-Za-z\s]+)/) || fileName.match(/([A-Za-z\s]+)\s+-/);
    return byPattern ? byPattern[1].trim() : null;
  };

  const extractKeywordsFromFilename = (fileName: string): string[] => {
    // Split filename by common separators and filter out common words
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'by', 'of'];
    
    const words = fileName
      .replace(/[-_]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
    
    // Remove duplicates and limit to 5 keywords
    return [...new Set(words)].slice(0, 5);
  };

  const detectPII = (fileName: string): boolean => {
    // Simple PII detection based on keywords
    const piiKeywords = [
      'confidential', 'private', 'personal', 'sensitive',
      'ssn', 'social security', 'passport', 'credit card',
      'dob', 'birth', 'address', 'patient', 'medical',
      'health', 'financial', 'account', 'password'
    ];
    
    return piiKeywords.some(keyword => 
      fileName.toLowerCase().includes(keyword)
    );
  };

  const detectSecurityClassification = (fileName: string, fileType: string): 'N/A' | 'Unclassified' | 'Secret' | 'Top Secret' => {
    // Detect security classification based on filename and type
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.includes('topsecret') || lowerFileName.includes('top-secret') || lowerFileName.includes('top_secret')) {
      return 'Top Secret';
    }
    
    if (lowerFileName.includes('secret') || lowerFileName.includes('classified') || lowerFileName.includes('confidential')) {
      return 'Secret';
    }
    
    if (lowerFileName.includes('unclassified') || lowerFileName.includes('public')) {
      return 'Unclassified';
    }
    
    // Default classification
    return 'N/A';
  };

  // New helper functions for extraction-related metadata
  const detectScannedContent = (fileName: string): boolean => {
    const scanIndicators = ['scan', 'scanned', 'ocr', 'image'];
    return scanIndicators.some(indicator => fileName.toLowerCase().includes(indicator));
  };

  const detectComplexLayout = (fileName: string): boolean => {
    const complexIndicators = ['report', 'form', 'table', 'chart', 'layout', 'column'];
    return complexIndicators.some(indicator => fileName.toLowerCase().includes(indicator));
  };

  // Handle metadata field change
  const handleMetadataChange = (field: string, value: any) => {
    // For boolean fields that use Yes/No selects, convert to actual boolean
    if (allMetadataFields.find(f => f.key === field)?.type === 'boolean') {
      if (value === 'Yes') value = true;
      if (value === 'No') value = false;
    }
    
    // Clear validation error if value changed
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update metadata state
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      [field]: value
    }));
  };

  // Validate all metadata fields
  const validateMetadata = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    // Check each field with validation function
    allMetadataFields.forEach(field => {
      if (field.validation && metadata[field.key] !== undefined) {
        const error = field.validation(metadata[field.key]);
        if (error) {
          errors[field.key] = error;
        }
      }
      
      // Check required fields
      if (field.required && (metadata[field.key] === undefined || metadata[field.key] === '')) {
        errors[field.key] = `${field.label} is required`;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save metadata changes
  const saveMetadata = async () => {
    // Validate metadata before saving
    if (!validateMetadata()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Save current state in history before updating
      updateMetadataHistory({ ...metadata });
      
      // Call API to update metadata
      await updateMetadataAPI(document.id, metadata);
      
      // Update Redux store
      dispatch(updateDocumentMetadata({ 
        id: document.id, 
        metadata 
      }));
      
      setIsEditing(false);
      setLoading(false);
    } catch (err) {
      console.error('Error saving metadata:', err);
      setError('Failed to save metadata. Please try again.');
      setLoading(false);
    }
  };

  // Add a new custom metadata field
  const handleAddCustomField = () => {
    if (!newCustomField.key || !newCustomField.label) return;
    
    // Convert key to camelCase
    const key = newCustomField.key
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, (_, char) => char.toLowerCase());
    
    // Check if field already exists
    if (allMetadataFields.some(field => field.key === key)) {
      setError(`A field with key "${key}" already exists`);
      return;
    }
    
    // Create the new field with all properties
    const newField: MetadataField = {
      key,
      label: newCustomField.label,
      type: newCustomField.type,
      category: newCustomField.category,
      description: newCustomField.description || `Custom field: ${newCustomField.label}`,
      extractionRelevant: newCustomField.extractionRelevant
    };
    
    // Add options for select type
    if (newField.type === 'select') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }
    
    // Add validation for required fields
    if (newField.required) {
      newField.validation = (value) => !value ? `${newField.label} is required` : null;
    }
    
    // Add new custom field
    setCustomFields(prev => [...prev, newField]);
    
    // Reset new field form
    setNewCustomField({ 
      key: '', 
      label: '', 
      type: 'text',
      category: MetadataCategory.CUSTOM,
      description: '',
      extractionRelevant: false
    });
  };

  // Remove a custom field
  const handleRemoveCustomField = (fieldKey: string) => {
    setCustomFields(prev => prev.filter(field => field.key !== fieldKey));
    
    // Also remove the field from metadata if it exists
    if (metadata?.[fieldKey]) {
      setMetadata(prev => {
        const updated = {...prev};
        delete updated[fieldKey];
        return updated;
      });
    }
  };
  
  // Export metadata to JSON
  const exportMetadata = () => {
    // Create a JSON file with metadata
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Create download link
    const linkElement = globalThis.document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${document.name}-metadata.json`);
    globalThis.document.body.appendChild(linkElement);
    
    // Trigger download
    linkElement.click();
    
    // Clean up
    globalThis.document.body.removeChild(linkElement);
  };
  
  // Import metadata from JSON
  const importMetadata = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedMetadata = JSON.parse(e.target?.result as string);
        
        // Validate imported metadata
        if (typeof importedMetadata !== 'object') {
          throw new Error('Invalid metadata format');
        }
        
        // Update metadata
        setMetadata(importedMetadata);
        setError(null);
        
        // Reset file input
        event.target.value = '';
      } catch (err) {
        console.error('Error importing metadata:', err);
        setError('Failed to import metadata. Invalid format.');
      }
    };
    
    reader.readAsText(file);
  };
  
  // Filter fields by active category
  const filteredFields = allMetadataFields.filter(field => 
    activeCategory === 'all' || field.category === activeCategory
  );
  
  // Organize fields by extraction relevance
  const extractionRelevantFields = filteredFields.filter(field => field.extractionRelevant);
  const otherFields = filteredFields.filter(field => !field.extractionRelevant);

  // Render a metadata field
  const renderField = (field: MetadataField) => {
    const value = metadata?.[field.key];
    const error = validationErrors[field.key];
    const isRequired = field.required;
    
    return (
      <div key={field.key} className={`mb-4 ${error ? 'border-l-2 border-red-500 pl-2' : ''}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
          {field.extractionRelevant && (
            <span className="ml-2 px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-sm">
              Extraction
            </span>
          )}
        </label>
        
        {field.type === 'text' && (
          <input
            type="text"
            className={`input input-bordered w-full ${error ? 'border-red-300' : ''}`}
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            disabled={!isEditing}
          />
        )}
        
        {field.type === 'number' && (
          <input
            type="number"
            className={`input input-bordered w-full ${error ? 'border-red-300' : ''}`}
            value={value || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            disabled={!isEditing}
          />
        )}
        
        {field.type === 'date' && (
          <input
            type="date"
            className={`input input-bordered w-full ${error ? 'border-red-300' : ''}`}
            value={value || ''}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            disabled={!isEditing}
          />
        )}
        
        {field.type === 'select' && (
          <select
            className={`select select-bordered w-full ${error ? 'border-red-300' : ''}`}
            value={value || ''}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            disabled={!isEditing}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
        
        {field.type === 'boolean' && (
          <select
            className={`select select-bordered w-full ${error ? 'border-red-300' : ''}`}
            value={value === true ? 'Yes' : value === false ? 'No' : ''}
            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
            disabled={!isEditing}
          >
            <option value="">Select {field.label}</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        )}
        
        {field.type === 'tags' && (
          <div className={`p-2 border rounded-lg ${error ? 'border-red-300' : 'border-gray-300'}`}>
            <div className="flex flex-wrap gap-1 mb-2">
              {Array.isArray(value) && value.map((tag, index) => (
                <div 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                >
                  {tag}
                  {isEditing && (
                    <button 
                      className="ml-1 text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        const newTags = [...value];
                        newTags.splice(index, 1);
                        handleMetadataChange(field.key, newTags);
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {isEditing && (
              <div className="flex">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 mr-2"
                  placeholder="Add tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const inputEl = e.target as HTMLInputElement;
                      const newTag = inputEl.value.trim();
                      
                      if (newTag) {
                        const currentTags = Array.isArray(value) ? value : [];
                        if (!currentTags.includes(newTag)) {
                          handleMetadataChange(field.key, [...currentTags, newTag]);
                        }
                        inputEl.value = '';
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        
        {field.description && !error && (
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
        )}
        
        {field.category === MetadataCategory.CUSTOM && (
          <div className="mt-1 flex justify-end">
            <button
              className="text-xs text-red-500 hover:text-red-700"
              onClick={() => handleRemoveCustomField(field.key)}
              disabled={!isEditing}
            >
              Remove custom field
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render metadata score visualization
  const renderMetadataScore = () => {
    // Calculate metadata completion score - how many fields out of total possible are filled
    const totalFields = filteredFields.length;
    
    // Count how many fields have values
    let filledFields = 0;
    
    // Safely process metadata
    const safeMetadata = metadata || {};
    
    filteredFields.forEach(field => {
      const fieldKey = field.key;
      const fieldValue = safeMetadata[fieldKey];
      
      if (fieldValue !== undefined && 
          (typeof fieldValue === 'string' ? fieldValue.trim() !== '' : true)) {
        filledFields++;
      }
    });
    
    const completionPercentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    
    // Determine color based on score
    let scoreColor = 'bg-red-500';
    if (completionPercentage >= 70) {
      scoreColor = 'bg-green-500';
    } else if (completionPercentage >= 40) {
      scoreColor = 'bg-yellow-500';
    }
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Metadata Completeness</span>
          <span className="text-sm font-medium">{completionPercentage}%</span>
        </div>
        
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div 
            className={`h-full rounded-full ${scoreColor}`} 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        <p className="text-xs text-gray-500 mt-1">
          {filledFields} of {totalFields} fields completed
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-oswald font-semibold">Document Metadata</h3>
          <div className="flex items-center gap-2">
            {!isEditing && detectionStatus !== 'detecting' && (
              <button 
                className="btn btn-sm btn-outline"
                onClick={detectMetadata}
                title="Re-detect metadata"
              >
                <FiRefreshCw className="mr-1" size={16} /> Re-detect
              </button>
            )}
            
            {isEditing ? (
              <>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setIsEditing(false);
                    setValidationErrors({});
                    // Reset to original metadata if cancelled
                    setMetadata(document.metadata || {});
                  }}
                  disabled={loading}
                >
                  <FiX className="mr-1" size={16} /> Cancel
                </button>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={saveMetadata}
                  disabled={loading}
                >
                  {loading ? (
                    'Saving...'
                  ) : (
                    <>
                      <FiSave className="mr-1" size={16} /> Save
                    </>
                  )}
                </button>
              </>
            ) : (
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setIsEditing(true)}
                disabled={detectionStatus === 'detecting'}
              >
                <FiEdit2 className="mr-1" size={16} /> Edit Metadata
              </button>
            )}
          </div>
        </div>

        {/* Metadata Completeness Indicator */}
        {renderMetadataScore()}
      </div>
    
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex">
            <FiAlertCircle className="flex-shrink-0 text-red-500 mt-0.5 mr-2" size={16} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
  
      {/* Detection Progress */}
      {detectionStatus === 'detecting' && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center">
            <div className="mr-3 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <p className="text-sm text-blue-700">Detecting metadata from document content...</p>
          </div>
        </div>
      )}
      
      {/* Import/Export buttons */}
      {isEditing && (
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-end space-x-2">
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            id="metadata-import" 
            onChange={importMetadata} 
          />
          <label 
            htmlFor="metadata-import" 
            className="btn btn-sm btn-outline cursor-pointer"
          >
            <FiUpload className="mr-1" size={14} /> Import
          </label>
          <button 
            className="btn btn-sm btn-outline" 
            onClick={exportMetadata}
          >
            <FiDownload className="mr-1" size={14} /> Export
          </button>
        </div>
      )}
      
      {/* Category Navigation */}
      <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2">
        <button 
          className={`px-3 py-1 text-sm rounded-full ${
            activeCategory === 'all' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {Object.values(MetadataCategory).map(category => (
          <button 
            key={category}
            className={`px-3 py-1 text-sm rounded-full ${
              activeCategory === category 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Metadata Fields */}
      <div className="p-4">
        {/* If we have extraction relevant fields, show them first */}
        {extractionRelevantFields.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
              <FiInfo className="mr-1" size={16} />
              Extraction-Critical Fields
            </h4>
            <div className="border-l-2 border-blue-200 pl-3">
              {extractionRelevantFields.map(field => renderField(field))}
            </div>
          </div>
        )}
        
        {/* Other fields */}
        {otherFields.map(field => renderField(field))}
        
        {/* No fields in category */}
        {filteredFields.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500">No metadata fields in this category</p>
          </div>
        )}
        
        {/* Add Custom Field Form */}
        {isEditing && activeCategory === MetadataCategory.CUSTOM && (
          <div className="mt-6 p-4 border border-blue-100 rounded-lg bg-blue-50">
            <h4 className="text-md font-semibold mb-3">Add Custom Metadata Field</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Key
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="e.g., customField"
                  value={newCustomField.key}
                  onChange={(e) => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="e.g., Custom Field"
                  value={newCustomField.label}
                  onChange={(e) => setNewCustomField(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={newCustomField.type}
                  onChange={(e) => setNewCustomField(prev => ({ 
                    ...prev, 
                    type: e.target.value as any
                  }))}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select/Dropdown</option>
                  <option value="tags">Tags</option>
                  <option value="boolean">Yes/No</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Description
                </label>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="Description of this field"
                  value={newCustomField.description}
                  onChange={(e) => setNewCustomField(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="extraction-relevant"
                className="checkbox checkbox-sm checkbox-primary mr-2"
                checked={newCustomField.extractionRelevant}
                onChange={(e) => setNewCustomField(prev => ({ 
                  ...prev, 
                  extractionRelevant: e.target.checked 
                }))}
              />
              <label htmlFor="extraction-relevant" className="text-sm">
                Relevant for extraction phase
              </label>
            </div>
            
            <div className="flex justify-end">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAddCustomField}
                disabled={!newCustomField.key || !newCustomField.label}
              >
                <FiPlus className="mr-1" size={14} /> Add Field
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Calculate metadata completeness score based on filled fields
export const calculateCompletenessScore = (
  metadata: Document['metadata'] | undefined, 
  fields: MetadataField[]
): number => {
  if (!metadata || Object.keys(metadata).length === 0) return 0;
  
  // Count extraction-relevant and required fields
  const extractionRelevantFields = fields.filter(field => field.extractionRelevant);
  const requiredFields = fields.filter(field => field.required);
  
  // Count filled fields
  let filledRelevantCount = 0;
  let filledRequiredCount = 0;
  let filledOtherCount = 0;
  let totalFields = fields.length;
  
  fields.forEach(field => {
    const value = metadata[field.key];
    const isFilled = value !== undefined && value !== '' && 
                    !(Array.isArray(value) && value.length === 0);
    
    if (isFilled) {
      if (field.extractionRelevant) filledRelevantCount++;
      if (field.required) filledRequiredCount++;
      if (!field.extractionRelevant && !field.required) filledOtherCount++;
    }
  });
  
  // Weight the score toward extraction-relevant and required fields
  // Extraction-relevant: 50%, Required: 30%, Others: 20%
  const extractionRelevantWeight = 0.5;
  const requiredWeight = 0.3;
  const otherWeight = 0.2;
  
  const extractionRelevantScore = extractionRelevantFields.length > 0 
    ? (filledRelevantCount / extractionRelevantFields.length) * extractionRelevantWeight * 100
    : extractionRelevantWeight * 100;
    
  const requiredScore = requiredFields.length > 0 
    ? (filledRequiredCount / requiredFields.length) * requiredWeight * 100
    : requiredWeight * 100;
    
  const otherFieldsCount = totalFields - extractionRelevantFields.length - requiredFields.length;
  const otherScore = otherFieldsCount > 0 
    ? (filledOtherCount / otherFieldsCount) * otherWeight * 100
    : otherWeight * 100;
  
  // Calculate final score
  const score = Math.round(extractionRelevantScore + requiredScore + otherScore);
  
  return Math.min(100, score);
};

export default MetadataExtractor; 
import React, { useEffect, useState } from 'react';
import { FiInfo, FiEdit2, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { Document, updateDocumentMetadata } from '../../store/slices/documentsSlice';
import { useDispatch } from 'react-redux';
import { updateDocumentMetadata as updateMetadataAPI } from '../../api/documentsApi';

interface MetadataExtractorProps {
  document: Document;
  onClose?: () => void;
}

interface MetadataField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'tags' | 'select';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: (value: any) => string | null;
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
    type: 'text' | 'date' | 'number' | 'tags' | 'select';
  }>({ 
    key: '', 
    label: '', 
    type: 'text' 
  });

  // Automatically start metadata detection if none exists
  useEffect(() => {
    if (!document.metadata || Object.keys(document.metadata).length === 0) {
      detectMetadata();
    }
  }, [document.id]);

  // Standard metadata fields
  const standardMetadataFields: MetadataField[] = [
    { 
      key: 'title', 
      label: 'Title', 
      type: 'text', 
      required: true,
      validation: (value) => !value ? 'Title is required' : null
    },
    { 
      key: 'author', 
      label: 'Author', 
      type: 'text',
      validation: (value) => value && value.length < 2 ? 'Author name is too short' : null
    },
    { 
      key: 'datePublished', 
      label: 'Date Published', 
      type: 'date',
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
      options: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Other']
    },
    { 
      key: 'contentType', 
      label: 'Content Type', 
      type: 'text' 
    },
    { 
      key: 'pageCount', 
      label: 'Page Count', 
      type: 'number',
      validation: (value) => value && (isNaN(Number(value)) || Number(value) < 0) 
        ? 'Page count must be a positive number' 
        : null
    },
    { 
      key: 'wordCount', 
      label: 'Word Count', 
      type: 'number',
      validation: (value) => value && (isNaN(Number(value)) || Number(value) < 0) 
        ? 'Word count must be a positive number' 
        : null
    },
    { 
      key: 'keywords', 
      label: 'Keywords', 
      type: 'tags',
      validation: (value) => Array.isArray(value) && value.some(tag => tag.length > 50) 
        ? 'Keywords should be less than 50 characters each' 
        : null
    },
    { 
      key: 'description', 
      label: 'Description', 
      type: 'text',
      validation: (value) => value && value.length > 500 ? 'Description is too long (max 500 characters)' : null
    },
    {
      key: 'pii',
      label: 'Contains PII',
      type: 'select',
      options: ['Yes', 'No'],
      validation: (value) => value !== undefined && typeof value !== 'boolean' ? 'Value must be a boolean' : null
    },
    {
      key: 'securityClassification',
      label: 'Security Classification',
      type: 'select',
      options: ['N/A', 'Unclassified', 'Secret', 'Top Secret'],
      validation: (value) => value && !['N/A', 'Unclassified', 'Secret', 'Top Secret'].includes(value) 
        ? 'Invalid security classification' : null
    },
  ];

  // Get all fields (standard + custom)
  const allMetadataFields = [...standardMetadataFields, ...customFields];

  // Mock metadata detection with more sophisticated logic
  const detectMetadata = async () => {
    setDetectionStatus('detecting');
    setError(null);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate metadata based on document type
      const detectedMetadata = generateMetadataForDocument(document);
      
      // Update local state
      setMetadata(detectedMetadata);
      
      // Update Redux store
      dispatch(updateDocumentMetadata({ 
        id: document.id, 
        metadata: detectedMetadata 
      }));
      
      setDetectionStatus('complete');
    } catch (err) {
      console.error('Error detecting metadata:', err);
      setError('Failed to extract metadata. Please try again.');
      setDetectionStatus('error');
    }
  };

  // Enhanced mock metadata generator with more realistic detection
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
        break;
        
      case 'docx':
      case 'doc':
        generatedMetadata.pageCount = Math.floor(Math.random() * 30) + 1;
        generatedMetadata.author = findAuthorByPattern(fileName) || 'Unknown Author';
        generatedMetadata.contentType = 'Word Document';
        break;
        
      case 'txt':
        generatedMetadata.contentType = 'Plain Text';
        generatedMetadata.wordCount = Math.floor(Math.random() * 5000) + 100;
        break;
        
      case 'md':
        generatedMetadata.contentType = 'Markdown';
        generatedMetadata.wordCount = Math.floor(Math.random() * 3000) + 100;
        break;
        
      default:
        generatedMetadata.contentType = 'Unknown';
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

  // Function to detect if a document might contain PII
  const detectPII = (fileName: string): boolean => {
    // These patterns would suggest PII content
    const piiKeywords = [
      'personal', 'confidential', 'private', 'secret', 
      'ssn', 'social security', 'passport', 'license', 'id card',
      'address', 'phone', 'email', 'contact', 'medical', 'health',
      'financial', 'bank', 'credit', 'salary', 'tax', 'customer',
      'client', 'employee', 'personnel', 'user'
    ];
    
    const lowercaseName = fileName.toLowerCase();
    return piiKeywords.some(keyword => lowercaseName.includes(keyword));
  };

  // Function to determine security classification
  const detectSecurityClassification = (fileName: string, fileType: string): 'N/A' | 'Unclassified' | 'Secret' | 'Top Secret' => {
    const lowercaseName = fileName.toLowerCase();
    
    // Check for explicit classification in filename
    if (lowercaseName.includes('top secret') || lowercaseName.includes('topsecret')) {
      return 'Top Secret';
    }
    
    if (lowercaseName.includes('secret')) {
      return 'Secret';
    }
    
    if (lowercaseName.includes('unclassified')) {
      return 'Unclassified';
    }
    
    // Check content type and other signals that might indicate a higher security level
    const sensitiveKeywords = ['confidential', 'sensitive', 'private', 'internal', 'restricted'];
    if (sensitiveKeywords.some(keyword => lowercaseName.includes(keyword))) {
      return 'Secret';
    }
    
    // Default to N/A for most documents
    return 'N/A';
  };

  // Handle metadata field changes
  const handleMetadataChange = (field: string, value: any) => {
    // Clear validation error when field is modified
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = {...prev};
        delete updated[field];
        return updated;
      });
    }
    
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate all metadata fields
  const validateMetadata = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    allMetadataFields.forEach(field => {
      if (field.required && !metadata?.[field.key]) {
        errors[field.key] = `${field.label} is required`;
      } else if (field.validation && metadata?.[field.key]) {
        const error = field.validation(metadata[field.key]);
        if (error) errors[field.key] = error;
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
    
    // Add new custom field
    setCustomFields(prev => [
      ...prev, 
      { 
        ...newCustomField, 
        key 
      }
    ]);
    
    // Reset new field form
    setNewCustomField({ key: '', label: '', type: 'text' });
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

  // Render field based on type
  const renderField = (field: MetadataField) => {
    const value = metadata?.[field.key];
    const error = validationErrors[field.key];
    
    // Always show all fields, regardless of whether they have a value
    
    return (
      <div key={field.key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {isEditing ? (
          <>
            {field.key === 'pii' && (
              <select
                className={`input input-bordered w-full ${error ? 'border-red-500' : ''}`}
                value={value ? 'Yes' : 'No'}
                onChange={(e) => handleMetadataChange(field.key, e.target.value === 'Yes')}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            )}
            
            {field.type === 'tags' && field.key !== 'pii' && (
              <div>
                <input
                  type="text"
                  className={`input input-bordered w-full ${error ? 'border-red-500' : ''}`}
                  value={(value as string[] || []).join(', ')}
                  onChange={(e) => handleMetadataChange(
                    field.key, 
                    e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  )}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>
            )}
            
            {field.type === 'select' && field.key !== 'pii' && (
              <select
                className={`input input-bordered w-full ${error ? 'border-red-500' : ''}`}
                value={value || ''}
                onChange={(e) => handleMetadataChange(field.key, e.target.value)}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
            
            {(field.type === 'text' || field.type === 'date' || field.type === 'number') && (
              <input
                type={field.type}
                className={`input input-bordered w-full ${error ? 'border-red-500' : ''}`}
                value={value || ''}
                onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              />
            )}
            
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </>
        ) : (
          <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
            {field.type === 'tags' ? (
              <div className="flex flex-wrap gap-1">
                {(value as string[] || []).length > 0 ? (
                  (value as string[]).map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-[#182241] text-white text-xs rounded-full">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">No {field.label.toLowerCase()} specified</span>
                )}
              </div>
            ) : field.key === 'pii' ? (
              <p>{value ? 'Yes' : 'No'}</p>
            ) : (
              <p>{value || '-'}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
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
          {onClose && (
            <button 
              className="btn btn-sm btn-icon"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Status indicator */}
      {detectionStatus === 'detecting' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md text-blue-700 flex items-center">
          <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          Extracting metadata automatically...
        </div>
      )}
      
      {detectionStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 rounded-md text-red-700 flex items-center">
          <FiAlertCircle className="mr-2" size={18} />
          {error || 'Error extracting metadata.'}
          <button 
            className="ml-auto underline"
            onClick={detectMetadata}
          >
            Try Again
          </button>
        </div>
      )}
      
      {detectionStatus === 'complete' && (
        <div className="mb-4 p-3 bg-green-50 rounded-md text-green-700 flex items-center">
          <FiCheckCircle className="mr-2" size={18} />
          Metadata extracted successfully
        </div>
      )}
      
      {/* Error message */}
      {error && !isEditing && (
        <div className="mb-4 p-3 bg-red-50 rounded-md text-red-700 flex items-center">
          <FiAlertCircle className="mr-2" size={18} />
          {error}
        </div>
      )}
      
      {/* Standard metadata fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standardMetadataFields.map(field => renderField(field))}
      </div>
      
      {/* Custom metadata fields */}
      {customFields.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-4">Custom Metadata</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customFields.map(field => (
              <div key={field.key} className="relative">
                {renderField(field)}
                {isEditing && (
                  <button
                    className="absolute -top-1 -right-1 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm border border-gray-200"
                    onClick={() => handleRemoveCustomField(field.key)}
                    title="Remove field"
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add custom field form */}
      {isEditing && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <FiPlus size={16} className="mr-2" />
            Add Custom Metadata Field
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Label
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={newCustomField.label}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Publisher"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Key
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={newCustomField.key}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, key: e.target.value }))}
                placeholder="e.g., publisher"
              />
              <p className="text-xs text-gray-500 mt-1">Used for data storage</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <select
                className="input input-bordered w-full"
                value={newCustomField.type}
                onChange={(e) => setNewCustomField(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'text' | 'date' | 'number' | 'tags' | 'select'
                }))}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="tags">Tags</option>
              </select>
            </div>
          </div>
          
          <button
            className="btn btn-sm btn-outline"
            onClick={handleAddCustomField}
            disabled={!newCustomField.key || !newCustomField.label}
          >
            Add Field
          </button>
        </div>
      )}
      
      {/* Additional data quality indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-700 mb-2">Data Quality Indicators</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Content Quality</span>
              <span className="text-sm text-green-600">Good</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Metadata Completeness</span>
              <span className="text-sm text-blue-600">
                {calculateCompletenessScore(metadata, standardMetadataFields)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${calculateCompletenessScore(metadata, standardMetadataFields)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Extraction Confidence</span>
              <span className="text-sm text-green-600">High</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Calculate metadata completeness score based on filled fields
const calculateCompletenessScore = (
  metadata: Document['metadata'] | undefined, 
  fields: MetadataField[]
): number => {
  if (!metadata) return 0;
  
  const importantFields = fields.filter(field => 
    field.key !== 'keywords' && field.key !== 'description'
  );
  
  let filledCount = 0;
  importantFields.forEach(field => {
    if (metadata[field.key]) filledCount++;
  });
  
  return Math.round((filledCount / importantFields.length) * 100);
};

export default MetadataExtractor; 
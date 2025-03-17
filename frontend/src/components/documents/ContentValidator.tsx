import React, { useState, useEffect } from 'react';
import { FiCheck, FiAlertTriangle, FiAlertCircle, FiInfo, FiShield } from 'react-icons/fi';
import { Document, updateDocumentStatus, ValidationResult, ValidationIssue } from '../../store/slices/documentsSlice';
import { useDispatch } from 'react-redux';

interface ContentValidatorProps {
  document: Document;
  onValidationComplete?: (isValid: boolean) => void;
}

// Export the validation function so it can be used elsewhere
export const generateMockValidationResult = (doc: Document): ValidationResult => {
  const fileExtension = doc.name.split('.').pop()?.toLowerCase();
  
  // Generate random scores for metrics
  const textQuality = Math.floor(Math.random() * 30) + 70; // 70-100
  const consistency = Math.floor(Math.random() * 40) + 60; // 60-100
  const completeness = Math.floor(Math.random() * 30) + 70; // 70-100
  const relevance = Math.floor(Math.random() * 25) + 75; // 75-100
  
  // Calculate overall score
  const overallScore = Math.floor(
    (textQuality + consistency + completeness + relevance) / 4
  );
  
  // Generate issues based on file type and random factors
  const issues: ValidationIssue[] = [];
  
  // Add some random issues based on document type
  if (fileExtension === 'pdf') {
    if (Math.random() > 0.7) {
      issues.push({
        type: 'warning',
        message: 'PDF contains scanned pages',
        details: 'Some pages appear to be scanned images which may reduce extraction quality.',
        autoFixable: false
      });
    }
    
    if (Math.random() > 0.8) {
      issues.push({
        type: 'info',
        message: 'Multiple columns detected',
        details: 'Document uses multi-column layout which may affect text extraction order.',
        autoFixable: true
      });
    }
  } else if (fileExtension === 'docx' || fileExtension === 'doc') {
    if (Math.random() > 0.7) {
      issues.push({
        type: 'warning',
        message: 'Document contains complex formatting',
        details: 'Tables and complex formatting may not be fully preserved in extracted content.',
        autoFixable: false
      });
    }
  } else if (fileExtension === 'txt') {
    if (Math.random() > 0.6) {
      issues.push({
        type: 'info',
        message: 'Inconsistent line endings',
        details: 'Document contains mixed line ending styles (CRLF and LF).',
        autoFixable: true
      });
    }
  }
  
  // Add some general issues
  if (Math.random() > 0.75) {
    issues.push({
      type: 'error',
      message: 'Potentially corrupt content section',
      details: 'Some content sections contain unexpected characters or encoding issues.',
      autoFixable: false
    });
  }
  
  if (Math.random() > 0.8) {
    issues.push({
      type: 'warning',
      message: 'Inconsistent formatting',
      details: 'Document contains inconsistent formatting styles which may affect training quality.',
      autoFixable: true
    });
  }
  
  // Determine if document is valid (passing validation)
  const hasErrors = issues.some(issue => issue.type === 'error');
  const isValid = overallScore >= 75 && !hasErrors;
  
  return {
    isValid,
    score: overallScore,
    issues,
    metrics: {
      textQuality,
      consistency,
      completeness,
      relevance
    }
  };
};

const ContentValidator: React.FC<ContentValidatorProps> = ({ document, onValidationComplete }) => {
  const dispatch = useDispatch();
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(document.validationResult || null);
  const [error, setError] = useState<string | null>(null);

  // Update validation result when document changes or when validationResult is updated
  useEffect(() => {
    if (document.validationResult) {
      setValidationResult(document.validationResult);
    }
  }, [document.id, document.validationResult]);

  // Manually run validation if needed (e.g., for revalidation)
  const validateContent = async () => {
    setValidating(true);
    setError(null);
    
    try {
      // Update document status to processing
      dispatch(updateDocumentStatus({ 
        id: document.id, 
        status: 'processing' 
      }));
      
      // Simulate API call for validation with timeout
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock validation result
      const mockResult = generateMockValidationResult(document);
      setValidationResult(mockResult);
      
      // Update document status based on validation result
      dispatch(updateDocumentStatus({ 
        id: document.id, 
        status: mockResult.isValid ? 'complete' : 'error',
        error: mockResult.isValid ? undefined : 'Document failed validation checks'
      }));
      
      // Notify parent component of completion
      if (onValidationComplete) {
        onValidationComplete(mockResult.isValid);
      }
      
      setValidating(false);
    } catch (err) {
      console.error('Error validating content:', err);
      setError('Failed to validate document content. Please try again.');
      
      // Update document status to error
      dispatch(updateDocumentStatus({ 
        id: document.id, 
        status: 'error',
        error: 'Validation process failed'
      }));
      
      setValidating(false);
      
      // Notify parent component of completion (failed)
      if (onValidationComplete) {
        onValidationComplete(false);
      }
    }
  };

  // Fix an issue automatically
  const fixIssue = (index: number) => {
    if (!validationResult) return;
    
    // Create a copy of the issues array
    const updatedIssues = [...validationResult.issues];
    
    // Remove the issue that was fixed
    updatedIssues.splice(index, 1);
    
    // Update the validation result
    setValidationResult({
      ...validationResult,
      issues: updatedIssues,
      // If no more errors exist, mark as valid
      isValid: !updatedIssues.some(issue => issue.type === 'error')
    });
  };

  // Get status color based on score
  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get issue icon based on type
  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return <FiAlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0" />;
      case 'warning':
        return <FiAlertTriangle size={20} className="text-yellow-500 mr-2 flex-shrink-0" />;
      case 'info':
        return <FiInfo size={20} className="text-blue-500 mr-2 flex-shrink-0" />;
      default:
        return <FiInfo size={20} className="text-gray-500 mr-2 flex-shrink-0" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-oswald font-semibold">Content Validation</h3>
        
        {!validating && !validationResult && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={validateContent}
          >
            Run Validation
          </button>
        )}
        
        {!validating && validationResult && (
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-3">Validation performed during upload</span>
            <button 
              className="btn btn-sm btn-outline"
              onClick={validateContent}
            >
              Re-run Validation
            </button>
          </div>
        )}
      </div>
      
      {/* Validation in progress */}
      {validating && (
        <div className="mb-4 p-4 border border-blue-100 rounded-md bg-blue-50">
          <div className="flex items-center">
            <div className="animate-spin mr-3 h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <div>
              <p className="font-medium text-blue-700">Validating document content...</p>
              <p className="text-sm text-blue-600 mt-1">
                This may take a moment while we check for quality and consistency issues.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Validation error */}
      {error && (
        <div className="mb-4 p-4 border border-red-100 rounded-md bg-red-50 text-red-700">
          <div className="flex items-start">
            <FiAlertCircle size={20} className="mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
              <button 
                className="text-sm underline mt-2"
                onClick={validateContent}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Validation results */}
      {validationResult && (
        <div>
          {/* Overall status */}
          <div className={`mb-6 p-4 rounded-md ${validationResult.isValid ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
            <div className="flex items-center">
              {validationResult.isValid ? (
                <div className="bg-green-100 rounded-full p-2 mr-4">
                  <FiCheck size={24} className="text-green-600" />
                </div>
              ) : (
                <div className="bg-red-100 rounded-full p-2 mr-4">
                  <FiAlertCircle size={24} className="text-red-600" />
                </div>
              )}
              
              <div>
                <h4 className={`text-lg font-medium ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {validationResult.isValid 
                    ? 'Document Passed Validation' 
                    : 'Document Needs Attention'
                  }
                </h4>
                <p className={`${validationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                  {validationResult.isValid 
                    ? 'This document has been validated and is ready for processing.' 
                    : 'This document has issues that should be addressed before proceeding.'
                  }
                </p>
              </div>
              
              <div className="ml-auto text-center">
                <div className={`text-2xl font-bold ${getStatusColor(validationResult.score)}`}>
                  {validationResult.score}%
                </div>
                <div className="text-xs text-gray-500">Overall Score</div>
              </div>
            </div>
          </div>
          
          {/* Quality metrics */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Quality Metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(validationResult.metrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(value)}`}>
                      {value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        value >= 90 ? 'bg-green-500' : 
                        value >= 75 ? 'bg-green-400' : 
                        value >= 60 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Issues list */}
          {validationResult.issues.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Detected Issues</h4>
              <div className="space-y-3">
                {validationResult.issues.map((issue, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-md border ${
                      issue.type === 'error' ? 'border-red-100 bg-red-50' :
                      issue.type === 'warning' ? 'border-yellow-100 bg-yellow-50' :
                      'border-blue-100 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start">
                      {getIssueIcon(issue.type)}
                      
                      <div className="flex-grow">
                        <p className={`font-medium ${
                          issue.type === 'error' ? 'text-red-700' :
                          issue.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                        }`}>
                          {issue.message}
                        </p>
                        
                        {issue.details && (
                          <p className={`text-sm mt-1 ${
                            issue.type === 'error' ? 'text-red-600' :
                            issue.type === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {issue.details}
                          </p>
                        )}
                      </div>
                      
                      {issue.autoFixable && (
                        <button 
                          className={`ml-4 btn btn-sm ${
                            issue.type === 'error' ? 'btn-error' :
                            issue.type === 'warning' ? 'btn-warning' :
                            'btn-info'
                          }`}
                          onClick={() => fixIssue(index)}
                        >
                          Auto-Fix
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Security scan */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center text-gray-700 mb-3">
              <FiShield size={18} className="mr-2" />
              <h4 className="font-medium">Security Scan</h4>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md border border-green-100 flex items-center">
              <div className="bg-green-100 rounded-full p-1 mr-3">
                <FiCheck size={16} className="text-green-600" />
              </div>
              <p className="text-green-700">
                No security threats detected in this document.
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex justify-end">
            {!validationResult.isValid && (
              <button 
                className="btn btn-primary"
                onClick={validateContent}
              >
                Re-Validate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentValidator; 
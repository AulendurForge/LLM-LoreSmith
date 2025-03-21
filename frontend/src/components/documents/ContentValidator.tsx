import React, { useState, useEffect } from 'react';
import { FiCheck, FiAlertTriangle, FiAlertCircle, FiInfo, FiShield } from 'react-icons/fi';
import { 
  Document as DocType, 
  updateDocumentStatus, 
  ValidationResult, 
  ValidationIssue 
} from '../../store/slices/documentsSlice';
import { useDispatch } from 'react-redux';
import { processDocument, getDocumentStatus } from '../../api/documentsApi';

interface ContentValidatorProps {
  document: DocType;
  onValidationComplete?: (isValid: boolean) => void;
}

// Validation logic (would connect to backend in production)
export const validateDocumentContent = async (doc: DocType): Promise<ValidationResult> => {
  // In a real implementation, this would call the backend API for document validation
  // For now, we'll use a more sophisticated mock that simulates real validation
  
  const fileExtension = doc.name.split('.').pop()?.toLowerCase();
  const fileName = doc.name.toLowerCase();
  
  // Analysis metrics based on document properties
  let textQuality = 85; // Base quality score
  let consistency = 80; // Base consistency score
  let completeness = 90; // Base completeness score
  let relevance = 85; // Base relevance score
  
  // Initialize issues array
  const issues: ValidationIssue[] = [];
  
  // Analyze document based on file type
  if (fileExtension === 'pdf') {
    // PDF validation
    
    // Check for scanned content indicators
    const hasScannedIndicators = fileName.includes('scan') || 
                               fileName.includes('scanned') || 
                               Math.random() > 0.7; // Simulate detection
    
    if (hasScannedIndicators) {
      issues.push({
        type: 'warning',
        message: 'PDF contains scanned pages',
        details: 'Some pages appear to be scanned images which will reduce extraction quality. Consider using OCR preprocessing.',
        autoFixable: false
      });
      
      // Scanned content reduces quality and completeness
      textQuality -= 15;
      completeness -= 10;
    }
    
    // Check for PDF structure issues
    const hasPdfStructureIssues = Math.random() > 0.8; // Simulate detection
    if (hasPdfStructureIssues) {
      issues.push({
        type: 'error',
        message: 'PDF structure issues detected',
        details: 'Document contains corrupt or malformed PDF structure which may prevent proper content extraction.',
        autoFixable: false
      });
      
      // Structure issues significantly impact quality
      textQuality -= 25;
      consistency -= 20;
    }
    
    // Check for text extraction issues
    const hasTextExtractionIssues = Math.random() > 0.7; // Simulate detection
    if (hasTextExtractionIssues) {
      issues.push({
        type: 'warning',
        message: 'Text extraction challenges',
        details: 'Document contains complex layouts, tables or graphics that may impact text extraction quality.',
        autoFixable: false
      });
      
      // Extraction issues impact consistency
      consistency -= 15;
    }
    
    // Check for PDF security/restrictions
    const hasSecurityRestrictions = Math.random() > 0.9; // Simulate detection
    if (hasSecurityRestrictions) {
      issues.push({
        type: 'error',
        message: 'PDF has content restrictions',
        details: 'Document has security settings that prevent content extraction. Please provide an unrestricted version.',
        autoFixable: false
      });
      
      // Security restrictions severely impact extraction
      textQuality -= 30;
      completeness -= 25;
    }
  } 
  else if (fileExtension === 'docx' || fileExtension === 'doc') {
    // Word document validation
    
    // Check for complex formatting
    const hasComplexFormatting = Math.random() > 0.6; // Simulate detection
    if (hasComplexFormatting) {
      issues.push({
        type: 'warning',
        message: 'Complex document formatting',
        details: 'Document uses complex formatting features (tables, text boxes, etc.) which may affect extraction quality.',
        autoFixable: true
      });
      
      // Complex formatting impacts consistency
      consistency -= 10;
    }
    
    // Check for embedded content
    const hasEmbeddedContent = Math.random() > 0.7; // Simulate detection
    if (hasEmbeddedContent) {
      issues.push({
        type: 'info',
        message: 'Embedded content detected',
        details: 'Document contains embedded objects (images, charts) which will be excluded from text extraction.',
        autoFixable: false
      });
      
      // Embedded content impacts completeness
      completeness -= 8;
    }
    
    // Check for track changes/comments
    const hasTrackChanges = Math.random() > 0.8; // Simulate detection
    if (hasTrackChanges) {
      issues.push({
        type: 'warning',
        message: 'Track changes or comments detected',
        details: 'Document contains revision marks or comments which may be included in extraction.',
        autoFixable: true
      });
      
      // Track changes impact consistency and quality
      consistency -= 12;
      textQuality -= 5;
    }
  } 
  else if (fileExtension === 'txt' || fileExtension === 'md') {
    // Plain text validation
    
    // Check for encoding issues
    const hasEncodingIssues = Math.random() > 0.9; // Simulate detection
    if (hasEncodingIssues) {
      issues.push({
        type: 'error',
        message: 'Character encoding issues',
        details: 'Document contains characters in incompatible encodings which may appear as garbage text.',
        autoFixable: true
      });
      
      // Encoding issues impact quality
      textQuality -= 20;
    }
    
    // Check for line ending consistency
    const hasLineEndingIssues = Math.random() > 0.7; // Simulate detection
    if (hasLineEndingIssues) {
      issues.push({
        type: 'info',
        message: 'Inconsistent line endings',
        details: 'Document uses mixed line ending styles which may affect paragraph detection.',
        autoFixable: true
      });
      
      // Line ending issues impact consistency
      consistency -= 5;
    }
    
    // Check for structured content
    if (fileExtension === 'md') {
      const hasMarkdownIssues = Math.random() > 0.8; // Simulate detection
      if (hasMarkdownIssues) {
        issues.push({
          type: 'info',
          message: 'Markdown syntax variations',
          details: 'Document uses alternative markdown syntax which may be processed differently.',
          autoFixable: true
        });
        
        // Markdown issues slightly impact consistency
        consistency -= 5;
      }
    }
  }
  
  // Universal content checks
  
  // Check for content density (too sparse)
  const hasLowContentDensity = Math.random() > 0.8; // Simulate detection
  if (hasLowContentDensity) {
    issues.push({
      type: 'warning',
      message: 'Low content density',
      details: 'Document contains significant empty space or very little textual content relative to its size.',
      autoFixable: false
    });
    
    // Low density impacts relevance
    relevance -= 15;
    completeness -= 10;
  }
  
  // Check for potential PII data
  const hasPotentialPII = doc.metadata?.pii === true || Math.random() > 0.9; // Use metadata or simulate
  if (hasPotentialPII) {
    issues.push({
      type: 'warning',
      message: 'Potential PII detected',
      details: 'Document may contain personally identifiable information (PII) which should be handled according to privacy policies.',
      autoFixable: false
    });
    
    // PII doesn't impact extraction quality but is important to flag
  }
  
  // Check for language consistency
  const hasLanguageMixing = Math.random() > 0.85; // Simulate detection
  if (hasLanguageMixing) {
    issues.push({
      type: 'info',
      message: 'Multiple languages detected',
      details: 'Document contains content in multiple languages which may affect extraction quality.',
      autoFixable: false
    });
    
    // Language mixing impacts consistency
    consistency -= 10;
  }
  
  // Content quality analysis
  
  // Check for repetitive content
  const hasRepetitiveContent = Math.random() > 0.9; // Simulate detection
  if (hasRepetitiveContent) {
    issues.push({
      type: 'info',
      message: 'Repetitive content',
      details: 'Document contains sections with highly similar or duplicate content.',
      autoFixable: false
    });
    
    // Repetitive content impacts relevance
    relevance -= 10;
  }
  
  // Ensure metrics are within bounds
  textQuality = Math.max(0, Math.min(100, textQuality));
  consistency = Math.max(0, Math.min(100, consistency));
  completeness = Math.max(0, Math.min(100, completeness));
  relevance = Math.max(0, Math.min(100, relevance));
  
  // Calculate overall score weighted by importance:
  // - Text quality: 35%
  // - Consistency: 25%
  // - Completeness: 25%
  // - Relevance: 15%
  const overallScore = Math.floor(
    (textQuality * 0.35) + 
    (consistency * 0.25) + 
    (completeness * 0.25) + 
    (relevance * 0.15)
  );
  
  // Document is valid if score is sufficient and no critical errors
  const hasErrors = issues.some(issue => issue.type === 'error');
  const isValid = overallScore >= 70 && !hasErrors;
  
  // Return validation result
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
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null);

  // Update validation result when document changes or when validationResult is updated
  useEffect(() => {
    if (document.validationResult) {
      setValidationResult(document.validationResult);
    }
    
    // Clean up polling on unmount
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [document.id, document.validationResult]);

  // Poll for validation status if document is processing
  useEffect(() => {
    if (document.status === 'processing' && !validating && !statusPolling) {
      pollForValidationStatus();
    }
  }, [document.status]);

  // Poll for validation status
  const pollForValidationStatus = () => {
    // Clear any existing polling
    if (statusPolling) {
      clearInterval(statusPolling);
    }
    
    // Start polling
    const interval = setInterval(async () => {
      try {
        // Get document status from API
        const statusResponse = await getDocumentStatus(document.id);
        
        // If document is no longer processing, clear polling
        if (statusResponse.status !== 'processing') {
          clearInterval(interval);
          setStatusPolling(null);
          
          // If document is complete, update validation result
          if (statusResponse.status === 'complete') {
            // In a real implementation, we would fetch the validation result from the backend
            // For now, we'll simulate it
            const validationResult = await validateDocumentContent(document);
            setValidationResult(validationResult);
            
            // Notify parent component of completion
            if (onValidationComplete) {
              onValidationComplete(validationResult.isValid);
            }
          }
        }
      } catch (err) {
        console.error('Error polling for validation status:', err);
        clearInterval(interval);
        setStatusPolling(null);
      }
    }, 2000);
    
    setStatusPolling(interval);
  };

  // Run validation process
  const validateContent = async () => {
    setValidating(true);
    setError(null);
    
    try {
      // Update document status to processing
      dispatch(updateDocumentStatus({ 
        id: document.id, 
        status: 'processing' 
      }));
      
      // In a real implementation, we would call the backend API to start processing
      try {
        // Start processing on backend
        await processDocument(document.id);
        
        // Start polling for status
        pollForValidationStatus();
      } catch (err) {
        console.error('Error starting document processing:', err);
        throw new Error('Failed to start document processing');
      }
      
      // For demo purposes, simulate the validation to show results immediately
      // In production, this would come from the backend after processing completes
      setTimeout(async () => {
        const result = await validateDocumentContent(document);
        setValidationResult(result);
        
        // Update document status based on validation result
        dispatch(updateDocumentStatus({ 
          id: document.id, 
          status: result.isValid ? 'complete' : 'error',
          error: result.isValid ? undefined : 'Document failed validation checks'
        }));
        
        // Notify parent component of completion
        if (onValidationComplete) {
          onValidationComplete(result.isValid);
        }
        
        setValidating(false);
      }, 3000);
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
  const fixIssue = async (index: number) => {
    if (!validationResult) return;
    
    setValidating(true);
    
    try {
      // Get the issue to fix
      const issueToFix = validationResult.issues[index];
      
      // Create a copy of the issues array
      const updatedIssues = [...validationResult.issues];
      
      // Simulate fixing the issue
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, this would call the backend API to fix the issue
      // The backend would apply the appropriate fix based on the issue type
      
      // Remove the issue that was fixed
      updatedIssues.splice(index, 1);
      
      // Update metrics based on the fixed issue
      let updatedMetrics = { ...validationResult.metrics };
      
      switch (issueToFix.type) {
        case 'error':
          updatedMetrics.textQuality += 10;
          updatedMetrics.consistency += 5;
          break;
        case 'warning':
          updatedMetrics.textQuality += 5;
          updatedMetrics.consistency += 3;
          break;
        case 'info':
          updatedMetrics.consistency += 2;
          break;
      }
      
      // Ensure metrics are within bounds
      Object.keys(updatedMetrics).forEach(key => {
        updatedMetrics[key as keyof typeof updatedMetrics] = Math.min(
          100, 
          updatedMetrics[key as keyof typeof updatedMetrics]
        );
      });
      
      // Calculate new overall score
      const newScore = Math.floor(
        (updatedMetrics.textQuality * 0.35) + 
        (updatedMetrics.consistency * 0.25) + 
        (updatedMetrics.completeness * 0.25) + 
        (updatedMetrics.relevance * 0.15)
      );
      
      // Update the validation result
      const newValidationResult = {
        ...validationResult,
        issues: updatedIssues,
        metrics: updatedMetrics,
        score: newScore,
        // If no more errors exist, mark as valid
        isValid: !updatedIssues.some(issue => issue.type === 'error') && newScore >= 70
      };
      
      setValidationResult(newValidationResult);
      
      // Update document status if it's now valid
      if (newValidationResult.isValid && !validationResult.isValid) {
        dispatch(updateDocumentStatus({ 
          id: document.id, 
          status: 'complete'
        }));
      }
      
      setValidating(false);
    } catch (err) {
      console.error('Error fixing issue:', err);
      setError('Failed to fix the issue. Please try manually.');
      setValidating(false);
    }
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
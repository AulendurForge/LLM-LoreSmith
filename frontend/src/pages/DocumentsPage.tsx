import React, { useState, useCallback, useEffect } from 'react';
import { FiUpload, FiFile, FiTrash2, FiInfo, FiFilter, FiCheck, FiX, FiSearch, FiEye, FiList, FiGrid, FiTag, FiUploadCloud, FiCheckCircle, FiAlertCircle, FiFileText, FiCheckSquare, FiFolder } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { 
  Document as DocType, 
  addDocument,
  removeDocument,
  updateDocumentProgress,
  updateDocumentStatus,
  updateDocumentValidation,
  selectDocument
} from '../store/slices/documentsSlice';
import MetadataExtractor from '../components/documents/MetadataExtractor';
import DocumentPreview from '../components/documents/DocumentPreview';
import ContentValidator, { generateMockValidationResult } from '../components/documents/ContentValidator';
import DuplicateDetector from '../components/documents/DuplicateDetector';
import RecentlyViewed from '../components/RecentlyViewed';
import TagManager from '../components/documents/TagManager';
import CategoryManager from '../components/documents/CategoryManager';
import DocumentTags from '../components/documents/DocumentTags';
import { RootState } from '../store';

// Component for uploading and displaying documents
const DocumentsPage: React.FC = () => {
  console.log('DocumentsPage rendering');
  
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.documents.documents || []);
  const selectedDocumentId = useSelector((state: RootState) => state.documents.selectedDocumentId || null);
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId) || null;
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<{[key: string]: string}>({});
  const [activeView, setActiveView] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'metadata' | 'validation' | 'preview' | 'tags' | 'categories'>('metadata');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [isDuplicateCheckOpen, setIsDuplicateCheckOpen] = useState<boolean>(false);

  // Error catch effect
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Caught runtime error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If there's an error rendering, show a fallback
  if (hasError) {
    return (
      <div className="section">
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">
            There was an error loading the documents page. This might be due to a temporary issue.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setHasError(false)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate batch progress
  useEffect(() => {
    if (Object.keys(uploadProgress).length === 0) {
      setBatchProgress(0);
      return;
    }
    
    const total = Object.values(uploadProgress).reduce((sum: number, progress: number) => sum + progress, 0);
    const average = total / Object.keys(uploadProgress).length;
    setBatchProgress(average);
  }, [uploadProgress]);

  // Remove document from progress tracking when upload completes
  useEffect(() => {
    const progressEntries = Object.entries(uploadProgress);
    for (const [docId, progress] of progressEntries) {
      if (progress === 100) {
        // Wait a bit before removing from progress tracker to show completion
        setTimeout(() => {
          setUploadProgress(prev => {
            const newState = { ...prev };
            delete newState[docId];
            return newState;
          });
        }, 3000);
      }
    }
  }, [uploadProgress]);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Clear previous errors
    setUploadErrors({});
    
    // Process each file
    acceptedFiles.forEach(file => {
      // Validate file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        setUploadErrors(prev => ({
          ...prev,
          [file.name]: 'File exceeds the 20MB size limit'
        }));
        return;
      }
      
      const id = uuidv4();
      
      // Create a new document
      const newDoc: DocType = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'uploading' as const,
        progress: 0,
        metadata: {
          contentType: file.type,
          title: file.name.split('.')[0], // Default title from filename
        }
      };
      
      // Add to upload progress tracking
      setUploadProgress(prev => ({
        ...prev,
        [id]: 0
      }));

      // Add to Redux store
      dispatch(addDocument(newDoc));
      
      // Simulate file upload with progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update document status when upload completes
          dispatch(updateDocumentProgress({ 
            id, 
            progress: 100
          }));
          
          // Update document status separately
          setTimeout(() => {
            const updatedDoc = documents.find(d => d.id === id);
            if (updatedDoc) {
              dispatch(addDocument({
                ...updatedDoc,
                status: 'processing' as const
              }));
              
              // Perform content validation once upload is complete
              setTimeout(() => {
                // Generate validation result
                const validationResult = generateMockValidationResult(updatedDoc);
                
                // Store validation result in document
                dispatch(updateDocumentValidation({
                  id,
                  validationResult
                }));
                
                // Update document status based on validation result
                dispatch(updateDocumentStatus({
                  id,
                  status: validationResult.isValid ? 'complete' : 'error',
                  error: validationResult.isValid ? undefined : 'Document failed validation checks'
                }));
                
                // Also update the document in the store with the validationResult
                const docWithValidation = {
                  ...updatedDoc,
                  validationResult,
                  status: validationResult.isValid ? 'complete' as const : 'error' as const,
                  error: validationResult.isValid ? undefined : 'Document failed validation checks'
                };
                
                dispatch(addDocument(docWithValidation));
                
              }, 2000); // Simulate validation delay
            }
          }, 100);
          
          // Select the newly uploaded document
          dispatch(selectDocument(id));
          
          // Show duplicate detection for the first uploaded document if multiple
          if (acceptedFiles.length === 1 || (acceptedFiles[0] === file)) {
            setIsDuplicateCheckOpen(true);
          }
        }
        
        setUploadProgress(prev => ({
          ...prev,
          [id]: progress
        }));
        
        dispatch(updateDocumentProgress({ 
          id, 
          progress: Math.round(progress)
        }));
      }, 500);
    });
  }, [dispatch, documents]);

  // Filter documents based on search term
  const filteredDocuments = documents.filter((doc: DocType) => {
    if (!searchTerm) return true;
    
    // Search by name
    if (doc.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true;
    }
    
    // Search by metadata
    if (doc.metadata) {
      const metaValues = Object.values(doc.metadata).filter(v => v);
      for (const value of metaValues) {
        if (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true;
        }
      }
    }
    
    // Search by tags
    if (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return true;
    }
    
    // Search by category
    if (doc.category && doc.category.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true;
    }
    
    return false;
  });

  // Handle document selection
  const handleSelectDocument = (id: string) => {
    dispatch(selectDocument(id));
    setShowDetailPanel(true);
  };

  // Remove a document from the list
  const handleRemoveDocument = (id: string) => {
    dispatch(removeDocument(id));
    
    // Close detail panel if the selected document is removed
    if (selectedDocumentId === id) {
      setShowDetailPanel(false);
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Determine document type icon color
  const getDocumentColor = (type: string) => {
    if (type.includes('pdf')) return 'bg-red-600';
    if (type.includes('word') || type.includes('doc')) return 'bg-blue-600';
    if (type.includes('text') || type.includes('txt')) return 'bg-gray-600';
    if (type.includes('markdown') || type.includes('md')) return 'bg-purple-600';
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return 'bg-green-600';
    return 'bg-[#182241]';
  };

  // Get status badge based on document status
  const getStatusBadge = (doc: DocType) => {
    switch(doc.status) {
      case 'uploading':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Uploading
          </span>
        );
      case 'uploaded':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Uploaded
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            Processing
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Error
          </span>
        );
      case 'complete':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Complete
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[95%] mx-auto px-2 py-6">
      <h1 className="text-3xl font-oswald font-bold mb-6">Document Management</h1>
      
      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left column - Documents List */}
        <div className="w-full lg:w-[58%]">
          {/* Document upload UI */}
          <div className="mb-4">
            <div
              {...getRootProps()}
              className={`p-3 border-2 border-dashed ${isDragActive ? 'border-[#182241] bg-[#182241]/5' : 'border-gray-300'} rounded-lg text-center cursor-pointer transition-colors mb-4`}
            >
              <input {...getInputProps()} />
              <FiUploadCloud className="mx-auto text-gray-400 mb-2" size={36} />
              <p className="text-gray-600 mb-1">
                Drag & drop documents here, or <span className="text-[#182241] font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF, DOCX, TXT, MD, CSV, and more (up to 50MB)
              </p>
            </div>
          </div>
          
          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mb-4 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-medium">Uploading {Object.keys(uploadProgress).length} document(s)</h3>
                <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#182241] h-full rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(batchProgress)}%</p>
              </div>
              
              <div className="max-h-48 overflow-y-auto p-2">
                {Object.entries(uploadProgress).map(([docId, progress]) => {
                  const doc = documents.find(d => d.id === docId);
                  const error = uploadErrors[docId];
                  
                  return (
                    <div key={docId} className="py-2 px-3 hover:bg-gray-50">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <FiFile className="text-gray-400 mr-2" size={14} />
                          <span className="text-sm truncate max-w-xs">{doc?.name}</span>
                        </div>
                        <span className="text-xs font-medium">
                          {progress < 100 
                            ? `${Math.round(progress)}%` 
                            : error 
                              ? <span className="text-red-500">Error</span>
                              : <span className="text-green-500">Complete</span>
                          }
                        </span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            error ? 'bg-red-500' : progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      {error && (
                        <p className="text-xs text-red-500 mt-1">{error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Recently Viewed Documents */}
          <div className="mb-6">
            <RecentlyViewed document={selectedDocument || undefined} maxItems={5} />
          </div>
          
          {/* Search and filter bar */}
          <div className="flex items-center mb-4 gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#182241] focus:border-[#182241]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FiFilter size={20} className="text-gray-600" />
            </button>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button 
                className={`p-2 ${activeView === 'list' ? 'bg-[#182241] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveView('list')}
                aria-label="List view"
              >
                <FiList size={20} />
              </button>
              <button 
                className={`p-2 ${activeView === 'grid' ? 'bg-[#182241] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveView('grid')}
                aria-label="Grid view"
              >
                <FiGrid size={20} />
              </button>
            </div>
          </div>
          
          {/* Document list */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-oswald font-bold">Uploaded Documents</h2>
                <p className="text-sm text-gray-500">
                  {filteredDocuments.length} of {documents.length} documents
                </p>
              </div>
              
              {filteredDocuments.length === 0 && searchTerm && (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                  <FiSearch className="mx-auto mb-3 text-gray-400" size={24} />
                  <p className="text-gray-700">No documents match your search term.</p>
                </div>
              )}
              
              {documents.length === 0 && !searchTerm && (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                  <FiFile className="mx-auto mb-3 text-gray-400" size={24} />
                  <p className="text-gray-700">No documents yet</p>
                </div>
              )}
              
              {filteredDocuments.length > 0 && activeView === 'list' ? (
                <div className="card">
                  <ul className="divide-y divide-gray-200">
                    {filteredDocuments.map((doc: DocType) => (
                      <li 
                        key={doc.id} 
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedDocumentId === doc.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectDocument(doc.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                              <FiFile className="text-[#182241]" size={20} />
                            </div>
                            <div>
                              <h3 className="font-medium">{doc.name}</h3>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                <span className="mx-1">•</span>
                                <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                
                                {doc.status === 'processing' && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span className="text-orange-500">Processing</span>
                                  </>
                                )}
                                
                                {doc.status === 'error' && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span className="text-red-500">Error</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Display document tags */}
                              {doc.tags && doc.tags.length > 0 && (
                                <DocumentTags tags={doc.tags} className="mt-2" />
                              )}
                              
                              {/* Display document category */}
                              {doc.category && (
                                <div className="mt-2 flex items-center">
                                  <div className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded flex items-center">
                                    <FiFolder className="mr-1" size={10} />
                                    {doc.category}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            className="p-2 text-gray-500 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDocument(doc.id);
                            }}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredDocuments.map((doc: DocType) => (
                    <div 
                      key={doc.id} 
                      className={`border rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors ${selectedDocumentId === doc.id ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => handleSelectDocument(doc.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FiFile className="text-[#182241]" size={20} />
                        </div>
                        <button
                          className="p-1 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDocument(doc.id);
                          }}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <h3 className="font-medium mb-1 truncate">{doc.name}</h3>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        <span className="mx-1">•</span>
                        <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      
                      {/* Display document tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <DocumentTags tags={doc.tags} className="mt-2" />
                      )}
                      
                      {/* Display document category */}
                      {doc.category && (
                        <div className="mt-2 flex items-center">
                          <div className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded flex items-center">
                            <FiFolder className="mr-1" size={10} />
                            {doc.category}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Right column - Document Details */}
        <div className="w-full lg:w-[42%]">
          <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
            {selectedDocument ? (
              <div className="flex flex-col h-full">
                {/* Document header */}
                <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-2">
                      <FiFile className="text-[#182241]" size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm truncate max-w-xs">{selectedDocument.name}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <span>{new Date(selectedDocument.uploadedAt).toLocaleDateString()}</span>
                        <span className="mx-1">•</span>
                        <span>{(selectedDocument.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="p-2 text-gray-500 hover:text-red-500"
                    onClick={() => handleRemoveDocument(selectedDocument.id)}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
                
                {/* Tab navigation */}
                <div className="flex border-b border-gray-200">
                  <button
                    className={`px-2 py-1.5 text-sm font-medium ${activeTab === 'metadata' ? 'border-b-2 border-[#182241] text-[#182241]' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('metadata')}
                  >
                    <FiInfo size={12} className="inline mr-1" />
                    Metadata
                  </button>
                  <button
                    className={`px-2 py-1.5 text-sm font-medium ${activeTab === 'validation' ? 'border-b-2 border-[#182241] text-[#182241]' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('validation')}
                  >
                    <FiCheckSquare size={12} className="inline mr-1" />
                    Validation
                  </button>
                  <button
                    className={`px-2 py-1.5 text-sm font-medium ${activeTab === 'preview' ? 'border-b-2 border-[#182241] text-[#182241]' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    <FiEye size={12} className="inline mr-1" />
                    Preview
                  </button>
                  <button
                    className={`px-2 py-1.5 text-sm font-medium ${activeTab === 'tags' ? 'border-b-2 border-[#182241] text-[#182241]' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('tags')}
                  >
                    <FiTag size={12} className="inline mr-1" />
                    Tags
                  </button>
                  <button
                    className={`px-2 py-1.5 text-sm font-medium ${activeTab === 'categories' ? 'border-b-2 border-[#182241] text-[#182241]' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('categories')}
                  >
                    <FiFolder size={12} className="inline mr-1" />
                    Categories
                  </button>
                </div>
                
                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === 'metadata' && (
                    <MetadataExtractor document={selectedDocument} />
                  )}
                  
                  {activeTab === 'validation' && (
                    <ContentValidator document={selectedDocument} />
                  )}
                  
                  {activeTab === 'preview' && (
                    <DocumentPreview document={selectedDocument} />
                  )}
                  
                  {activeTab === 'tags' && (
                    <TagManager documentId={selectedDocument.id} />
                  )}
                  
                  {activeTab === 'categories' && (
                    <CategoryManager documentId={selectedDocument.id} />
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center">
                <div>
                  <FiFile className="mx-auto text-gray-300 mb-3" size={48} />
                  <h3 className="text-xl font-medium text-gray-500 mb-1">No Document Selected</h3>
                  <p className="text-gray-400">
                    Select a document from the list to view its details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Duplicate Check Dialog */}
      {isDuplicateCheckOpen && selectedDocument && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={(e) => {
            // Close when clicking on the backdrop (not on the content)
            if (e.target === e.currentTarget) {
              setIsDuplicateCheckOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <DuplicateDetector
              document={selectedDocument}
              documents={documents.filter(doc => doc.id !== selectedDocument.id)}
              onClose={() => setIsDuplicateCheckOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage; 
import React, { useState } from 'react';
import { FiUpload, FiFile, FiTrash2, FiInfo, FiFilter, FiCheck, FiX } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';

// Component for uploading and displaying documents
const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadErrors, setUploadErrors] = useState<{[key: string]: string}>({});
  const [activeView, setActiveView] = useState<'grid' | 'list'>('list');

  // Handle file drop
  const onDrop = (acceptedFiles: File[]) => {
    // Clear previous errors
    setUploadErrors({});
    
    // Append new files to existing documents
    setDocuments(prev => [...prev, ...acceptedFiles]);
    
    // Initialize progress for each file
    const newProgress: {[key: string]: number} = {};
    acceptedFiles.forEach(file => {
      newProgress[file.name] = 0;
      
      // Validate file size (example validation)
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadErrors(prev => ({
          ...prev,
          [file.name]: 'File exceeds the 10MB size limit'
        }));
      }
    });
    setUploadProgress(prev => ({...prev, ...newProgress}));
    
    // In a real implementation, we would start uploading files here
    // This is a simulation for demonstration purposes
    simulateFileUpload(acceptedFiles);
  };

  // Simulate file upload with progress
  const simulateFileUpload = (files: File[]) => {
    setUploading(true);
    
    files.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          
          // Check if all files are done
          const allDone = Object.values({...uploadProgress, [file.name]: progress})
            .every(p => p === 100);
          
          if (allDone) {
            setUploading(false);
          }
        }
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Math.round(progress)
        }));
      }, 300);
    });
  };

  // Remove a document from the list
  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    }
  });

  // Determine document type icon color
  const getDocumentColor = (type: string) => {
    if (type.includes('pdf')) return 'bg-red-600';
    if (type.includes('word') || type.includes('doc')) return 'bg-blue-600';
    if (type.includes('text') || type.includes('txt')) return 'bg-gray-600';
    if (type.includes('markdown') || type.includes('md')) return 'bg-purple-600';
    return 'bg-[#182241]';
  };

  return (
    <div className="section">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Document Management Test</h1>
          <p className="section-description">
            Upload and manage your documents for fine-tuning your language models.
          </p>
        </div>
        
        {documents.length > 0 && (
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button className="btn btn-sm btn-outline flex items-center">
              <FiFilter size={16} className="mr-2" />
              Filter
            </button>
            <div className="flex rounded-md overflow-hidden border border-gray-200">
              <button 
                className={`px-3 py-1.5 ${activeView === 'grid' ? 'bg-[#182241] text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setActiveView('grid')}
              >
                Grid
              </button>
              <button 
                className={`px-3 py-1.5 ${activeView === 'list' ? 'bg-[#182241] text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setActiveView('list')}
              >
                List
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Area */}
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-[#182241] bg-[#182241]/5' : 'border-gray-300 hover:border-[#182241]'}
        `}
      >
        <input {...getInputProps()} />
        <div className={`mx-auto mb-4 p-4 rounded-full ${isDragActive ? 'bg-[#182241]/10' : 'bg-gray-100'}`}>
          <FiUpload className="text-[#182241] mx-auto" size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Drag & Drop Documents Here</h2>
        <p className="text-gray-500 mb-4">
          Or click to browse your files
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: PDF, DOC, DOCX, TXT, MD
        </p>
      </div>
      
      {/* Document List */}
      {documents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-oswald font-bold mb-4">Uploaded Documents</h2>
          
          {activeView === 'list' ? (
            <div className="card">
              <ul className="divide-y divide-gray-200">
                {documents.map((doc, index) => (
                  <li key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`${getDocumentColor(doc.type)} text-white p-2 rounded-lg mr-4 shadow-sm`}>
                          <FiFile size={24} />
                        </div>
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-sm text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type || 'Unknown type'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {uploadProgress[doc.name] < 100 ? (
                          <div className="w-32 mr-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-[#182241] h-2.5 rounded-full"
                                style={{ width: `${uploadProgress[doc.name]}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 text-right mt-1">
                              {uploadProgress[doc.name]}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-green-600 mr-4 text-sm flex items-center">
                            <FiCheck className="mr-1" size={16} />
                            Uploaded
                          </span>
                        )}
                        
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                          onClick={() => removeDocument(index)}
                          aria-label="Remove document"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {uploadErrors[doc.name] && (
                      <div className="mt-2 text-red-500 text-sm flex items-center">
                        <FiInfo className="mr-1" /> {uploadErrors[doc.name]}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, index) => (
                <div key={index} className="card hover:shadow-lg transition-all">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`${getDocumentColor(doc.type)} text-white p-3 rounded-lg shadow-sm`}>
                        <FiFile size={24} />
                      </div>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        onClick={() => removeDocument(index)}
                        aria-label="Remove document"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    
                    <h3 className="font-medium text-lg mb-1 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.type || 'Unknown type'}
                    </p>
                    
                    {uploadProgress[doc.name] < 100 ? (
                      <div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                          <div 
                            className="bg-[#182241] h-2.5 rounded-full"
                            style={{ width: `${uploadProgress[doc.name]}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 text-right">
                          {uploadProgress[doc.name]}%
                        </p>
                      </div>
                    ) : (
                      <span className="text-green-600 text-sm flex items-center">
                        <FiCheck className="mr-1" size={16} />
                        Uploaded
                      </span>
                    )}
                    
                    {uploadErrors[doc.name] && (
                      <div className="mt-2 text-red-500 text-sm flex items-center">
                        <FiInfo className="mr-1" /> {uploadErrors[doc.name]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <button 
              className="btn btn-outline"
              onClick={() => setDocuments([])}
            >
              <FiX size={18} className="mr-1" /> Clear All
            </button>
            
            <button 
              className="btn btn-primary"
              disabled={uploading || documents.every(doc => uploadProgress[doc.name] === 100)}
            >
              {uploading ? 'Uploading...' : 'Process Documents'} 
            </button>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {documents.length === 0 && (
        <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FiFile className="text-gray-400" size={28} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Documents Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Upload your first document to get started with the fine-tuning process.
          </p>
          <button className="btn btn-primary mx-auto">Browse Files</button>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage; 
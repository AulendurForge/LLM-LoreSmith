import React, { useState } from 'react';
import { FiFile, FiFileText, FiLink, FiDownload, FiMaximize, FiMinimize } from 'react-icons/fi';
import { Document } from '../../store/slices/documentsSlice';

interface DocumentPreviewProps {
  document: Document;
  onClose?: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Get document extension
  const fileExtension = document.name.split('.').pop()?.toLowerCase();
  
  // Determine if document is previewable
  const isPreviewable = ['pdf', 'txt', 'md', 'png', 'jpg', 'jpeg', 'gif'].includes(fileExtension || '');
  
  // Mock URL for preview purposes
  // In a real application, this would be a secure URL to the document
  const mockPreviewUrl = `https://example.com/documents/${document.id}/preview`;
  
  // Toggle fullscreen preview
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Handle preview error
  const handlePreviewError = () => {
    setPreviewError('Unable to preview this document. The file might be corrupted or in an unsupported format.');
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="mr-3 p-2 rounded-lg bg-[#182241] text-white">
            <FiFile size={20} />
          </div>
          <div>
            <h3 className="font-medium text-lg truncate max-w-lg" title={document.name}>
              {document.name}
            </h3>
            <p className="text-sm text-gray-500">
              {(document.size / 1024 / 1024).toFixed(2)} MB • {document.type || 'Unknown type'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="btn btn-sm btn-icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
          </button>
          
          <a
            href={mockPreviewUrl}
            download={document.name}
            className="btn btn-sm btn-icon"
            title="Download document"
          >
            <FiDownload size={18} />
          </a>
          
          {onClose && (
            <button 
              className="btn btn-sm btn-primary"
              onClick={onClose}
            >
              Close Preview
            </button>
          )}
        </div>
      </div>
      
      {/* Preview content */}
      <div className={`${isFullscreen ? 'flex-grow overflow-auto' : 'max-h-[600px] overflow-auto'}`}>
        {previewError ? (
          <div className="p-8 text-center">
            <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4">
              {previewError}
            </div>
            <a 
              href={mockPreviewUrl} 
              download={document.name}
              className="btn btn-primary"
            >
              <FiDownload className="mr-2" size={16} />
              Download Instead
            </a>
          </div>
        ) : isPreviewable ? (
          <div className="p-0">
            {/* Document preview based on type */}
            {fileExtension === 'pdf' && (
              <div className="w-full" style={{ height: isFullscreen ? 'calc(100vh - 73px)' : '600px' }}>
                {/* In a real application, this would be an iframe with the actual PDF */}
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                  <div className="text-center p-8">
                    <FiFileText size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="mb-4">PDF preview would be shown here</p>
                    <p className="text-sm text-gray-500 mb-4">
                      (In a real application, this would use PDF.js or a similar library)
                    </p>
                    <a 
                      href={mockPreviewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      <FiLink className="mr-2" size={16} />
                      Open in New Tab
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {(fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png' || fileExtension === 'gif') && (
              <div className="flex items-center justify-center p-4 bg-[#F5F5F5] h-full">
                {/* In a real application, this would be the actual image */}
                <div className="text-center">
                  <div className="bg-white p-4 border border-gray-200 rounded-md shadow-sm inline-block">
                    <img 
                      src={`https://via.placeholder.com/800x600?text=Image+Preview+for+${document.name}`}
                      alt={document.name}
                      className="max-w-full max-h-[500px]"
                      onError={handlePreviewError}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {(fileExtension === 'txt' || fileExtension === 'md') && (
              <div className="p-6">
                {/* In a real application, this would contain the actual text content */}
                <div className="prose max-w-none">
                  <p>This is a preview of the document content. In a real application, the actual text of "{document.name}" would be displayed here.</p>
                  
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor diam eu justo scelerisque, id venenatis nibh tempor. Morbi facilisis felis eget eros finibus, vel tempor nunc ultricies. Suspendisse potenti. Nullam at arcu purus.</p>
                  
                  <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse potenti. Vivamus lacinia lorem vel nibh scelerisque, at tincidunt dui facilisis. Duis condimentum luctus metus, non commodo enim interdum sit amet.</p>
                  
                  {fileExtension === 'md' && (
                    <>
                      <h2>Markdown Preview Example</h2>
                      <p>This section demonstrates how markdown would be rendered:</p>
                      <ul>
                        <li>First item in a list</li>
                        <li>Second item in a list</li>
                        <li>Third item with <strong>bold text</strong></li>
                      </ul>
                      <blockquote>
                        <p>This is a blockquote that would be rendered from markdown syntax.</p>
                      </blockquote>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FiFile size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Preview Unavailable</h3>
            <p className="text-gray-500 mb-6">
              This file type ({fileExtension || 'unknown'}) cannot be previewed directly.
            </p>
            <a 
              href={mockPreviewUrl} 
              download={document.name}
              className="btn btn-primary"
            >
              <FiDownload className="mr-2" size={16} />
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview; 
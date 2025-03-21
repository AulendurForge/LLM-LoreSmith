import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FiFile, FiTrash2, FiInfo, FiFilter, FiCheck, FiX, FiSearch, FiEye, FiList, FiGrid, FiTag, FiUploadCloud, FiCheckCircle, FiAlertCircle, FiFileText, FiCheckSquare, FiFolder, FiEdit, FiSquare, FiHeart, FiClock, FiSettings } from 'react-icons/fi';
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
  selectDocument,
  toggleDocumentSelection,
  toggleBatchOperationMode
} from '../store/slices/documentsSlice';
import MetadataExtractor from '../components/documents/MetadataExtractor';
import DocumentPreview from '../components/documents/DocumentPreview';
import ContentValidator, { validateDocumentContent } from '../components/documents/ContentValidator';
import DuplicateDetector from '../components/documents/DuplicateDetector';
import DocumentEditor from '../components/documents/DocumentEditor';
import BatchOperations from '../components/documents/BatchOperations';
import SelectableDocument from '../components/documents/SelectableDocument';
import RecentlyViewed from '../components/RecentlyViewed';
import TagManager from '../components/documents/TagManager';
import CategoryManager from '../components/documents/CategoryManager';
import DocumentTags from '../components/documents/DocumentTags';
import DeleteConfirmation from '../components/documents/DeleteConfirmation';
import FavoriteButton from '../components/documents/FavoriteButton';
import FavoritesFilter from '../components/documents/FavoritesFilter';
import VersionHistory from '../components/documents/VersionHistory';
import MetadataPreferences from '../components/documents/MetadataPreferences';
import { RootState } from '../store';

// Component for uploading and displaying documents
const DocumentsPage: React.FC = () => {
  console.log('DocumentsPage rendering');
  
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.documents.documents || []);
  const selectedDocumentId = useSelector((state: RootState) => state.documents.selectedDocumentId || null);
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId) || null;
  const batchOperationMode = useSelector((state: RootState) => state.documents.batchOperationMode);
  const selectedDocumentIds = useSelector((state: RootState) => state.documents.selectedDocumentIds);
  
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
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocType | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    category: '',
    tags: [] as string[],
    status: '' as DocType['status'] | '',
    dateRange: {
      start: null as Date | null,
      end: null as Date | null,
    },
    showOnlyFavorites: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<DocType | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState<boolean>(false);
  const [isMetadataPrefsOpen, setIsMetadataPrefsOpen] = useState<boolean>(false);

  // Set uploading state based on progress
  const isUploading = Object.keys(uploadProgress).length > 0;

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
          setTimeout(async () => {
            const updatedDoc = documents.find(d => d.id === id);
            if (updatedDoc) {
              try {
                // Await the validation result since it's a Promise
                const validationResult = await validateDocumentContent(updatedDoc);
                
                // Update document status based on validation result
                dispatch(updateDocumentStatus({ 
                  id: updatedDoc.id, 
                  status: validationResult.isValid ? 'complete' : 'error',
                  error: validationResult.isValid ? undefined : 'Document failed validation checks'
                }));
                
                // Also update the document in the store with the validationResult
                const docWithValidation = {
                  ...updatedDoc,
                  validationResult,
                  status: validationResult.isValid ? 'complete' as DocType['status'] : 'error' as DocType['status'],
                  error: validationResult.isValid ? undefined : 'Document failed validation checks'
                };
                
                dispatch(addDocument(docWithValidation));
              } catch (err) {
                console.error('Error validating document:', err);
                
                // Handle validation error
                dispatch(updateDocumentStatus({ 
                  id: updatedDoc.id, 
                  status: 'error',
                  error: 'Failed to validate document'
                }));
                
                // Add document without validation
                dispatch(addDocument({
                  ...updatedDoc,
                  status: 'error',
                  error: 'Failed to validate document'
                }));
              }
              
              // Select the newly uploaded document
              dispatch(selectDocument(id));
              
              // Show duplicate detection for the first uploaded document if multiple
              if (acceptedFiles.length === 1 || (acceptedFiles[0] === file)) {
                setIsDuplicateCheckOpen(true);
              }
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

  // Apply all filters to the documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Filter by search term
      if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by category
      if (filterOptions.category && doc.category !== filterOptions.category) {
        return false;
      }
      
      // Filter by tags
      if (filterOptions.tags.length > 0) {
        if (!doc.tags || doc.tags.length === 0) return false;
        if (!filterOptions.tags.every(tag => doc.tags?.includes(tag))) return false;
      }
      
      // Filter by status
      if (filterOptions.status && doc.status !== filterOptions.status) {
        return false;
      }
      
      // Filter by date range
      if (filterOptions.dateRange.start || filterOptions.dateRange.end) {
        const docDate = new Date(doc.uploadedAt);
        if (filterOptions.dateRange.start && docDate < filterOptions.dateRange.start) return false;
        if (filterOptions.dateRange.end && docDate > filterOptions.dateRange.end) return false;
      }
      
      // Filter by favorites
      if (filterOptions.showOnlyFavorites && !doc.isFavorite) {
        return false;
      }
      
      return true;
    });
  }, [documents, searchTerm, filterOptions]);

  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      category: '',
      tags: [],
      status: '',
      dateRange: {
        start: null,
        end: null,
      },
      showOnlyFavorites: false,
    });
    setSearchTerm('');
  };

  // Get all available categories and tags for filter options
  const availableCategories = Array.from(new Set(documents.map(doc => doc.category).filter(Boolean) as string[]));
  const availableTags = Array.from(new Set(documents.flatMap(doc => doc.tags || [])));

  // Toggle a tag in the filter
  const toggleTagFilter = (tag: string) => {
    setFilterOptions(prev => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  };

  // Handle document selection
  const handleSelectDocument = (id: string) => {
    dispatch(selectDocument(id));
    setShowDetailPanel(true);
  };

  // Remove a document from the list
  const handleRemoveDocument = (id: string) => {
    const docToDelete = documents.find(doc => doc.id === id);
    if (docToDelete) {
      setDocumentToDelete(docToDelete);
      setIsDeleteConfirmOpen(true);
    }
  };

  // Confirm document deletion
  const confirmDelete = (id: string) => {
    try {
      console.log('Confirming document deletion for ID:', id);
      dispatch(removeDocument(id));
      
      // Close detail panel if the selected document is removed
      if (selectedDocumentId === id) {
        setShowDetailPanel(false);
      }
      
      setIsDeleteConfirmOpen(false);
      setDocumentToDelete(null);
      
      // Display success message
      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Error in confirmDelete:', error);
    }
  };

  // Cancel document deletion
  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDocumentToDelete(null);
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

  // Render status badge based on document status
  const renderStatusBadge = (status: DocType['status']) => {
    switch (status) {
      case 'uploading':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Uploading
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

  // Toggle favorites filter
  const handleToggleFavoritesFilter = () => {
    setFilterOptions(prev => ({
      ...prev,
      showOnlyFavorites: !prev.showOnlyFavorites
    }));
  };

  // Toggle batch mode
  const toggleBatchMode = () => {
    dispatch(toggleBatchOperationMode());
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
          {isUploading && (
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
          
          {/* Filtering and view options */}
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="pl-9 pr-4 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              {/* Filter button */}
              <button 
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter size={14} />
                <span>Filters</span>
              </button>
              
              {/* Favorites filter */}
              <FavoritesFilter 
                showOnlyFavorites={filterOptions.showOnlyFavorites}
                onToggle={handleToggleFavoritesFilter}
              />
            </div>
            
            <div className="flex gap-2">
              {/* Batch mode toggle */}
              <button
                className={`px-3 py-2 rounded-md text-sm ${
                  batchOperationMode 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                onClick={toggleBatchMode}
              >
                {batchOperationMode ? 'Exit Batch Mode' : 'Batch Operations'}
              </button>
              
              {/* Metadata preferences button */}
              <button
                className="px-3 py-2 rounded-md text-sm bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 flex items-center gap-1"
                onClick={() => setIsMetadataPrefsOpen(true)}
              >
                <FiSettings size={14} />
                <span>Metadata</span>
              </button>
              
              {/* View toggles */}
              <div className="flex rounded-md border border-gray-200 overflow-hidden">
                <button
                  className={`px-3 py-2 flex items-center ${activeView === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                  onClick={() => setActiveView('list')}
                >
                  <FiList size={16} />
                </button>
                <button
                  className={`px-3 py-2 flex items-center ${activeView === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                  onClick={() => setActiveView('grid')}
                >
                  <FiGrid size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white shadow-md rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Filter Documents</h3>
                <button
                  className="text-sm text-blue-500 hover:underline"
                  onClick={resetFilters}
                >
                  Reset All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filterOptions.category}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      category: e.target.value
                    }))}
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filterOptions.status}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      status: e.target.value as DocType['status'] | ''
                    }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="uploading">Uploading</option>
                    <option value="uploaded">Uploaded</option>
                    <option value="processing">Processing</option>
                    <option value="complete">Complete</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={filterOptions.dateRange.start ? filterOptions.dateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        start: e.target.value ? new Date(e.target.value) : null
                      }
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={filterOptions.dateRange.end ? filterOptions.dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilterOptions(prev => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        end: e.target.value ? new Date(e.target.value) : null
                      }
                    }))}
                  />
                </div>
              </div>
              
              {/* Tags Filter */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      className={`px-2 py-1 text-xs rounded-full ${
                        filterOptions.tags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleTagFilter(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                  {availableTags.length === 0 && (
                    <p className="text-sm text-gray-500">No tags available</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Document List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* List header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-oswald">{filteredDocuments.length} Document{filteredDocuments.length !== 1 ? 's' : ''}</h2>
              
              {filteredDocuments.length > 0 && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 mr-2">Sort by:</span>
                  <select 
                    className="select select-bordered select-sm"
                    defaultValue="newest"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="size">Size (smallest)</option>
                    <option value="size-desc">Size (largest)</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Document grid */}
            {activeView === 'grid' ? (
              filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.length === 0 ? (
                    <div className="col-span-full p-6 bg-white rounded-lg shadow text-center text-gray-500">
                      <FiFile className="mx-auto mb-3 text-gray-300" size={32} />
                      <p>No documents found</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search or filters</p>}
                    </div>
                  ) : (
                    filteredDocuments.map(doc => (
                      <div 
                        key={doc.id}
                        className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${selectedDocumentId === doc.id ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={batchOperationMode 
                          ? () => dispatch(toggleDocumentSelection(doc.id))
                          : () => handleSelectDocument(doc.id)
                        }
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            {batchOperationMode && (
                              <div className="mr-2">
                                {selectedDocumentIds.includes(doc.id) ? (
                                  <FiCheckSquare size={18} className="text-blue-600" />
                                ) : (
                                  <FiSquare size={18} className="text-gray-400" />
                                )}
                              </div>
                            )}
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                              <FiFile className="text-[#182241]" size={16} />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-800 truncate max-w-[180px]">{doc.name}</h3>
                              <p className="text-xs text-gray-500">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-1">
                            {/* Favorite button */}
                            <FavoriteButton 
                              documentId={doc.id}
                              isFavorite={doc.isFavorite}
                            />
                            
                            {/* Edit and Delete buttons */}
                            {!batchOperationMode && (
                              <>
                                <button 
                                  className="p-1 text-gray-400 hover:text-blue-500 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDocumentToEdit(doc);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <FiEdit size={16} />
                                </button>
                                <button 
                                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDocument(doc.id);
                                  }}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-end mt-2">
                          <div>
                            <div className="flex items-center text-xs text-gray-500 mb-1">
                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                              {doc.category && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="flex items-center">
                                    <FiFolder size={10} className="mr-1" />
                                    {doc.category}
                                  </span>
                                </>
                              )}
                            </div>
                            <DocumentTags tags={doc.tags || []} />
                          </div>
                          
                          <div>
                            {renderStatusBadge(doc.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No documents found matching your criteria.</p>
                  {Object.keys(filterOptions).some(key => 
                    filterOptions[key as keyof typeof filterOptions] !== '' && 
                    (Array.isArray(filterOptions[key as keyof typeof filterOptions]) 
                      ? (filterOptions[key as keyof typeof filterOptions] as any[]).length > 0 
                      : true)
                  ) && (
                    <button 
                      className="btn btn-outline btn-sm mt-2"
                      onClick={resetFilters}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )
            ) : (
              // List view
              filteredDocuments.length > 0 ? (
                <div className="divide-y">
                  {filteredDocuments.map((doc: DocType) => (
                    <div 
                      key={doc.id}
                      className={`p-3 hover:bg-blue-50 cursor-pointer ${
                        selectedDocumentId === doc.id && !batchOperationMode ? 'bg-blue-50' : 
                        selectedDocumentIds.includes(doc.id) && batchOperationMode ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (batchOperationMode) {
                          dispatch(toggleDocumentSelection(doc.id));
                        } else {
                          handleSelectDocument(doc.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {batchOperationMode && (
                            <div className="mr-2">
                              {selectedDocumentIds.includes(doc.id) ? (
                                <FiCheckSquare size={18} className="text-blue-600" />
                              ) : (
                                <FiSquare size={18} className="text-gray-400" />
                              )}
                            </div>
                          )}
                          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FiFile className="text-[#182241]" size={16} />
                          </div>
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="font-medium truncate">{doc.name}</h3>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            <span className="mx-1">•</span>
                            <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                            {doc.category && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="flex items-center">
                                  <FiFolder size={10} className="mr-1" />
                                  {doc.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="hidden md:flex items-center gap-1">
                              {doc.tags.slice(0, 2).map(tag => (
                                <span 
                                  key={tag} 
                                  className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {doc.tags.length > 2 && (
                                <span className="text-xs text-gray-500">+{doc.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                          
                          {doc.status === 'complete' && (
                            <span className="flex items-center text-xs text-green-600">
                              <FiCheck size={12} className="mr-1" /> Valid
                            </span>
                          )}
                          
                          {doc.status === 'error' && (
                            <span className="flex items-center text-xs text-red-600">
                              Error
                            </span>
                          )}
                          
                          {!batchOperationMode && (
                            <button
                              className="p-1 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDocument(doc.id);
                              }}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No documents found matching your criteria.</p>
                  {Object.keys(filterOptions).some(key => 
                    filterOptions[key as keyof typeof filterOptions] !== '' && 
                    (Array.isArray(filterOptions[key as keyof typeof filterOptions]) 
                      ? (filterOptions[key as keyof typeof filterOptions] as any[]).length > 0 
                      : true)
                  ) && (
                    <button 
                      className="btn btn-outline btn-sm mt-2"
                      onClick={resetFilters}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Right column - Document Details */}
        <div className={`w-full lg:w-[42%] transition-all duration-300 ${showDetailPanel ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
          {selectedDocument ? (
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-oswald font-semibold truncate max-w-[80%]">
                  {selectedDocument.name}
                </h2>
                <div className="flex space-x-1">
                  <button
                    className="p-2 text-gray-500 hover:text-blue-500"
                    onClick={() => setIsVersionHistoryOpen(true)}
                    title="View version history"
                  >
                    <FiClock size={16} />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-blue-500 mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocumentToEdit(selectedDocument);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDocument(selectedDocument.id);
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
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
            <div className="bg-white rounded-lg shadow-md h-full flex items-center justify-center">
              <div className="text-center p-8">
                <FiFile className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="text-gray-500">Select a document to view details</p>
              </div>
            </div>
          )}
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

      {/* Edit Document Modal */}
      {isEditModalOpen && documentToEdit && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={(e) => {
            // Close when clicking on the backdrop (not on the content)
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <DocumentEditor
              document={documentToEdit}
              onClose={() => setIsEditModalOpen(false)}
              onSave={(updatedDoc) => {
                setIsEditModalOpen(false);
                setDocumentToEdit(null);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && documentToDelete && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-50"
          onClick={(e) => {
            // Close when clicking on the backdrop (not on the content)
            if (e.target === e.currentTarget) {
              setIsDeleteConfirmOpen(false);
              setDocumentToDelete(null);
            }
          }}
        >
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md mx-auto px-4">
            <DeleteConfirmation 
              documentId={documentToDelete.id}
              documentName={documentToDelete.name}
              onClose={() => {
                console.log('Delete confirmation closed');
                setIsDeleteConfirmOpen(false);
                setDocumentToDelete(null);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Version History Modal */}
      {isVersionHistoryOpen && selectedDocument && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={(e) => {
            // Close when clicking on the backdrop (not on the content)
            if (e.target === e.currentTarget) {
              setIsVersionHistoryOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <VersionHistory
              document={selectedDocument}
              onClose={() => setIsVersionHistoryOpen(false)}
            />
          </div>
        </div>
      )}
      
      {/* Metadata Preferences Modal */}
      {isMetadataPrefsOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={(e) => {
            // Close when clicking on the backdrop (not on the content)
            if (e.target === e.currentTarget) {
              setIsMetadataPrefsOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <MetadataPreferences
              onClose={() => setIsMetadataPrefsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Batch operations */}
      {batchOperationMode && selectedDocumentIds.length > 0 && (
        <BatchOperations
          availableTags={availableTags}
          availableCategories={availableCategories}
          onCancel={toggleBatchMode}
        />
      )}
    </div>
  );
};

export default DocumentsPage; 
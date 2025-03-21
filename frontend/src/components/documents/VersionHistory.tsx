import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FiClock, FiDownload, FiTrash2, FiRefreshCw, FiUpload, FiInfo } from 'react-icons/fi';
import { Document, DocumentVersion, addDocumentVersion, restoreDocumentVersion } from '../../store/slices/documentsSlice';
import { getDocumentVersions, createDocumentVersion, restoreDocumentVersion as restoreVersionAPI, deleteDocumentVersion } from '../../api/documentsApi';
import { toast } from 'react-toastify';

interface VersionHistoryProps {
  document: Document;
  onClose?: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ document, onClose }) => {
  const dispatch = useDispatch();
  
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionChanges, setNewVersionChanges] = useState<string>('');
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Load versions when component mounts
  useEffect(() => {
    fetchVersions();
  }, [document.id]);
  
  // Fetch document versions
  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { versions, currentVersion } = await getDocumentVersions(document.id);
      setVersions(versions);
      setCurrentVersion(currentVersion);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching document versions:', err);
      setError('Failed to load document versions. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle file selection for new version
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewVersionFile(e.target.files[0]);
    }
  };
  
  // Upload new version
  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVersionFile && !newVersionChanges) {
      toast.error('Please select a file or describe the changes');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await createDocumentVersion(
        document.id, 
        newVersionFile || undefined, 
        newVersionChanges
      );
      
      // Update Redux store
      dispatch(addDocumentVersion({
        documentId: document.id,
        version: response.version
      }));
      
      // Update local state
      setVersions(prev => [...prev, response.version]);
      setCurrentVersion(response.version.versionNumber);
      
      // Reset form
      setNewVersionFile(null);
      setNewVersionChanges('');
      setShowUploadForm(false);
      setIsUploading(false);
      
      toast.success('New version created successfully');
    } catch (err) {
      console.error('Error creating document version:', err);
      setError('Failed to create new version. Please try again.');
      setIsUploading(false);
    }
  };
  
  // Restore a version
  const handleRestoreVersion = async (versionId: string) => {
    try {
      const response = await restoreVersionAPI(document.id, versionId);
      
      // Update Redux store
      dispatch(restoreDocumentVersion({
        documentId: document.id,
        versionId
      }));
      
      // Update local state with the new version created during restoration
      setVersions(prev => [...prev, response.version]);
      setCurrentVersion(response.version.versionNumber);
      
      toast.success('Document version restored successfully');
    } catch (err) {
      console.error('Error restoring document version:', err);
      toast.error('Failed to restore version. Please try again.');
    }
  };
  
  // Delete a version
  const handleDeleteVersion = async (versionId: string) => {
    try {
      await deleteDocumentVersion(document.id, versionId);
      
      // Update local state
      setVersions(prev => prev.filter(v => v.id !== versionId));
      setConfirmDelete(null);
      
      toast.success('Version deleted successfully');
    } catch (err) {
      console.error('Error deleting document version:', err);
      toast.error('Failed to delete version. Please try again.');
    }
  };
  
  // Format date/time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get version status (current or previous)
  const getVersionStatus = (versionNumber: number) => {
    if (versionNumber === currentVersion) {
      return (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
          Current
        </span>
      );
    }
    return null;
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-oswald font-bold flex items-center">
          <FiClock className="mr-2" size={20} />
          Version History
        </h2>
        {onClose && (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <FiInfo size={20} />
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <button
          className="btn btn-primary flex items-center"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          <FiUpload className="mr-2" size={16} />
          {showUploadForm ? 'Cancel' : 'Create New Version'}
        </button>
      </div>
      
      {showUploadForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-3">Create New Version</h3>
          <form onSubmit={handleUploadVersion}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload new file (optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              {newVersionFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected file: {newVersionFile.name} ({(newVersionFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change description
              </label>
              <textarea
                value={newVersionChanges}
                onChange={(e) => setNewVersionChanges(e.target.value)}
                className="form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Describe what changed in this version"
                rows={3}
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading || (!newVersionFile && !newVersionChanges)}
            >
              {isUploading ? 'Uploading...' : 'Create Version'}
            </button>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-6">
          <p>Loading versions...</p>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No versions available for this document</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changes
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {versions
                .sort((a, b) => b.versionNumber - a.versionNumber)
                .map((version) => (
                  <tr key={version.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium">v{version.versionNumber}</span>
                        {getVersionStatus(version.versionNumber)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(version.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(version.fileSize / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {version.changes || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {version.versionNumber !== currentVersion && (
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleRestoreVersion(version.id)}
                          title="Restore this version"
                        >
                          <FiRefreshCw size={16} />
                        </button>
                      )}
                      {version.versionNumber !== currentVersion && (
                        <>
                          {confirmDelete === version.id ? (
                            <div className="inline-flex items-center">
                              <span className="text-sm text-gray-500 mr-2">Confirm:</span>
                              <button
                                className="text-red-600 hover:text-red-900 mr-1"
                                onClick={() => handleDeleteVersion(version.id)}
                                title="Confirm delete"
                              >
                                Yes
                              </button>
                              <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setConfirmDelete(null)}
                                title="Cancel delete"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => setConfirmDelete(version.id)}
                              title="Delete this version"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VersionHistory; 
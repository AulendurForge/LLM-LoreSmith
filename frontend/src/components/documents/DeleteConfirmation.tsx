import React, { useState } from 'react';
import { deleteDocument } from '../../api/documentsApi';
import { useDispatch } from 'react-redux';
import { removeDocument } from '../../store/slices/documentsSlice';
import { AppDispatch } from '../../store';
import { toast } from 'react-toastify';

interface DeleteConfirmationProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  documentId,
  documentName,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotFoundOptions, setShowNotFoundOptions] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      console.log(`Attempting to delete document with ID: ${documentId}`);
      await deleteDocument(documentId);
      dispatch(removeDocument(documentId));
      toast.success(`Document "${documentName}" deleted successfully`);
      onClose();
    } catch (err: any) {
      console.error(`Error deleting document: ${err}`);
      
      // Handle document not found error specifically
      if (err.name === 'DocumentNotFoundError' || (err.response && err.response.status === 404)) {
        setError('This document was not found on the server. It may have been deleted already.');
        setShowNotFoundOptions(true);
      } else {
        setError(`Failed to delete document: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle removing document from UI only when it's not found on server
  const handleRemoveFromUI = () => {
    dispatch(removeDocument(documentId));
    toast.info(`Document "${documentName}" removed from display`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Delete Document</h2>
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <p className="mb-4 dark:text-gray-300">
            Are you sure you want to delete <span className="font-semibold">{documentName}</span>? This action cannot be undone.
          </p>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            disabled={isDeleting}
          >
            Cancel
          </button>
          
          {showNotFoundOptions ? (
            <button
              type="button"
              onClick={handleRemoveFromUI}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Remove from UI
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition btn-error"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation; 
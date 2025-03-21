import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiTag, 
  FiFolder, 
  FiTrash2, 
  FiX, 
  FiCheck, 
  FiCheckSquare,
  FiSquare,
  FiPlus,
  FiHeart
} from 'react-icons/fi';
import { 
  toggleBatchOperationMode,
  selectAllDocuments,
  clearDocumentSelection,
  batchUpdateTags,
  batchUpdateCategory,
  removeDocuments,
  addToFavorites,
  removeFromFavorites,
  setSelectedDocumentIds,
  Document as DocType
} from '../../store/slices/documentsSlice';
import { RootState } from '../../store';
import { toast } from 'react-toastify';

interface BatchOperationsProps {
  availableTags: string[];
  availableCategories: string[];
  onCancel: () => void;
}

const BatchOperations: React.FC<BatchOperationsProps> = ({ 
  availableTags, 
  availableCategories, 
  onCancel 
}) => {
  const dispatch = useDispatch();
  const batchOperationMode = useSelector((state: RootState) => state.documents.batchOperationMode);
  const selectedDocumentIds = useSelector((state: RootState) => state.documents.selectedDocumentIds);
  const documents = useSelector((state: RootState) => state.documents.documents);
  
  // Local state for managing UI dialogs and selections
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFavoriteDialog, setShowFavoriteDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagOperation, setTagOperation] = useState<'add' | 'remove' | 'set'>('add');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [favoriteAction, setFavoriteAction] = useState<'add' | 'remove'>('add');
  
  // Helper to get document count display
  const getDocumentCountText = () => {
    const count = selectedDocumentIds.length;
    return `${count} document${count === 1 ? '' : 's'} selected`;
  };
  
  // Toggle batch mode
  const toggleBatchMode = () => {
    dispatch(toggleBatchOperationMode());
  };
  
  // Select all documents
  const handleSelectAll = () => {
    dispatch(selectAllDocuments());
  };
  
  // Clear selection
  const handleClearSelection = () => {
    dispatch(clearDocumentSelection());
  };
  
  // Open tag dialog
  const openTagDialog = () => {
    setSelectedTags([]);
    setTagOperation('add');
    setShowTagDialog(true);
  };
  
  // Apply tag operation
  const applyTagOperation = () => {
    if (selectedTags.length > 0) {
      dispatch(batchUpdateTags({
        operation: tagOperation,
        tags: selectedTags
      }));
      setShowTagDialog(false);
    }
  };
  
  // Open category dialog
  const openCategoryDialog = () => {
    setSelectedCategory('');
    setShowCategoryDialog(true);
  };
  
  // Apply category operation
  const applyCategoryOperation = () => {
    if (selectedCategory) {
      dispatch(batchUpdateCategory(selectedCategory));
      setShowCategoryDialog(false);
    }
  };
  
  // Open delete confirmation
  const openDeleteDialog = () => {
    setShowDeleteDialog(true);
  };
  
  // Confirm batch delete
  const confirmDelete = () => {
    dispatch(removeDocuments(selectedDocumentIds));
    setShowDeleteDialog(false);
  };
  
  // Check if all documents are selected
  const areAllDocumentsSelected = selectedDocumentIds.length === documents.length && documents.length > 0;
  
  // Add all selected documents to favorites
  const handleAddToFavorites = () => {
    dispatch(addToFavorites(selectedDocumentIds));
    setShowFavoriteDialog(false);
    toast.success(`${selectedDocumentIds.length} document${selectedDocumentIds.length !== 1 ? 's' : ''} added to favorites`);
  };
  
  // Remove all selected documents from favorites
  const handleRemoveFromFavorites = () => {
    dispatch(removeFromFavorites(selectedDocumentIds));
    setShowFavoriteDialog(false);
    toast.success(`${selectedDocumentIds.length} document${selectedDocumentIds.length !== 1 ? 's' : ''} removed from favorites`);
  };
  
  // Render nothing if not in batch mode
  if (!batchOperationMode) {
    return (
      <button 
        className="btn btn-sm"
        onClick={toggleBatchMode}
      >
        <FiCheckSquare className="mr-1" size={14} /> Batch Operations
      </button>
    );
  }
  
  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
        </h3>
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={onCancel}
        >
          <FiX size={20} />
        </button>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <button 
            className="btn btn-sm btn-outline mr-2"
            onClick={handleSelectAll}
            title={areAllDocumentsSelected ? "Deselect All" : "Select All"}
          >
            {areAllDocumentsSelected ? <FiCheckSquare size={14} /> : <FiSquare size={14} />}
            <span className="ml-1">{areAllDocumentsSelected ? "Deselect All" : "Select All"}</span>
          </button>
          
          {selectedDocumentIds.length > 0 && (
            <button 
              className="btn btn-sm btn-ghost"
              onClick={handleClearSelection}
            >
              Clear Selection
            </button>
          )}
        </div>
        
        <div className="text-sm font-medium">
          {getDocumentCountText()}
        </div>
      </div>
      
      {selectedDocumentIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button 
            className="btn btn-sm"
            onClick={openTagDialog}
          >
            <FiTag className="mr-1" size={14} /> Manage Tags
          </button>
          
          <button 
            className="btn btn-sm"
            onClick={openCategoryDialog}
          >
            <FiFolder className="mr-1" size={14} /> Set Category
          </button>
          
          <div className="dropdown dropdown-end">
            <label 
              tabIndex={0} 
              className="btn btn-sm btn-outline gap-1"
            >
              <FiHeart size={14} /> 
              <span>Favorites</span>
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a onClick={() => {
                  setFavoriteAction('add');
                  setShowFavoriteDialog(true);
                }}>
                  Add to favorites
                </a>
              </li>
              <li>
                <a onClick={() => {
                  setFavoriteAction('remove');
                  setShowFavoriteDialog(true);
                }}>
                  Remove from favorites
                </a>
              </li>
            </ul>
          </div>
          
          <button 
            className="btn btn-sm btn-error"
            onClick={openDeleteDialog}
          >
            <FiTrash2 className="mr-1" size={14} /> Delete
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Select documents to perform batch operations</p>
      )}
      
      {/* Tag Dialog */}
      {showTagDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Manage Tags</h3>
            
            {/* Tag Operation Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
              <div className="flex gap-2">
                <button
                  className={`btn btn-sm ${tagOperation === 'add' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTagOperation('add')}
                >
                  <FiPlus size={14} className="mr-1" /> Add Tags
                </button>
                <button
                  className={`btn btn-sm ${tagOperation === 'remove' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTagOperation('remove')}
                >
                  <FiX size={14} className="mr-1" /> Remove Tags
                </button>
                <button
                  className={`btn btn-sm ${tagOperation === 'set' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTagOperation('set')}
                >
                  <FiCheck size={14} className="mr-1" /> Set Tags
                </button>
              </div>
            </div>
            
            {/* Available Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tags for {tagOperation === 'add' ? 'Adding' : tagOperation === 'remove' ? 'Removal' : 'Setting'}
              </label>
              
              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedTags(prevTags => 
                          prevTags.includes(tag)
                            ? prevTags.filter(t => t !== tag)
                            : [...prevTags, tag]
                        );
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tags available. Create tags by adding them to individual documents first.</p>
              )}
            </div>
            
            {/* Custom Tag Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Tag
              </label>
              <div className="flex">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 mr-2"
                  placeholder="Enter new tag name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim();
                      if (!selectedTags.includes(newTag)) {
                        setSelectedTags(prev => [...prev, newTag]);
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    const newTag = input.value.trim();
                    if (newTag && !selectedTags.includes(newTag)) {
                      setSelectedTags(prev => [...prev, newTag]);
                    }
                    input.value = '';
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowTagDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={applyTagOperation}
                disabled={selectedTags.length === 0}
              >
                Apply to {selectedDocumentIds.length} Document{selectedDocumentIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Dialog */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Set Category</h3>
            
            {/* Available Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              
              {availableCategories.length > 0 ? (
                <div className="space-y-2">
                  {availableCategories.map(category => (
                    <div 
                      key={category}
                      className={`p-2 rounded cursor-pointer ${
                        selectedCategory === category
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className="flex items-center">
                        <FiFolder className="mr-2" size={16} />
                        <span>{category}</span>
                        {selectedCategory === category && (
                          <FiCheck className="ml-auto text-blue-500" size={16} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No categories available. Create categories by adding them to individual documents first.</p>
              )}
            </div>
            
            {/* Custom Category Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create New Category
              </label>
              <div className="flex">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 mr-2"
                  placeholder="Enter new category name"
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      setSelectedCategory(e.target.value.trim());
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowCategoryDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={applyCategoryOperation}
                disabled={!selectedCategory}
              >
                Apply to {selectedDocumentIds.length} Document{selectedDocumentIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Favorite Dialog */}
      {showFavoriteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              {favoriteAction === 'add' ? 'Add to Favorites' : 'Remove from Favorites'}
            </h3>
            
            <div className="mb-6">
              <p className="mb-2">
                {favoriteAction === 'add' 
                  ? `Are you sure you want to add ${selectedDocumentIds.length} selected document${selectedDocumentIds.length !== 1 ? 's' : ''} to favorites?`
                  : `Are you sure you want to remove ${selectedDocumentIds.length} selected document${selectedDocumentIds.length !== 1 ? 's' : ''} from favorites?`
                }
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowFavoriteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={favoriteAction === 'add' ? handleAddToFavorites : handleRemoveFromFavorites}
              >
                {favoriteAction === 'add' ? 'Add to Favorites' : 'Remove from Favorites'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-red-600">Delete Documents</h3>
            
            <div className="mb-6">
              <p className="mb-2">Are you sure you want to delete {selectedDocumentIds.length} selected document{selectedDocumentIds.length !== 1 ? 's' : ''}?</p>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-error"
                onClick={confirmDelete}
              >
                Delete {selectedDocumentIds.length} Document{selectedDocumentIds.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchOperations; 
import React, { useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { Document as DocType, updateDocument as updateDocumentAction } from '../../store/slices/documentsSlice';
import { updateDocument as updateDocumentAPI } from '../../api/documentsApi';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

interface DocumentEditorProps {
  document: DocType;
  onClose: () => void;
  onSave?: (updatedDoc: DocType) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document, onClose, onSave }) => {
  const dispatch = useDispatch();
  
  // Initialize form data from document
  const [name, setName] = useState(document.name || '');
  const [category, setCategory] = useState(document.category || '');
  const [tags, setTags] = useState<string[]>(document.tags || []);
  const [newTag, setNewTag] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSaving) return;
    if (!name.trim()) {
      setError('Document name cannot be empty');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Prepare update data
      const updateData = {
        name,
        category: category || undefined,
        tags
      };
      
      // Call API to update document
      await updateDocumentAPI(document.id, updateData);
      
      // Update Redux store
      dispatch(updateDocumentAction({
        id: document.id,
        ...updateData
      }));
      
      // Call onSave callback if provided
      if (onSave) {
        onSave({
          ...document,
          ...updateData
        });
      }
      
      setIsSaving(false);
      toast.success('Document updated successfully');
      onClose();
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document. Please try again.');
      setIsSaving(false);
    }
  };
  
  // Add a new tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag('');
  };
  
  // Remove a tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-oswald font-bold">Edit Document</h2>
        <button 
          className="text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <FiX size={20} />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter document name"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter category (optional)"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-grow p-2 border border-gray-300 rounded-l-md"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="bg-blue-600 text-white px-4 rounded-r-md"
            >
              Add
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            disabled={isSaving}
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <FiSave className="mr-2" size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentEditor; 
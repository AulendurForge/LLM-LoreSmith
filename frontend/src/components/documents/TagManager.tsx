import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiX, FiTag, FiCheck, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { RootState } from '../../store';
import { Document as DocType, updateDocumentTags } from '../../store/slices/documentsSlice';

// Define types for tags with color
interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  documentId?: string;
  className?: string;
}

// Array of predefined colors for tags
const TAG_COLORS = [
  '#e57373', // red
  '#f06292', // pink
  '#ba68c8', // purple
  '#9575cd', // deep purple
  '#7986cb', // indigo
  '#64b5f6', // blue
  '#4fc3f7', // light blue
  '#4dd0e1', // cyan
  '#4db6ac', // teal
  '#81c784', // green
  '#aed581', // light green
  '#dce775', // lime
  '#fff176', // yellow
  '#ffd54f', // amber
  '#ffb74d', // orange
  '#ff8a65', // deep orange
];

const TagManager: React.FC<TagManagerProps> = ({ documentId, className = '' }) => {
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.documents.documents);
  const document = documentId ? documents.find(doc => doc.id === documentId) : undefined;
  
  // Get all unique tags from all documents
  const allDocumentTags = documents.reduce((tags: string[], doc) => {
    if (doc.tags && doc.tags.length > 0) {
      return [...tags, ...doc.tags.filter(tag => !tags.includes(tag))];
    }
    return tags;
  }, []);

  // Local state for managing tags
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Initialize available tags from localStorage or create defaults
  useEffect(() => {
    const storedTags = localStorage.getItem('documentTags');
    if (storedTags) {
      setAvailableTags(JSON.parse(storedTags));
    } else {
      // Create some default tags if none exist
      const defaultTags: Tag[] = [
        { id: '1', name: 'Important', color: '#e57373' },
        { id: '2', name: 'Reference', color: '#64b5f6' },
        { id: '3', name: 'Archive', color: '#81c784' },
      ];
      setAvailableTags(defaultTags);
      localStorage.setItem('documentTags', JSON.stringify(defaultTags));
    }
  }, []);
  
  // Save tags to localStorage when they change
  useEffect(() => {
    if (availableTags.length > 0) {
      localStorage.setItem('documentTags', JSON.stringify(availableTags));
    }
  }, [availableTags]);
  
  // Add a new tag
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    // Check if tag with this name already exists
    if (availableTags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      alert('A tag with this name already exists');
      return;
    }
    
    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName,
      color: selectedColor,
    };
    
    setAvailableTags([...availableTags, newTag]);
    setNewTagName('');
    setSelectedColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
  };
  
  // Remove a tag
  const handleRemoveTag = (tagId: string) => {
    // Remove from available tags
    setAvailableTags(availableTags.filter(tag => tag.id !== tagId));
    
    // Also remove this tag from any documents that have it
    const tagToRemove = availableTags.find(tag => tag.id === tagId);
    if (tagToRemove) {
      documents.forEach(doc => {
        if (doc.tags && doc.tags.includes(tagToRemove.name)) {
          const updatedTags = doc.tags.filter(tag => tag !== tagToRemove.name);
          dispatch(updateDocumentTags({ id: doc.id, tags: updatedTags }));
        }
      });
    }
  };
  
  // Update a tag
  const handleUpdateTag = (tagId: string, newName: string, newColor: string) => {
    const oldTag = availableTags.find(tag => tag.id === tagId);
    const updatedTags = availableTags.map(tag => 
      tag.id === tagId ? { ...tag, name: newName, color: newColor } : tag
    );
    
    setAvailableTags(updatedTags);
    setEditingTagId(null);
    
    // Update this tag name in all documents that have it
    if (oldTag && oldTag.name !== newName) {
      documents.forEach(doc => {
        if (doc.tags && doc.tags.includes(oldTag.name)) {
          const updatedDocTags = doc.tags.map(tag => 
            tag === oldTag.name ? newName : tag
          );
          dispatch(updateDocumentTags({ id: doc.id, tags: updatedDocTags }));
        }
      });
    }
  };
  
  // Toggle a tag on the current document
  const toggleDocumentTag = (tagName: string) => {
    if (!document) return;
    
    const currentTags = document.tags || [];
    let newTags: string[];
    
    if (currentTags.includes(tagName)) {
      // Remove tag
      newTags = currentTags.filter(tag => tag !== tagName);
    } else {
      // Add tag
      newTags = [...currentTags, tagName];
    }
    
    dispatch(updateDocumentTags({ id: document.id, tags: newTags }));
  };
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FiTag className="mr-2" /> Document Tags
      </h3>
      
      {/* Add new tag form */}
      <div className="mb-4 flex">
        <div className="flex-1 mr-2">
          <input
            type="text"
            className="input input-bordered w-full text-sm"
            placeholder="New tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
        </div>
        
        <div className="relative">
          <button
            type="button"
            className="w-8 h-8 rounded border border-gray-300 mr-2"
            style={{ backgroundColor: selectedColor }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          
          {showColorPicker && (
            <div className="absolute right-0 mt-1 p-2 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="grid grid-cols-4 gap-1">
                {TAG_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleAddTag}
          disabled={!newTagName.trim()}
        >
          <FiPlus size={16} />
        </button>
      </div>
      
      {/* Available tags */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Tags</h4>
        <div className="flex flex-wrap gap-2">
          {availableTags.length > 0 ? (
            availableTags.map(tag => (
              <div key={tag.id} className="relative group">
                {editingTagId === tag.id ? (
                  <div className="flex items-center p-1 border border-gray-300 rounded bg-white shadow-sm">
                    <input
                      type="text"
                      className="w-24 text-xs px-1 border-none focus:outline-none"
                      value={tag.name}
                      onChange={(e) => {
                        const updatedTags = availableTags.map(t => 
                          t.id === tag.id ? { ...t, name: e.target.value } : t
                        );
                        setAvailableTags(updatedTags);
                      }}
                      autoFocus
                    />
                    <div className="flex">
                      <button
                        type="button"
                        className="p-1 text-green-600 hover:text-green-800"
                        onClick={() => handleUpdateTag(tag.id, tag.name, tag.color)}
                      >
                        <FiCheck size={14} />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-600 hover:text-gray-800"
                        onClick={() => setEditingTagId(null)}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`px-2 py-1 text-xs rounded-full text-white flex items-center ${document ? 'cursor-pointer' : ''}`}
                    style={{ backgroundColor: tag.color }}
                    onClick={() => document && toggleDocumentTag(tag.name)}
                  >
                    {document && document.tags && document.tags.includes(tag.name) && (
                      <FiCheck className="mr-1" size={12} />
                    )}
                    {tag.name}
                    <div className="hidden group-hover:flex absolute right-0 top-0 -mt-2 -mr-2">
                      <button
                        type="button"
                        className="p-1 bg-white rounded-full text-gray-600 hover:text-gray-800 border border-gray-300 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTagId(tag.id);
                        }}
                      >
                        <FiEdit2 size={10} />
                      </button>
                      <button
                        type="button"
                        className="p-1 bg-white rounded-full text-red-600 hover:text-red-800 border border-gray-300 shadow-sm ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag.id);
                        }}
                      >
                        <FiTrash2 size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tags created yet</p>
          )}
        </div>
      </div>
      
      {/* Document tags section (only show if document is provided) */}
      {document && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Document Tags</h4>
          <div className="flex flex-wrap gap-2">
            {document.tags && document.tags.length > 0 ? (
              document.tags.map((tagName, index) => {
                const tagObj = availableTags.find(t => t.name === tagName);
                return (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs rounded-full text-white flex items-center"
                    style={{ backgroundColor: tagObj?.color || '#888' }}
                  >
                    {tagName}
                    <button
                      type="button"
                      className="ml-1 text-white hover:text-red-100"
                      onClick={() => toggleDocumentTag(tagName)}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No tags applied to this document</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager; 
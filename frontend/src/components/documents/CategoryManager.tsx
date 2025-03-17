import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiFolder, FiPlus, FiX, FiEdit2, FiCheck } from 'react-icons/fi';
import { RootState } from '../../store';
import { updateDocumentCategory } from '../../store/slices/documentsSlice';

interface CategoryManagerProps {
  documentId?: string;
  className?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ documentId, className = '' }) => {
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.documents.documents);
  const document = documentId ? documents.find(doc => doc.id === documentId) : undefined;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  
  // Load categories from localStorage on init
  useEffect(() => {
    const storedCategories = localStorage.getItem('documentCategories');
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      // Initialize with default categories
      const defaultCategories: Category[] = [
        { id: '1', name: 'Uncategorized', description: 'Default category for documents' },
        { id: '2', name: 'Reports', description: 'Business and financial reports' },
        { id: '3', name: 'Contracts', description: 'Legal contracts and agreements' },
        { id: '4', name: 'Presentations', description: 'Slides and presentation materials' }
      ];
      setCategories(defaultCategories);
      localStorage.setItem('documentCategories', JSON.stringify(defaultCategories));
    }
  }, []);
  
  // Save categories to localStorage when they change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('documentCategories', JSON.stringify(categories));
    }
  }, [categories]);
  
  // Add a new category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    // Check if category with this name already exists
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      alert('A category with this name already exists');
      return;
    }
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      description: newCategoryDescription.trim() || undefined
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setFormVisible(false);
  };
  
  // Update a category
  const handleUpdateCategory = (categoryId: string) => {
    const updatedCategory = categories.find(cat => cat.id === categoryId);
    if (!updatedCategory) return;
    
    // Check if the name already exists (except for this category)
    if (categories.some(cat => 
      cat.id !== categoryId && 
      cat.name.toLowerCase() === updatedCategory.name.toLowerCase()
    )) {
      alert('A category with this name already exists');
      return;
    }
    
    setCategories(categories.map(cat => 
      cat.id === categoryId ? updatedCategory : cat
    ));
    
    setEditingCategoryId(null);
  };
  
  // Remove a category
  const handleRemoveCategory = (categoryId: string) => {
    // Don't allow removing the Uncategorized category
    const category = categories.find(cat => cat.id === categoryId);
    if (category?.name === 'Uncategorized') {
      alert('The Uncategorized category cannot be removed');
      return;
    }
    
    // Remove the category
    setCategories(categories.filter(cat => cat.id !== categoryId));
    
    // Move any documents in this category to Uncategorized
    const uncategorized = categories.find(cat => cat.name === 'Uncategorized');
    if (uncategorized) {
      const categoryToRemove = categories.find(cat => cat.id === categoryId);
      if (categoryToRemove) {
        documents.forEach(doc => {
          if (doc.category === categoryToRemove.name) {
            dispatch(updateDocumentCategory({
              id: doc.id,
              category: 'Uncategorized'
            }));
          }
        });
      }
    }
  };
  
  // Set the document category
  const setDocumentCategory = (categoryName: string) => {
    if (!document) return;
    
    dispatch(updateDocumentCategory({
      id: document.id,
      category: categoryName
    }));
  };
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FiFolder className="mr-2" /> Categories
        </h3>
        
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => setFormVisible(!formVisible)}
        >
          {formVisible ? 'Cancel' : <><FiPlus size={16} className="mr-1" /> Add Category</>}
        </button>
      </div>
      
      {/* Add new category form */}
      {formVisible && (
        <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              className="input input-bordered w-full text-sm"
              placeholder="Enter category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              className="input input-bordered w-full text-sm"
              placeholder="Enter description"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              Add Category
            </button>
          </div>
        </div>
      )}
      
      {/* Categories list */}
      <div className="space-y-2">
        {categories.map(category => (
          <div 
            key={category.id} 
            className={`p-2 border rounded-md ${
              document && document.category === category.name 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50'
            } ${document ? 'cursor-pointer' : ''}`}
            onClick={() => document && setDocumentCategory(category.name)}
          >
            {editingCategoryId === category.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  className="input input-bordered w-full text-sm"
                  value={category.name}
                  onChange={(e) => {
                    setCategories(categories.map(cat => 
                      cat.id === category.id 
                        ? { ...cat, name: e.target.value } 
                        : cat
                    ));
                  }}
                />
                
                <input
                  type="text"
                  className="input input-bordered w-full text-sm"
                  placeholder="Description (optional)"
                  value={category.description || ''}
                  onChange={(e) => {
                    setCategories(categories.map(cat => 
                      cat.id === category.id 
                        ? { ...cat, description: e.target.value || undefined } 
                        : cat
                    ));
                  }}
                />
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline mr-2"
                    onClick={() => setEditingCategoryId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleUpdateCategory(category.id)}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm flex items-center">
                    <FiFolder className="mr-2 text-gray-600" size={16} />
                    {category.name}
                    {document && document.category === category.name && (
                      <FiCheck className="ml-2 text-green-500" size={16} />
                    )}
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                  )}
                </div>
                
                <div className="flex">
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategoryId(category.id);
                    }}
                  >
                    <FiEdit2 size={16} />
                  </button>
                  
                  {category.name !== 'Uncategorized' && (
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-red-600 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCategory(category.id);
                      }}
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager; 
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiX, FiTrash2, FiEdit, FiSave, FiCheck } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import { 
  updateMetadataPreferences,
  addCustomMetadataField,
  removeCustomMetadataField
} from '../../store/slices/documentsSlice';
import { RootState } from '../../store';

interface MetadataPreferencesProps {
  onClose?: () => void;
}

const DEFAULT_METADATA_FIELDS = [
  { id: 'title', name: 'Title', type: 'text' },
  { id: 'author', name: 'Author', type: 'text' },
  { id: 'datePublished', name: 'Date Published', type: 'date' },
  { id: 'language', name: 'Language', type: 'text' },
  { id: 'pageCount', name: 'Page Count', type: 'number' },
  { id: 'keywords', name: 'Keywords', type: 'text' },
  { id: 'securityClassification', name: 'Security Classification', type: 'select' }
];

const MetadataPreferences: React.FC<MetadataPreferencesProps> = ({ onClose }) => {
  const dispatch = useDispatch();
  const metadataPreferences = useSelector((state: RootState) => state.documents.metadataPreferences);
  
  // Local state for form
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'boolean' | 'select'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>(metadataPreferences.visibleFields);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editFieldName, setEditFieldName] = useState('');
  const [editFieldType, setEditFieldType] = useState<'text' | 'number' | 'date' | 'boolean' | 'select'>('text');
  const [editFieldOptions, setEditFieldOptions] = useState('');
  
  // Handle toggling a default field
  const handleToggleField = (fieldId: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };
  
  // Save visible fields preferences
  const handleSavePreferences = () => {
    dispatch(updateMetadataPreferences({
      visibleFields: selectedFields
    }));
    
    if (onClose) {
      onClose();
    }
  };
  
  // Add a new custom field
  const handleAddCustomField = () => {
    if (!newFieldName.trim()) {
      return;
    }
    
    const newField = {
      id: uuidv4(),
      name: newFieldName.trim(),
      type: newFieldType,
      ...(newFieldType === 'select' && newFieldOptions ? { options: newFieldOptions.split(',').map(o => o.trim()) } : {})
    };
    
    dispatch(addCustomMetadataField(newField));
    
    // Reset form
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldOptions('');
  };
  
  // Remove a custom field
  const handleRemoveCustomField = (fieldId: string) => {
    dispatch(removeCustomMetadataField(fieldId));
    
    // Remove from selected fields if present
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(prev => prev.filter(id => id !== fieldId));
    }
    
    // Clear editing state if this field was being edited
    if (editingField === fieldId) {
      setEditingField(null);
    }
  };
  
  // Start editing a custom field
  const handleStartEdit = (field: any) => {
    setEditingField(field.id);
    setEditFieldName(field.name);
    setEditFieldType(field.type);
    setEditFieldOptions(field.options ? field.options.join(', ') : '');
  };
  
  // Save edits to a custom field
  const handleSaveEdit = (fieldId: string) => {
    const updatedCustomFields = metadataPreferences.customFields.map(field => {
      if (field.id === fieldId) {
        return {
          ...field,
          name: editFieldName.trim(),
          type: editFieldType,
          ...(editFieldType === 'select' && editFieldOptions 
            ? { options: editFieldOptions.split(',').map(o => o.trim()) } 
            : { options: undefined })
        };
      }
      return field;
    });
    
    dispatch(updateMetadataPreferences({
      customFields: updatedCustomFields
    }));
    
    setEditingField(null);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingField(null);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-oswald font-bold">Metadata Preferences</h2>
        {onClose && (
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        )}
      </div>
      
      <div className="mb-8">
        <h3 className="text-md font-medium mb-3">Default Metadata Fields</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select which default metadata fields should be visible throughout the application.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {DEFAULT_METADATA_FIELDS.map(field => (
            <div key={field.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                id={`field-${field.id}`}
                checked={selectedFields.includes(field.id)}
                onChange={() => handleToggleField(field.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor={`field-${field.id}`}
                className="ml-2 text-sm text-gray-700 cursor-pointer"
              >
                {field.name}
                <span className="ml-1 text-xs text-gray-500">({field.type})</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-md font-medium mb-3">Custom Metadata Fields</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create custom metadata fields for your organization's specific needs.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name
              </label>
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., Project ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="select">Select (Dropdown)</option>
              </select>
            </div>
            
            {newFieldType === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options (comma separated)
                </label>
                <input
                  type="text"
                  value={newFieldOptions}
                  onChange={(e) => setNewFieldOptions(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
          </div>
          
          <button
            onClick={handleAddCustomField}
            disabled={!newFieldName.trim()}
            className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            <FiPlus size={16} className="mr-1" />
            Add Custom Field
          </button>
        </div>
        
        {metadataPreferences.customFields.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No custom fields added yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {metadataPreferences.customFields.map(field => (
              <li key={field.id} className="py-3">
                {editingField === field.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                    <div>
                      <input
                        type="text"
                        value={editFieldName}
                        onChange={(e) => setEditFieldName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <select
                        value={editFieldType}
                        onChange={(e) => setEditFieldType(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                        <option value="select">Select (Dropdown)</option>
                      </select>
                    </div>
                    
                    {editFieldType === 'select' && (
                      <div>
                        <input
                          type="text"
                          value={editFieldOptions}
                          onChange={(e) => setEditFieldOptions(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`custom-field-${field.id}`}
                          checked={selectedFields.includes(field.id)}
                          onChange={() => handleToggleField(field.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`custom-field-${field.id}`}
                          className="ml-2 text-sm font-medium text-gray-700"
                        >
                          {field.name}
                        </label>
                      </div>
                      <div className="ml-6 text-xs text-gray-500">
                        Type: {field.type}
                        {field.options && field.options.length > 0 && (
                          <span> • Options: {field.options.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartEdit(field)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit field"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete field"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                {editingField === field.id && (
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-600 hover:text-gray-800 px-2 py-1 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(field.id)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      <FiSave size={14} className="inline mr-1" />
                      Save Changes
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        {onClose && (
          <button
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
        )}
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={handleSavePreferences}
        >
          <FiCheck size={16} className="inline mr-1" />
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default MetadataPreferences; 
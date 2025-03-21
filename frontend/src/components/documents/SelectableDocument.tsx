import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiFile, FiFolder, FiCheck, FiSquare, FiCheckSquare } from 'react-icons/fi';
import { Document as DocType, toggleDocumentSelection, selectDocument } from '../../store/slices/documentsSlice';
import { RootState } from '../../store';
import DocumentTags from './DocumentTags';

interface SelectableDocumentProps {
  document: DocType;
}

const SelectableDocument: React.FC<SelectableDocumentProps> = ({ document }) => {
  const dispatch = useDispatch();
  const selectedDocumentId = useSelector((state: RootState) => state.documents.selectedDocumentId);
  const selectedDocumentIds = useSelector((state: RootState) => state.documents.selectedDocumentIds);
  const batchOperationMode = useSelector((state: RootState) => state.documents.batchOperationMode);
  
  const isSelected = selectedDocumentIds.includes(document.id);
  const isActive = selectedDocumentId === document.id;
  
  const handleClick = (e: React.MouseEvent) => {
    if (batchOperationMode) {
      // In batch mode, clicking the document toggles selection
      dispatch(toggleDocumentSelection(document.id));
    } else {
      // In normal mode, clicking selects the document for viewing
      dispatch(selectDocument(document.id));
    }
  };
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent document selection
    dispatch(toggleDocumentSelection(document.id));
  };
  
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
        isActive && !batchOperationMode ? 'border-blue-500 bg-blue-50' : 
        isSelected && batchOperationMode ? 'border-blue-300 bg-blue-50' : 
        'hover:border-blue-300 hover:bg-blue-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {batchOperationMode && (
            <div 
              className="mr-2 cursor-pointer"
              onClick={handleCheckboxClick}
            >
              {isSelected ? 
                <FiCheckSquare size={18} className="text-blue-600" /> : 
                <FiSquare size={18} className="text-gray-400" />
              }
            </div>
          )}
          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <FiFile className="text-[#182241]" size={20} />
          </div>
        </div>
        
        <div className="flex items-center">
          {document.status === 'complete' && (
            <span className="flex items-center text-xs text-green-600 mr-2">
              <FiCheck size={12} className="mr-1" /> Valid
            </span>
          )}
          {document.status === 'error' && (
            <span className="flex items-center text-xs text-red-600 mr-2">
              Error
            </span>
          )}
        </div>
      </div>
      
      <h3 className="font-medium mb-1 truncate">{document.name}</h3>
      
      <div className="flex items-center text-xs text-gray-500 mb-2">
        <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
        <span className="mx-1">•</span>
        <span>{(document.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
      
      {/* Display document tags */}
      {document.tags && document.tags.length > 0 && (
        <DocumentTags tags={document.tags} className="mt-2" />
      )}
      
      {/* Display document category */}
      {document.category && (
        <div className="mt-2 flex items-center">
          <div className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded flex items-center">
            <FiFolder className="mr-1" size={10} />
            {document.category}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectableDocument; 
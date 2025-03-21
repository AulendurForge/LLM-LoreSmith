import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { FiClock, FiEye, FiChevronRight, FiX, FiFile } from 'react-icons/fi';
import { selectDocument, Document as DocType } from '../store/slices/documentsSlice';

interface RecentlyViewedProps {
  document?: DocType;
  maxItems?: number;
}

interface RecentDocument {
  id: string;
  name: string;
  type: string;
  viewedAt: string;
}

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ document, maxItems = 5 }) => {
  const dispatch = useDispatch();
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  
  // Load recent documents from localStorage on mount
  useEffect(() => {
    const storedRecents = localStorage.getItem('recentlyViewedDocuments');
    if (storedRecents) {
      try {
        const parsedRecents = JSON.parse(storedRecents);
        setRecentDocuments(parsedRecents);
      } catch (err) {
        console.error('Failed to parse recently viewed documents:', err);
        // Reset if corrupted
        localStorage.removeItem('recentlyViewedDocuments');
      }
    }
  }, []);
  
  // Add current document to recently viewed
  useEffect(() => {
    if (!document) return;
    
    // Create a new recent document entry
    const recentDoc: RecentDocument = {
      id: document.id,
      name: document.name,
      type: document.type,
      viewedAt: new Date().toISOString()
    };
    
    setRecentDocuments(prevRecents => {
      // Remove if already exists
      const filteredRecents = prevRecents.filter(doc => doc.id !== document.id);
      
      // Add to the beginning of the array
      const updatedRecents = [recentDoc, ...filteredRecents].slice(0, maxItems);
      
      // Save to localStorage
      localStorage.setItem('recentlyViewedDocuments', JSON.stringify(updatedRecents));
      
      return updatedRecents;
    });
  }, [document, maxItems]);
  
  // Handle removing an item from recently viewed
  const handleRemoveRecent = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setRecentDocuments(prevRecents => {
      const updatedRecents = prevRecents.filter(doc => doc.id !== id);
      localStorage.setItem('recentlyViewedDocuments', JSON.stringify(updatedRecents));
      return updatedRecents;
    });
  };
  
  // Handle clearing all recent items
  const handleClearRecents = () => {
    setRecentDocuments([]);
    localStorage.removeItem('recentlyViewedDocuments');
  };
  
  // Handle selecting a document from the recents list
  const handleSelectDocument = (id: string) => {
    dispatch(selectDocument(id));
  };
  
  // Format relative time for viewedAt
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // If no recent documents, display nothing
  if (recentDocuments.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="font-semibold flex items-center">
          <FiClock className="mr-2 text-gray-500" />
          Recently Viewed
        </h3>
        
        {recentDocuments.length > 0 && (
          <button 
            onClick={handleClearRecents}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        )}
      </div>
      
      <ul className="divide-y divide-gray-100">
        {recentDocuments.map(doc => (
          <li key={doc.id} className="hover:bg-gray-50">
            <button
              className="w-full p-3 text-left flex items-center"
              onClick={() => handleSelectDocument(doc.id)}
            >
              <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center mr-3">
                <FiFile className="text-[#182241]" size={16} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                <span className="text-xs text-gray-500 flex items-center mt-1">
                  <FiEye className="mr-1" size={12} />
                  {formatRelativeTime(doc.viewedAt)}
                </span>
              </div>
              
              <div className="ml-3 flex items-center">
                <button
                  onClick={(e) => handleRemoveRecent(doc.id, e)}
                  className="p-1 text-gray-400 hover:text-gray-600 mr-1"
                  aria-label="Remove from recently viewed"
                >
                  <FiX size={14} />
                </button>
                <FiChevronRight className="text-gray-400" size={16} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentlyViewed; 
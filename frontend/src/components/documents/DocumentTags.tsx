import React from 'react';
import { FiTag } from 'react-icons/fi';

interface DocumentTagsProps {
  tags?: string[];
  className?: string;
  onClick?: (tag: string) => void;
}

const DocumentTags: React.FC<DocumentTagsProps> = ({ 
  tags = [], 
  className = '',
  onClick 
}) => {
  // If there are no tags, return null
  if (!tags || tags.length === 0) return null;
  
  // Try to get the tags with colors from localStorage
  const storedTagsString = localStorage.getItem('documentTags');
  const storedTags = storedTagsString ? JSON.parse(storedTagsString) : [];
  
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag, index) => {
        // Find the tag color if it exists in stored tags
        const tagObj = storedTags.find((t: any) => t.name === tag);
        
        return (
          <span 
            key={index}
            className={`px-2 py-0.5 text-xs rounded-full text-white flex items-center ${onClick ? 'cursor-pointer' : ''}`}
            style={{ backgroundColor: tagObj?.color || '#888' }}
            onClick={() => onClick && onClick(tag)}
          >
            {tags.length === 1 && <FiTag className="mr-1" size={10} />}
            {tag}
          </span>
        );
      })}
    </div>
  );
};

export default DocumentTags; 
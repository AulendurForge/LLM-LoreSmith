import React from 'react';
import { useDispatch } from 'react-redux';
import { FiHeart } from 'react-icons/fi';
import { toggleFavorite } from '../../store/slices/documentsSlice';

interface FavoriteButtonProps {
  documentId: string;
  isFavorite?: boolean;
  className?: string;
  size?: number;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  documentId, 
  isFavorite = false, 
  className = '',
  size = 16
}) => {
  const dispatch = useDispatch();
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent document selection when clicking favorite
    dispatch(toggleFavorite(documentId));
  };
  
  return (
    <button 
      className={`transition-colors duration-200 focus:outline-none ${className}`}
      onClick={handleToggleFavorite}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite ? (
        <FiHeart 
          className="text-red-500 fill-current" 
          size={size}
        />
      ) : (
        <FiHeart 
          className="text-gray-400 hover:text-red-500" 
          size={size}
        />
      )}
    </button>
  );
};

export default FavoriteButton; 
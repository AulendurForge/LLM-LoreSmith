import React from 'react';
import { FiHeart } from 'react-icons/fi';

interface FavoritesFilterProps {
  showOnlyFavorites: boolean;
  onToggle: () => void;
  className?: string;
}

const FavoritesFilter: React.FC<FavoritesFilterProps> = ({
  showOnlyFavorites,
  onToggle,
  className = '',
}) => {
  return (
    <button
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
        showOnlyFavorites 
          ? 'bg-red-50 text-red-600 border border-red-200' 
          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
      } ${className}`}
      onClick={onToggle}
      title={showOnlyFavorites ? "Show all documents" : "Show only favorites"}
    >
      <FiHeart 
        className={showOnlyFavorites ? "fill-current" : ""} 
        size={14} 
      />
      <span>Favorites</span>
    </button>
  );
};

export default FavoritesFilter; 
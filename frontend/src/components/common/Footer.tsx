import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-3 px-6 shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-2 md:mb-0">
          <p className="text-sm text-gray-600">
            &copy; {year} LLM LoreSmith. All rights reserved.
          </p>
        </div>
        
        <div className="flex space-x-6">
          <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
            Terms
          </Link>
          <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
            Privacy
          </Link>
          <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-700">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
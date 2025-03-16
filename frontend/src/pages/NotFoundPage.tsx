import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center px-4">
      <FiAlertTriangle className="text-[#182241] mb-6" size={64} />
      
      <h1 className="text-5xl font-oswald font-bold text-[#182241] mb-4">
        404
      </h1>
      
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      
      <p className="text-gray-600 max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      <Link to="/" className="btn btn-primary px-6 py-3">
        Return to Home
      </Link>
    </div>
  );
};

export default NotFoundPage; 
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText, 
  FiDatabase, 
  FiCpu, 
  FiBarChart2, 
  FiSettings,
  FiX,
  FiHelpCircle
} from 'react-icons/fi';

export interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  // Define consistent icon size
  const iconSize = 20;

  return (
    <div 
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-sm z-40 transition-all duration-300 ${
        isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
      }`}
    >
      {/* Mobile close button */}
      <button 
        className="md:hidden absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100"
        onClick={toggleSidebar}
      >
        <FiX size={iconSize} />
      </button>

      {/* Sidebar Content */}
      <div className="flex flex-col h-full py-6 overflow-y-auto">
        {/* Main Navigation */}
        <div className="px-4 mb-8">
          <h3 className={`text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 ${!isOpen && 'md:hidden'}`}>
            Main
          </h3>
          <nav className="space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!isOpen && 'md:justify-center'}`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FiHome size={iconSize} />
              </div>
              <span className={`ml-3 ${!isOpen ? 'md:hidden' : ''}`}>Home</span>
            </NavLink>
            
            <NavLink
              to="/documents"
              className={({ isActive }) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!isOpen && 'md:justify-center'}`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FiFileText size={iconSize} />
              </div>
              <span className={`ml-3 ${!isOpen ? 'md:hidden' : ''}`}>Documents</span>
            </NavLink>
            
            <NavLink
              to="/datasets"
              className={({ isActive }) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!isOpen && 'md:justify-center'}`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FiDatabase size={iconSize} />
              </div>
              <span className={`ml-3 ${!isOpen ? 'md:hidden' : ''}`}>Datasets</span>
            </NavLink>
            
            <NavLink
              to="/models"
              className={({ isActive }) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!isOpen && 'md:justify-center'}`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FiCpu size={iconSize} />
              </div>
              <span className={`ml-3 ${!isOpen ? 'md:hidden' : ''}`}>Models</span>
            </NavLink>
            
            <NavLink
              to="/reports"
              className={({ isActive }) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!isOpen && 'md:justify-center'}`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FiBarChart2 size={iconSize} />
              </div>
              <span className={`ml-3 ${!isOpen ? 'md:hidden' : ''}`}>Reports</span>
            </NavLink>
          </nav>
        </div>
        
        {/* Settings Section */}
        <div className="px-4 mb-8">
          <h3 className={`text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 ${!isOpen && 'md:hidden'}`}>
            Settings
          </h3>
          <nav className="space-y-1">
            <NavLink
              to="/settings"
              className={({ isActive }) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!isOpen && 'md:justify-center'}`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FiSettings size={iconSize} />
              </div>
              <span className={`ml-3 ${!isOpen ? 'md:hidden' : ''}`}>Settings</span>
            </NavLink>
          </nav>
        </div>
        
        {/* Help Section */}
        <div className="mt-auto px-4">
          <a 
            href="https://docs.example.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 ${!isOpen && 'md:justify-center'}`}
          >
            <div className="flex items-center justify-center w-6 h-6">
              <FiHelpCircle size={iconSize} />
            </div>
            <span className={`ml-3 ${!isOpen ? 'md:hidden' : ''}`}>Help</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 
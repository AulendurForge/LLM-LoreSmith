import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiX, 
  FiHome, 
  FiFile, 
  FiDatabase, 
  FiCpu, 
  FiSettings, 
  FiHelpCircle,
  FiBook,
  FiBarChart2,
  FiUsers
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-72 h-full bg-white shadow-xl transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-oswald text-[#182241] font-bold">Navigation</h2>
          <button 
            onClick={onClose}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <nav className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="space-y-1">
            <h3 className="font-medium text-gray-400 uppercase text-xs tracking-wider px-3 mb-2">Main</h3>
            <NavLink 
              to="/"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
              end
            >
              <FiHome className="mr-3" size={18} />
              <span>Home</span>
            </NavLink>
            
            <NavLink 
              to="/documents"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <FiFile className="mr-3" size={18} />
              <span>Documents</span>
            </NavLink>
            
            <NavLink 
              to="/datasets"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <FiDatabase className="mr-3" size={18} />
              <span>Datasets</span>
            </NavLink>
            
            <NavLink 
              to="/models"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <FiCpu className="mr-3" size={18} />
              <span>Models</span>
            </NavLink>
            
            <NavLink 
              to="/reports"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <FiBarChart2 className="mr-3" size={18} />
              <span>Reports</span>
            </NavLink>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-400 uppercase text-xs tracking-wider px-3 mb-2">Settings & Support</h3>
            <div className="space-y-1">
              <NavLink 
                to="/settings"
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <FiSettings className="mr-3" size={18} />
                <span>Settings</span>
              </NavLink>
              
              <NavLink 
                to="/teams"
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <FiUsers className="mr-3" size={18} />
                <span>Teams</span>
              </NavLink>
              
              <NavLink 
                to="/documentation"
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <FiBook className="mr-3" size={18} />
                <span>Documentation</span>
              </NavLink>
              
              <NavLink 
                to="/help"
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#182241]/10 text-[#182241] font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <FiHelpCircle className="mr-3" size={18} />
                <span>Help & Support</span>
              </NavLink>
            </div>
          </div>
          
          <div className="mt-auto pt-6">
            <div className="bg-[#182241]/5 rounded-lg p-4">
              <h4 className="font-medium text-[#182241] mb-2">Need help?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Have questions about using LLM LoreSmith?
              </p>
              <a 
                href="#" 
                className="inline-flex items-center text-sm text-[#182241] font-medium hover:underline"
              >
                <FiHelpCircle className="mr-1" size={16} />
                View Documentation
              </a>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar; 
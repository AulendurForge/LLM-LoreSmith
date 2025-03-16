import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMenu, FiUser, FiHelpCircle, FiSettings, FiSearch } from 'react-icons/fi';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="bg-gradient-to-r from-[#182241] to-[#213C4E] text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="mr-4 p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Toggle navigation"
            >
              <FiMenu size={22} />
            </button>
            <Link to="/" className="flex items-center group">
              <span className="font-oswald text-2xl font-bold tracking-wide group-hover:text-[#7B949C] transition-all duration-200">
                LLM <span className="text-[#7B949C] group-hover:text-white transition-all duration-200">LoreSmith</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink 
              to="/documents" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white font-medium' 
                    : 'hover:bg-white/5 text-gray-100'
                }`
              }
            >
              Documents
            </NavLink>
            <NavLink 
              to="/datasets" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white font-medium' 
                    : 'hover:bg-white/5 text-gray-100'
                }`
              }
            >
              Datasets
            </NavLink>
            <NavLink 
              to="/models" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white font-medium' 
                    : 'hover:bg-white/5 text-gray-100'
                }`
              }
            >
              Models
            </NavLink>
          </nav>
          
          {/* Search and Action Buttons */}
          <div className="flex items-center space-x-1">
            <div className="hidden md:flex relative mr-2">
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-1.5 bg-white/10 text-white placeholder-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all w-40 focus:w-60"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={16} />
            </div>
            
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Help"
              title="Help"
            >
              <FiHelpCircle size={20} />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Settings"
              title="Settings"
            >
              <FiSettings size={20} />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="User account"
              title="Account"
            >
              <FiUser size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
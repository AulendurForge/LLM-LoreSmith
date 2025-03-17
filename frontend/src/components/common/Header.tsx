import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiChevronDown } from 'react-icons/fi';

// Safer way to import images
const logoPath = '/assets/Aulendur White Logo and Name No Background.png';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  return (
    <header className="bg-gradient-to-r from-[#182241] to-[#213C4E] text-white shadow-md z-50">
      <div className="h-16 px-4 md:px-6 mx-auto flex items-center justify-between">
        {/* Left Section: Menu Toggle and Logo */}
        <div className="flex items-center h-full">
          <button 
            onClick={toggleSidebar}
            className="mr-3 p-2 rounded-full hover:bg-white/10 transition-colors duration-200 focus:outline-none"
            aria-label="Toggle navigation"
          >
            <FiMenu size={20} />
          </button>
          
          <Link to="/" className="flex items-center">
            <div className="flex items-center">
              {!logoLoaded && (
                <div className="flex h-8 w-8 rounded-full bg-[#5C798B] items-center justify-center mr-3">
                  <span className="font-oswald text-lg font-bold">A</span>
                </div>
              )}
              <img 
                src={logoPath}
                alt="Aulendur LLC" 
                className={`h-9 mr-3 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`} 
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoLoaded(false)}
              />
              <span className="font-oswald text-xl font-bold tracking-wide">
                LLM <span className="text-[#8b9fa8]">LoreSmith</span>
              </span>
            </div>
          </Link>
        </div>
        
        {/* Right: User Actions */}
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="w-56 bg-white/10 text-white rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 placeholder-gray-300"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={14} />
          </div>
          
          {/* Notifications */}
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 relative hidden md:flex items-center justify-center">
            <FiBell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-white/10 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-[#5C798B] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">AU</span>
              </div>
              <span className="hidden md:inline text-sm font-medium">Admin</span>
              <FiChevronDown className="hidden md:block" size={16} />
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 text-gray-800 z-50 border border-gray-200">
                <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">Your Profile</Link>
                <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-gray-100">Settings</Link>
                <div className="border-t border-gray-100 my-1"></div>
                <Link to="/logout" className="block px-4 py-2 text-sm hover:bg-gray-100">Sign out</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
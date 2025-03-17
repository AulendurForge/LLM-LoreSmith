import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Sticky at the top */}
      <div className="sticky top-0 z-50">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Fixed on the left */}
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Main Content - Scrollable with proper spacing and dynamic width */}
        <div 
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'
          }`}
        >
          <main className="flex-1 overflow-y-auto pt-6 px-6 pb-20">
            <Outlet />
          </main>
          
          {/* Footer - Sticky at the bottom */}
          <div className="sticky bottom-0 z-40 w-full">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 
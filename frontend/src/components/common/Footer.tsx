import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiMail, FiExternalLink } from 'react-icons/fi';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-r from-[#182241] to-[#213C4E] text-white pt-12 pb-8 mt-12 shadow-inner">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-oswald font-bold mb-4">
              LLM <span className="text-[#7B949C]">LoreSmith</span>
            </h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Democratize AI fine-tuning while maintaining the highest standards for data security, model quality, and user experience. Fine-tune large language models using your own credible, authoritative documents and references.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all duration-200"
                aria-label="GitHub"
              >
                <FiGithub size={18} />
              </a>
              <a 
                href="mailto:info@example.com" 
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all duration-200"
                aria-label="Email"
              >
                <FiMail size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-oswald font-bold mb-4 text-[#7B949C]">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/documents" className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center">
                  Documents
                </Link>
              </li>
              <li>
                <Link to="/datasets" className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center">
                  Datasets
                </Link>
              </li>
              <li>
                <Link to="/models" className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center">
                  Models
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-oswald font-bold mb-4 text-[#7B949C]">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/documentation" className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center">
                  Help Center
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.aulendur.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center"
                >
                  Aulendur LLC
                  <FiExternalLink size={14} className="ml-1 opacity-75" />
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-white transition-all duration-200 inline-flex items-center">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">
            &copy; {currentYear} Aulendur LLC. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-all duration-200">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-all duration-200">
              Privacy
            </Link>
            <Link to="/cookies" className="text-sm text-gray-400 hover:text-white transition-all duration-200">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
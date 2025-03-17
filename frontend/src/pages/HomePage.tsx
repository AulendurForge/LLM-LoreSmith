import React from 'react';
import { Link } from 'react-router-dom';
import { FiFile, FiDatabase, FiCpu, FiBarChart2, FiShield, FiUsers } from 'react-icons/fi';

const HomePage: React.FC = () => {
  return (
    <div className="fade-in">
      <section className="py-12 text-center">
        <div className="flex justify-center mb-6">
          <img 
            src="/assets/LLM LoreSmith.png" 
            alt="LLM LoreSmith Logo" 
            className="w-[300px] h-auto"
          />
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-[#182241] mb-6">
          LLM LoreSmith
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-1">
          Democratize LLM fine-tuning with your own credible & authoritative documents.
        </p>
        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-1">
          Create custom AI models that understand your domain, all without ML expertise.
        </p>
      </section>
      
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-oswald font-bold text-[#182241] text-center mb-8">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white px-8 py-5 rounded-lg shadow-md flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-[#182241] text-white rounded-full flex items-center justify-center mr-4">
                  <FiFile size={24} />
                </div>
                <h3 className="text-xl font-oswald font-bold">1. Document Ingestion</h3>
              </div>
              <p className="text-gray-600">
                Simply upload your documents and let LoreSmith handle the rest. Our system automatically validates content quality, extracts metadata, and securely stores your materials with full privacy protection.
              </p>
            </div>
            
            <div className="bg-white px-8 py-5 rounded-lg shadow-md flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-[#213C4E] text-white rounded-full flex items-center justify-center mr-4">
                  <FiDatabase size={24} />
                </div>
                <h3 className="text-xl font-oswald font-bold">2. Dataset Generation</h3>
              </div>
              <p className="text-gray-600">
                Skip the painstaking manual work of creating training data. Our multistage pipeline intelligently extracts and formats training samples while preserving the semantic integrity of your source materials.
              </p>
            </div>
            
            <div className="bg-white px-8 py-5 rounded-lg shadow-md flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-[#5C798B] text-white rounded-full flex items-center justify-center mr-4">
                  <FiCpu size={24} />
                </div>
                <h3 className="text-xl font-oswald font-bold">3. Model Fine-Tuning</h3>
              </div>
              <p className="text-gray-600">
                No PhD required. Our adaptive training system automatically optimizes parameters, prevents overfitting, and handles the complexity of model fine-tuning, delivering results that would normally require ML expertise.
              </p>
            </div>
            
            <div className="bg-white px-8 py-5 rounded-lg shadow-md flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-[#7B949C] text-white rounded-full flex items-center justify-center mr-4">
                  <FiBarChart2 size={24} />
                </div>
                <h3 className="text-xl font-oswald font-bold">4. Evaluation & Testing</h3>
              </div>
              <p className="text-gray-600">
                Instantly test your fine-tuned models and visualize key performance metrics. Get AI-powered recommendations on how to improve results, whether by adding more documents or adjusting training parameters.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/documents" className="btn btn-primary px-6 py-3 text-lg">
              Get Started
            </Link>
            <Link to="/documentation" className="btn btn-outline px-6 py-3 text-lg">
              Learn More
            </Link>
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-oswald font-bold text-[#182241] text-center mb-8">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start p-4">
              <div className="bg-[#182241] text-white rounded-full p-2 mr-4">
                <FiShield size={16} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">All processing runs locally or in your secure cloud environment with encryption and access controls.</p>
              </div>
            </div>
            
            <div className="flex items-start p-4">
              <div className="bg-[#182241] text-white rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Scalable Architecture</h3>
                <p className="text-gray-600">Works equally well on a personal laptop or a distributed cloud system with production-grade performance.</p>
              </div>
            </div>
            
            <div className="flex items-start p-4">
              <div className="bg-[#182241] text-white rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Multiple Training Schemas</h3>
                <p className="text-gray-600">Support for instruction-response pairs, Q&A, summarization, classification and custom formats.</p>
              </div>
            </div>
            
            <div className="flex items-start p-4">
              <div className="bg-[#182241] text-white rounded-full p-2 mr-4">
                <FiBarChart2 size={16} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Comprehensive Evaluation</h3>
                <p className="text-gray-600">Advanced benchmarking tools to evaluate and compare model performance with visual analytics.</p>
              </div>
            </div>

            <div className="flex items-start p-4">
              <div className="bg-[#182241] text-white rounded-full p-2 mr-4">
                <FiUsers size={16} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Collaboration Features</h3>
                <p className="text-gray-600">Team-based workflows for enterprise users with role-based access control and activity tracking.</p>
              </div>
            </div>
            
            <div className="flex items-start p-4">
              <div className="bg-[#182241] text-white rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Built-in LLM Assistant</h3>
                <p className="text-gray-600">Get guidance at every step with an integrated AI assistant that helps you through the entire process.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-[#182241] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-oswald font-bold mb-8">Ready to Create Your Custom AI?</h2>
          <Link to="/documents" className="btn bg-white text-[#182241] hover:bg-gray-100 px-6 py-3 text-lg">
            Upload Your First Document
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 
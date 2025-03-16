import React from 'react';
import { Link } from 'react-router-dom';
import { FiFile, FiDatabase, FiCpu } from 'react-icons/fi';

const HomePage: React.FC = () => {
  return (
    <div className="fade-in">
      <section className="py-12 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-[#182241] mb-6">
          LLM LoreSmith
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
          Fine-tune large language models with your own authoritative documents and references.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/documents" className="btn btn-primary px-6 py-3 text-lg">
            Get Started
          </Link>
          <Link to="/documentation" className="btn btn-outline px-6 py-3 text-lg">
            Learn More
          </Link>
        </div>
      </section>
      
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-oswald font-bold text-[#182241] text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-[#182241] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <FiFile size={28} />
              </div>
              <h3 className="text-xl font-oswald font-bold mb-3">1. Document Ingestion</h3>
              <p className="text-gray-600">
                Upload your trusted documents, references, and source materials with automatic validation and metadata extraction.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-[#213C4E] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <FiDatabase size={28} />
              </div>
              <h3 className="text-xl font-oswald font-bold mb-3">2. Dataset Generation</h3>
              <p className="text-gray-600">
                Automatically extract meaningful training samples from your documents with our sophisticated processing pipeline.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-[#5C798B] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCpu size={28} />
              </div>
              <h3 className="text-xl font-oswald font-bold mb-3">3. Model Fine-Tuning</h3>
              <p className="text-gray-600">
                Fine-tune large language models on your customized dataset with adaptive training that optimizes performance.
              </p>
            </div>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">All processing runs locally or in your secure cloud environment.</p>
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
                <p className="text-gray-600">Works equally well on a personal laptop or a distributed cloud system.</p>
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
                <p className="text-gray-600">Support for various training formats beyond standard question-answer pairs.</p>
              </div>
            </div>
            
            <div className="flex items-start p-4">
              <div className="bg-[#182241] text-white rounded-full p-2 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Comprehensive Evaluation</h3>
                <p className="text-gray-600">Advanced benchmarking tools to evaluate and compare model performance.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-[#182241] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-oswald font-bold mb-8">Ready to Get Started?</h2>
          <Link to="/documents" className="btn bg-white text-[#182241] hover:bg-gray-100 px-6 py-3 text-lg">
            Upload Your First Document
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 
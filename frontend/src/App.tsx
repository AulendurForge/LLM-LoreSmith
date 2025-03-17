import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DocumentsPage from './pages/DocumentsPage';
import NotFoundPage from './pages/NotFoundPage';
import MainLayout from './layouts/MainLayout';

// Styles
import './styles/App.css';

const App: React.FC = () => {
  console.log('App component rendering');
  
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App; 
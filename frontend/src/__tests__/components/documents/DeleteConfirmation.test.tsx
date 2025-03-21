import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toast } from 'react-toastify';
import DeleteConfirmation from '../../../components/documents/DeleteConfirmation';
import { deleteDocument as deleteDocumentAPI } from '../../../api/documentsApi';

// Mock the documentsApi module
vi.mock('../../../api/documentsApi', () => ({
  deleteDocument: vi.fn()
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('DeleteConfirmation Component', () => {
  // Test document for all tests
  const mockDocument = {
    id: 'test-doc-123',
    name: 'Test Document.pdf',
    size: 1024,
    type: 'application/pdf',
    uploadedAt: new Date().toISOString(),
    status: 'complete' as const,
    progress: 100,
    tags: ['test'],
    category: 'Test',
    isFavorite: false
  };
  
  // Mock functions
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render correctly with document name', () => {
    // Arrange & Act
    render(
      <DeleteConfirmation 
        document={mockDocument}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Assert
    expect(screen.getByText('Delete Document')).toBeInTheDocument();
    expect(screen.getByText(`Are you sure you want to delete ${mockDocument.name}?`)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  
  it('should call onCancel when Cancel button is clicked', () => {
    // Arrange
    render(
      <DeleteConfirmation 
        document={mockDocument}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Act
    fireEvent.click(screen.getByText('Cancel'));
    
    // Assert
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
  
  it('should call API and onConfirm when Delete button is clicked', async () => {
    // Arrange
    (deleteDocumentAPI as any).mockResolvedValueOnce({ message: 'Success' });
    
    render(
      <DeleteConfirmation 
        document={mockDocument}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Act
    fireEvent.click(screen.getByText('Delete'));
    
    // Assert
    expect(deleteDocumentAPI).toHaveBeenCalledWith(mockDocument.id);
    
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(mockDocument.id);
      expect(toast.success).toHaveBeenCalled();
    });
  });
  
  it('should show error message when API call fails', async () => {
    // Arrange
    const apiError = new Error('API Error');
    (deleteDocumentAPI as any).mockRejectedValueOnce(apiError);
    
    render(
      <DeleteConfirmation 
        document={mockDocument}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Act
    fireEvent.click(screen.getByText('Delete'));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Failed to delete document. Please try again.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });
  
  it('should show "Remove from UI" button when document is not found on server', async () => {
    // Arrange
    const notFoundError = {
      response: { status: 404 },
      name: 'Error',
      message: 'Document not found on server'
    };
    (deleteDocumentAPI as any).mockRejectedValueOnce(notFoundError);
    
    render(
      <DeleteConfirmation 
        document={mockDocument}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Act
    fireEvent.click(screen.getByText('Delete'));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Document not found on server. You can remove it from the UI.')).toBeInTheDocument();
      expect(screen.getByText('Remove from UI')).toBeInTheDocument();
    });
    
    // Act again - click Remove from UI
    fireEvent.click(screen.getByText('Remove from UI'));
    
    // Assert
    expect(mockOnConfirm).toHaveBeenCalledWith(mockDocument.id);
    expect(toast.info).toHaveBeenCalled();
  });
}); 
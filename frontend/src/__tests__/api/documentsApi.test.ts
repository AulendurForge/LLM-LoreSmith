import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteDocument } from '../../api/documentsApi';
import apiClient from '../../api/client';

// Mock the Axios client
vi.mock('../../api/client', () => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn()
}));

describe('documentsApi', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteDocument', () => {
    it('should call the API with correct URL and return the response data', async () => {
      // Arrange: Mock successful API response
      const mockResponse = {
        data: {
          success: true,
          message: 'Document deleted successfully'
        }
      };
      
      (apiClient.delete as any).mockResolvedValueOnce(mockResponse);
      
      // Act: Call the function
      const result = await deleteDocument('test-doc-id-123');
      
      // Assert: Verify API was called correctly
      expect(apiClient.delete).toHaveBeenCalledWith('/documents/test-doc-id-123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle 404 error when document is not found', async () => {
      // Arrange: Mock 404 error response
      const errorResponse = {
        response: {
          status: 404,
          data: {
            success: false,
            error: {
              message: 'Document with ID test-doc-id-123 not found',
              statusCode: 404
            }
          }
        }
      };
      
      (apiClient.delete as any).mockRejectedValueOnce(errorResponse);
      
      // Act & Assert: Verify error handling
      await expect(deleteDocument('test-doc-id-123')).rejects.toThrow('Document not found');
    });

    it('should handle other API errors', async () => {
      // Arrange: Mock server error
      const errorResponse = {
        response: {
          status: 500,
          data: {
            success: false,
            error: {
              message: 'Internal server error',
              statusCode: 500
            }
          }
        }
      };
      
      (apiClient.delete as any).mockRejectedValueOnce(errorResponse);
      
      // Act & Assert: Verify error handling
      await expect(deleteDocument('test-doc-id-123')).rejects.toThrowError();
    });

    it('should handle network errors', async () => {
      // Arrange: Mock network error
      const networkError = new Error('Network Error');
      
      (apiClient.delete as any).mockRejectedValueOnce(networkError);
      
      // Act & Assert: Verify error handling
      await expect(deleteDocument('test-doc-id-123')).rejects.toThrow('Network Error');
    });
  });
}); 
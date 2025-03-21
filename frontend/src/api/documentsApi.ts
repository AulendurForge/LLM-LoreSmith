import apiClient from './client';
import { Document, DocumentVersion } from '../store/slices/documentsSlice';

// API endpoints
const DOCUMENTS_ENDPOINT = '/documents';

// Interface for document upload response
interface DocumentUploadResponse {
  document: Document;
  message: string;
}

// Interface for document list response
interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
}

// Interface for document metadata response
interface DocumentMetadataResponse {
  metadata: Document['metadata'];
  message: string;
}

// Interface for document update response
interface DocumentUpdateResponse {
  document: Document;
  message: string;
}

// Get all documents with pagination
export const getDocuments = async (page = 1, limit = 10) => {
  const response = await apiClient.get<DocumentListResponse>(
    `${DOCUMENTS_ENDPOINT}?page=${page}&limit=${limit}`
  );
  return response.data;
};

// Get a single document by ID
export const getDocumentById = async (id: string) => {
  const response = await apiClient.get<{ document: Document }>(
    `${DOCUMENTS_ENDPOINT}/${id}`
  );
  return response.data.document;
};

// Upload a document
export const uploadDocument = async (file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<DocumentUploadResponse>(
    DOCUMENTS_ENDPOINT,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }
  );
  
  return response.data;
};

// Update document metadata
export const updateDocumentMetadata = async (id: string, metadata: Partial<Document['metadata']>) => {
  const response = await apiClient.patch<DocumentMetadataResponse>(
    `${DOCUMENTS_ENDPOINT}/${id}/metadata`,
    { metadata }
  );
  return response.data;
};

// Update document (basic info)
export const updateDocument = async (id: string, data: Partial<Pick<Document, 'name' | 'type'>>) => {
  const response = await apiClient.patch<DocumentUpdateResponse>(
    `${DOCUMENTS_ENDPOINT}/${id}`,
    data
  );
  return response.data;
};

// Delete a document
export const deleteDocument = async (id: string) => {
  try {
    console.log(`Sending delete request to: ${DOCUMENTS_ENDPOINT}/${id}`);
    const response = await apiClient.delete<{ message: string }>(
      `${DOCUMENTS_ENDPOINT}/${id}`
    );
    console.log('Delete document response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error deleting document with ID ${id}:`, error);
    
    // Format error response for easier handling
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // If document not found, provide a clearer error
      if (error.response.status === 404) {
        const err = new Error('Document not found on server');
        err.name = 'DocumentNotFoundError';
        // Add the response data to the error
        (err as any).response = error.response;
        (err as any).status = 404;
        throw err;
      }
    }
    
    throw error;
  }
};

// Process a document (start extraction)
export const processDocument = async (id: string) => {
  const response = await apiClient.post<{ message: string }>(
    `${DOCUMENTS_ENDPOINT}/${id}/process`
  );
  return response.data;
};

// Get document processing status
export const getDocumentStatus = async (id: string) => {
  const response = await apiClient.get<{ status: Document['status']; progress: number }>(
    `${DOCUMENTS_ENDPOINT}/${id}/status`
  );
  return response.data;
};

// Get document versions
export const getDocumentVersions = async (id: string) => {
  const response = await apiClient.get<{ versions: DocumentVersion[], currentVersion: number }>(
    `${DOCUMENTS_ENDPOINT}/${id}/versions`
  );
  return response.data;
};

// Create a new document version
export const createDocumentVersion = async (
  id: string, 
  file?: File, 
  changes?: string
) => {
  const formData = new FormData();
  
  if (file) {
    formData.append('file', file);
  }
  
  if (changes) {
    formData.append('changes', changes);
  }
  
  const response = await apiClient.post<{ version: DocumentVersion }>(
    `${DOCUMENTS_ENDPOINT}/${id}/versions`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data;
};

// Restore a document version
export const restoreDocumentVersion = async (
  documentId: string,
  versionId: string
) => {
  const response = await apiClient.post<{ version: DocumentVersion }>(
    `${DOCUMENTS_ENDPOINT}/${documentId}/versions/${versionId}/restore`
  );
  return response.data;
};

// Delete a document version
export const deleteDocumentVersion = async (
  documentId: string,
  versionId: string
) => {
  const response = await apiClient.delete<{ message: string }>(
    `${DOCUMENTS_ENDPOINT}/${documentId}/versions/${versionId}`
  );
  return response.data;
}; 
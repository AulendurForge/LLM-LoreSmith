import apiClient from './client';
import { Document } from '../store/slices/documentsSlice';

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

// Delete a document
export const deleteDocument = async (id: string) => {
  const response = await apiClient.delete<{ message: string }>(
    `${DOCUMENTS_ENDPOINT}/${id}`
  );
  return response.data;
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
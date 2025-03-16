import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types
export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'error' | 'complete';
  progress: number;
  error?: string;
  metadata?: {
    title?: string;
    author?: string;
    datePublished?: string;
    language?: string;
    pageCount?: number;
    keywords?: string[];
    [key: string]: any;
  };
}

interface DocumentsState {
  documents: Document[];
  selectedDocumentId: string | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DocumentsState = {
  documents: [],
  selectedDocumentId: null,
  loading: false,
  error: null,
};

// Create slice
const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    // Add document to state
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload);
    },
    
    // Add multiple documents
    addDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents.push(...action.payload);
    },
    
    // Remove document by id
    removeDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
      
      // Clear selected document if it was removed
      if (state.selectedDocumentId === action.payload) {
        state.selectedDocumentId = null;
      }
    },
    
    // Update document
    updateDocument: (state, action: PayloadAction<Partial<Document> & { id: string }>) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...action.payload };
      }
    },
    
    // Update document progress
    updateDocumentProgress: (state, action: PayloadAction<{ id: string, progress: number }>) => {
      const { id, progress } = action.payload;
      const index = state.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        state.documents[index].progress = progress;
        
        // Update status based on progress
        if (progress === 100) {
          state.documents[index].status = 'uploaded';
        }
      }
    },
    
    // Update document status
    updateDocumentStatus: (state, action: PayloadAction<{ id: string, status: Document['status'], error?: string }>) => {
      const { id, status, error } = action.payload;
      const index = state.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        state.documents[index].status = status;
        if (error) {
          state.documents[index].error = error;
        }
      }
    },
    
    // Update document metadata
    updateDocumentMetadata: (state, action: PayloadAction<{ id: string, metadata: Document['metadata'] }>) => {
      const { id, metadata } = action.payload;
      const index = state.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        state.documents[index].metadata = { ...state.documents[index].metadata, ...metadata };
      }
    },
    
    // Select document
    selectDocument: (state, action: PayloadAction<string | null>) => {
      state.selectedDocumentId = action.payload;
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Clear all documents
    clearDocuments: (state) => {
      state.documents = [];
      state.selectedDocumentId = null;
    },
  },
});

// Export actions
export const {
  addDocument,
  addDocuments,
  removeDocument,
  updateDocument,
  updateDocumentProgress,
  updateDocumentStatus,
  updateDocumentMetadata,
  selectDocument,
  setLoading,
  setError,
  clearDocuments,
} = documentsSlice.actions;

// Export reducer
export default documentsSlice.reducer; 
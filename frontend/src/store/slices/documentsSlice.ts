import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Validation result interfaces
export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  autoFixable?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  metrics: {
    textQuality: number; // 0-100
    consistency: number; // 0-100
    completeness: number; // 0-100
    relevance: number; // 0-100
    [key: string]: number;
  };
}

// Define version interface
export interface DocumentVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy?: string;
  changes?: string;
  fileSize: number;
  path?: string;
}

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
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  validationResult?: ValidationResult; // Store validation results
  currentVersion?: number;
  versions?: DocumentVersion[];
  metadata?: {
    title?: string;
    author?: string;
    datePublished?: string;
    language?: string;
    pageCount?: number;
    keywords?: string[];
    pii?: boolean;
    securityClassification?: 'N/A' | 'Unclassified' | 'Secret' | 'Top Secret';
    [key: string]: any;
  };
}

interface DocumentsState {
  documents: Document[];
  selectedDocumentId: string | null;
  selectedDocumentIds: string[]; // For batch operations
  loading: boolean;
  error: string | null;
  batchOperationMode: boolean; // To track if batch operation mode is active
  metadataPreferences: {
    visibleFields: string[];
    customFields: {
      id: string;
      name: string;
      type: 'text' | 'number' | 'date' | 'boolean' | 'select';
      options?: string[]; // For select type fields
    }[];
  }
}

// Initial state
const initialState: DocumentsState = {
  documents: [],
  selectedDocumentId: null,
  selectedDocumentIds: [],
  loading: false,
  error: null,
  batchOperationMode: false,
  metadataPreferences: {
    visibleFields: [
      'title',
      'author',
      'datePublished',
      'language',
      'pageCount',
      'keywords',
      'securityClassification'
    ],
    customFields: []
  }
};

// Define the action types for document update
export interface UpdateDocumentPayload {
  id: string;
  name?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  [key: string]: any; // Allow other properties
}

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
      
      // Remove from batch selection if present
      state.selectedDocumentIds = state.selectedDocumentIds.filter(id => id !== action.payload);
    },
    
    // Remove multiple documents by id
    removeDocuments: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = new Set(action.payload);
      state.documents = state.documents.filter(doc => !idsToRemove.has(doc.id));
      
      // Clear selected document if it was removed
      if (state.selectedDocumentId && idsToRemove.has(state.selectedDocumentId)) {
        state.selectedDocumentId = null;
      }
      
      // Clear batch selection
      state.selectedDocumentIds = state.selectedDocumentIds.filter(id => !idsToRemove.has(id));
    },
    
    // Update document (refactored to use UpdateDocumentPayload)
    updateDocument: (state, action: PayloadAction<UpdateDocumentPayload>) => {
      const { id, ...changes } = action.payload;
      const docIndex = state.documents.findIndex(doc => doc.id === id);
      
      if (docIndex !== -1) {
        state.documents[docIndex] = {
          ...state.documents[docIndex],
          ...changes
        };
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
    updateDocumentStatus: (state, action: PayloadAction<{ id: string; status: Document['status']; error?: string }>) => {
      const { id, status, error } = action.payload;
      const document = state.documents.find(doc => doc.id === id);
      
      if (document) {
        document.status = status;
        if (error !== undefined) {
          document.error = error;
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
    
    // Update document tags
    updateDocumentTags: (state, action: PayloadAction<{ id: string, tags: string[] }>) => {
      const { id, tags } = action.payload;
      const index = state.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        state.documents[index].tags = tags;
      }
    },
    
    // Update document category
    updateDocumentCategory: (state, action: PayloadAction<{ id: string, category: string }>) => {
      const { id, category } = action.payload;
      const index = state.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        state.documents[index].category = category;
      }
    },
    
    // Select document
    selectDocument: (state, action: PayloadAction<string | null>) => {
      state.selectedDocumentId = action.payload;
    },
    
    // Toggle batch operation mode
    toggleBatchOperationMode: (state) => {
      state.batchOperationMode = !state.batchOperationMode;
      // Clear selection when toggling off batch mode
      if (!state.batchOperationMode) {
        state.selectedDocumentIds = [];
      }
    },
    
    // Toggle document selection for batch operations
    toggleDocumentSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.selectedDocumentIds.indexOf(id);
      
      if (index === -1) {
        // Add to selection
        state.selectedDocumentIds.push(id);
      } else {
        // Remove from selection
        state.selectedDocumentIds.splice(index, 1);
      }
    },
    
    // Select all documents for batch operations
    selectAllDocuments: (state) => {
      state.selectedDocumentIds = state.documents.map(doc => doc.id);
    },
    
    // Clear document selection for batch operations
    clearDocumentSelection: (state) => {
      state.selectedDocumentIds = [];
    },
    
    // Batch update tags for selected documents
    batchUpdateTags: (state, action: PayloadAction<{ 
      operation: 'add' | 'remove' | 'set',
      tags: string[] 
    }>) => {
      const { operation, tags } = action.payload;
      
      state.documents = state.documents.map(doc => {
        // Skip documents that aren't selected
        if (!state.selectedDocumentIds.includes(doc.id)) {
          return doc;
        }
        
        const currentTags = doc.tags || [];
        let newTags: string[];
        
        switch (operation) {
          case 'add':
            // Add tags that don't already exist
            newTags = [...new Set([...currentTags, ...tags])];
            break;
          case 'remove':
            // Remove specified tags
            newTags = currentTags.filter(tag => !tags.includes(tag));
            break;
          case 'set':
            // Replace all tags
            newTags = [...tags];
            break;
          default:
            newTags = currentTags;
        }
        
        return {
          ...doc,
          tags: newTags
        };
      });
    },
    
    // Batch update category for selected documents
    batchUpdateCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      
      state.documents = state.documents.map(doc => {
        // Skip documents that aren't selected
        if (!state.selectedDocumentIds.includes(doc.id)) {
          return doc;
        }
        
        return {
          ...doc,
          category
        };
      });
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
      state.selectedDocumentIds = [];
      state.batchOperationMode = false;
    },
    
    // Update document validation results
    updateDocumentValidation: (state, action: PayloadAction<{ id: string, validationResult: ValidationResult }>) => {
      const { id, validationResult } = action.payload;
      const index = state.documents.findIndex(doc => doc.id === id);
      if (index !== -1) {
        state.documents[index].validationResult = validationResult;
      }
    },
    
    // Toggle document favorite status
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const document = state.documents.find(doc => doc.id === action.payload);
      if (document) {
        document.isFavorite = !document.isFavorite;
      }
    },
    
    // Add multiple documents to favorites
    addToFavorites: (state, action: PayloadAction<string[]>) => {
      const documentIds = new Set(action.payload);
      state.documents.forEach(doc => {
        if (documentIds.has(doc.id)) {
          doc.isFavorite = true;
        }
      });
    },
    
    // Remove multiple documents from favorites
    removeFromFavorites: (state, action: PayloadAction<string[]>) => {
      const documentIds = new Set(action.payload);
      state.documents.forEach(doc => {
        if (documentIds.has(doc.id)) {
          doc.isFavorite = false;
        }
      });
    },
    
    // Add a new version to a document
    addDocumentVersion: (state, action: PayloadAction<{ documentId: string, version: DocumentVersion }>) => {
      const { documentId, version } = action.payload;
      const document = state.documents.find(doc => doc.id === documentId);
      
      if (document) {
        if (!document.versions) {
          document.versions = [];
        }
        
        // Add new version and update current version number
        document.versions.push(version);
        document.currentVersion = version.versionNumber;
      }
    },
    
    // Restore a previous version
    restoreDocumentVersion: (state, action: PayloadAction<{ documentId: string, versionId: string }>) => {
      const { documentId, versionId } = action.payload;
      const document = state.documents.find(doc => doc.id === documentId);
      
      if (document && document.versions) {
        const version = document.versions.find(v => v.id === versionId);
        if (version) {
          document.currentVersion = version.versionNumber;
          // Additional restore logic would be handled by the API
        }
      }
    },
    
    // Update metadata preferences
    updateMetadataPreferences: (state, action: PayloadAction<{
      visibleFields?: string[];
      customFields?: {
        id: string;
        name: string;
        type: 'text' | 'number' | 'date' | 'boolean' | 'select';
        options?: string[];
      }[];
    }>) => {
      const { visibleFields, customFields } = action.payload;
      
      if (visibleFields) {
        state.metadataPreferences.visibleFields = visibleFields;
      }
      
      if (customFields) {
        state.metadataPreferences.customFields = customFields;
      }
    },
    
    // Add a custom metadata field
    addCustomMetadataField: (state, action: PayloadAction<{
      id: string;
      name: string;
      type: 'text' | 'number' | 'date' | 'boolean' | 'select';
      options?: string[];
    }>) => {
      state.metadataPreferences.customFields.push(action.payload);
    },
    
    // Remove a custom metadata field
    removeCustomMetadataField: (state, action: PayloadAction<string>) => {
      state.metadataPreferences.customFields = state.metadataPreferences.customFields.filter(
        field => field.id !== action.payload
      );
    },
    
    // Add setSelectedDocumentIds for batch operations
    setSelectedDocumentIds: (state, action: PayloadAction<string[]>) => {
      state.selectedDocumentIds = action.payload;
    },
  },
});

// Export actions
export const {
  addDocument,
  addDocuments,
  removeDocument,
  removeDocuments,
  updateDocument,
  updateDocumentProgress,
  updateDocumentStatus,
  updateDocumentMetadata,
  updateDocumentTags,
  updateDocumentCategory,
  updateDocumentValidation,
  selectDocument,
  toggleBatchOperationMode,
  toggleDocumentSelection,
  selectAllDocuments,
  clearDocumentSelection,
  batchUpdateTags,
  batchUpdateCategory,
  setLoading,
  setError,
  clearDocuments,
  toggleFavorite,
  addToFavorites,
  removeFromFavorites,
  addDocumentVersion,
  restoreDocumentVersion,
  updateMetadataPreferences,
  addCustomMetadataField,
  removeCustomMetadataField,
  setSelectedDocumentIds
} = documentsSlice.actions;

// Export reducer
export default documentsSlice.reducer; 
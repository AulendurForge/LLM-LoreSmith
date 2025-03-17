import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { Document } from '../../store/slices/documentsSlice';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeDocument } from '../../store/slices/documentsSlice';

interface DuplicateDetectorProps {
  document: Document;
  documents: Document[];
  onClose?: () => void;
}

interface DuplicateMatch {
  document: Document;
  similarity: number; // 0-100 percentage
  reason: string; // Reason for the match (e.g., "Similar filename", "Similar content")
}

const DuplicateDetector: React.FC<DuplicateDetectorProps> = ({ document, documents, onClose }) => {
  const dispatch = useDispatch();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ignoredPairs, setIgnoredPairs] = useState<Set<string>>(new Set());

  // Start scanning for duplicates when component mounts
  useEffect(() => {
    scanForDuplicates();
  }, [document.id]);

  // Scan for duplicate documents
  const scanForDuplicates = async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find potential duplicates (excluding the current document)
      const potentialDuplicates = findDuplicates(document, documents);
      
      // Filter out any ignored document pairs
      const filteredDuplicates = potentialDuplicates.filter(duplicate => {
        const pairId = getPairId(document.id, duplicate.document.id);
        return !ignoredPairs.has(pairId);
      });
      
      setDuplicates(filteredDuplicates);
      
      setScanComplete(true);
      setIsScanning(false);
    } catch (err) {
      console.error('Error scanning for duplicates:', err);
      setError('Failed to scan for duplicate documents. Please try again.');
      setIsScanning(false);
    }
  };

  // Helper function to create a unique ID for a document pair (for tracking ignored pairs)
  const getPairId = (id1: string, id2: string) => {
    // Sort the IDs to ensure the pair ID is the same regardless of order
    return [id1, id2].sort().join('_');
  };

  // Find potential duplicates using various heuristics
  const findDuplicates = (
    targetDoc: Document, 
    documents: Document[]
  ): DuplicateMatch[] => {
    const matches: DuplicateMatch[] = [];
    
    // Extract filename without extension
    const targetName = targetDoc.name.replace(/\.[^/.]+$/, "").toLowerCase();
    const targetSize = targetDoc.size;
    const targetExtension = targetDoc.name.split('.').pop()?.toLowerCase();
    
    // Check each document for potential duplicates
    documents.forEach(doc => {
      // Skip the current document
      if (doc.id === targetDoc.id) return;
      
      const docName = doc.name.replace(/\.[^/.]+$/, "").toLowerCase();
      const docExtension = doc.name.split('.').pop()?.toLowerCase();
      
      // Calculate various similarity metrics
      let filenameSimilarity = calculateStringSimilarity(targetName, docName);
      let exactNameMatch = targetName === docName;
      let sizeMatch = Math.abs(targetSize - doc.size) / Math.max(targetSize, doc.size) < 0.05; // Within 5%
      let differentExtension = targetExtension !== docExtension;
      
      // Combine the metrics to determine similarity and reason
      let similarity = 0;
      let reason = '';
      
      if (exactNameMatch && sizeMatch) {
        similarity = differentExtension ? 95 : 100;
        reason = differentExtension 
          ? `Same filename with different extension (${targetExtension} vs ${docExtension})`
          : 'Exact duplicate (same name and size)';
      } else if (exactNameMatch) {
        similarity = 85;
        reason = 'Same filename but different content';
      } else if (filenameSimilarity > 0.8) {
        similarity = Math.round(filenameSimilarity * 80);
        reason = `Similar filename (${Math.round(filenameSimilarity * 100)}% match)`;
      } else if (sizeMatch && targetExtension === docExtension) {
        similarity = 70;
        reason = 'Same file type with similar size';
      }
      
      // Add to matches if similarity is above threshold
      if (similarity >= 70) {
        matches.push({
          document: doc,
          similarity,
          reason
        });
      }
    });
    
    // Sort by similarity (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  };

  // Calculate string similarity using Levenshtein distance
  const calculateStringSimilarity = (str1: string, str2: string): number => {
    // Simple implementation of Levenshtein distance
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    // Calculate similarity as 1 - normalized distance
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0; // Both strings are empty
    
    const distance = track[str2.length][str1.length];
    return 1 - (distance / maxLength);
  };

  // Handle remove document
  const handleRemoveDocument = (id: string) => {
    if (window.confirm('Are you sure you want to remove this document?')) {
      dispatch(removeDocument(id));
      
      // Remove from duplicates list
      setDuplicates(prev => prev.filter(dup => dup.document.id !== id));
    }
  };

  // Handle marking a document as not a duplicate
  const handleNotDuplicate = (id: string) => {
    // Create a pair ID to track this combination
    const pairId = getPairId(document.id, id);
    
    // Add to ignored pairs
    setIgnoredPairs(prev => new Set(prev).add(pairId));
    
    // Remove from duplicates list
    setDuplicates(prev => prev.filter(dup => dup.document.id !== id));
  };

  // Get similarity class based on percentage
  const getSimilarityClass = (similarity: number) => {
    if (similarity >= 95) return 'text-red-600';
    if (similarity >= 80) return 'text-orange-500';
    return 'text-yellow-600';
  };

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold">Potential Duplicates</h3>
        {onClose && (
          <button 
            className="btn btn-sm btn-outline"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        )}
      </div>
      
      {/* Scanning progress */}
      {isScanning && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <div className="animate-spin mr-3 h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <div>
              <p className="font-medium text-blue-700">Scanning for duplicates...</p>
              <p className="text-sm text-blue-600 mt-1">
                Checking file names, sizes, and contents to identify potential duplicates.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 mr-3 mt-0.5" size={18} />
            <div>
              <p className="font-medium text-red-700">{error}</p>
              <button
                className="text-sm text-red-700 underline mt-1"
                onClick={scanForDuplicates}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Results */}
      {scanComplete && (
        <div>
          {duplicates.length === 0 ? (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-500 mr-3" size={18} />
                <div>
                  <p className="font-medium text-green-700">No duplicate documents found</p>
                  <p className="text-sm text-green-600 mt-1">
                    This document appears to be unique in your collection.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex items-center">
                  <FiAlertCircle className="text-yellow-500 mr-3" size={18} />
                  <div>
                    <p className="font-medium text-yellow-700">
                      Found {duplicates.length} potential {duplicates.length === 1 ? 'duplicate' : 'duplicates'}
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">
                      Review the list below and confirm which items are duplicates.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                {duplicates.map(duplicate => (
                  <div key={duplicate.document.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center">
                        <span className={`font-semibold ${getSimilarityClass(duplicate.similarity)}`}>
                          {duplicate.similarity}% Match
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600 text-sm">{duplicate.reason}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded flex items-center"
                          onClick={() => handleNotDuplicate(duplicate.document.id)}
                          title="Not a duplicate"
                        >
                          <FiX size={16} className="mr-1" />
                          <span className="text-sm hidden sm:inline">Not a duplicate</span>
                        </button>
                        
                        <button
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded flex items-center"
                          onClick={() => handleRemoveDocument(duplicate.document.id)}
                          title="Remove duplicate"
                        >
                          <FiTrash2 size={16} className="mr-1" />
                          <span className="text-sm hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <h4 className="font-medium">{duplicate.document.name}</h4>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 mt-1 sm:mt-0">
                          {new Date(duplicate.document.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p>{(duplicate.document.size / 1024 / 1024).toFixed(2)} MB</p>
                        {duplicate.document.metadata?.author && (
                          <p className="mt-1">Author: {duplicate.document.metadata.author}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Rescan button */}
          <div className="mt-6 flex justify-end">
            <button
              className="btn btn-sm btn-outline"
              onClick={scanForDuplicates}
            >
              <FiSearch className="mr-1" size={16} />
              Scan Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicateDetector; 
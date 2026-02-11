'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  children?: Collection[];
}

interface CollectionSelectorProps {
  documentId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CollectionSelector({
  documentId,
  onClose,
  onSuccess,
}: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [documentCollections, setDocumentCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all collections
      const collectionsRes = await fetch('http://localhost:3001/api/collections');
      const collectionsData = await collectionsRes.json();

      // Load document's current collections
      const docCollectionsRes = await fetch(
        `http://localhost:3001/api/documents/${documentId}/collections`
      );
      const docCollectionsData = await docCollectionsRes.json();

      setCollections(flattenCollections(collectionsData.collections || []));
      setDocumentCollections(docCollectionsData.collections.map((c: any) => c.id));
    } catch (error) {
      console.error('Failed to load collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const flattenCollections = (collections: Collection[], level = 0): Collection[] => {
    const result: Collection[] = [];
    collections.forEach((col) => {
      result.push({ ...col, level } as any);
      if (col.children && col.children.length > 0) {
        result.push(...flattenCollections(col.children, level + 1));
      }
    });
    return result;
  };

  const toggleCollection = async (collectionId: string) => {
    const isInCollection = documentCollections.includes(collectionId);

    try {
      if (isInCollection) {
        // Remove from collection
        const response = await fetch(
          `http://localhost:3001/api/collections/${collectionId}/documents/${documentId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) throw new Error('Remove failed');

        setDocumentCollections((prev) => prev.filter((id) => id !== collectionId));
        toast.success('Removed from collection');
      } else {
        // Add to collection
        const response = await fetch(
          `http://localhost:3001/api/collections/${collectionId}/documents`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_id: documentId }),
          }
        );

        if (!response.ok) throw new Error('Add failed');

        setDocumentCollections((prev) => [...prev, collectionId]);
        toast.success('Added to collection');
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Toggle collection error:', error);
      toast.error('Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add to Collections</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12 rounded" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">No collections yet</p>
              <a href="/collections" className="btn-primary text-sm">
                Create Collection
              </a>
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection: any) => {
                const isSelected = documentCollections.includes(collection.id);
                return (
                  <button
                    key={collection.id}
                    onClick={() => toggleCollection(collection.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      isSelected
                        ? 'bg-brand-50 hover:bg-brand-100'
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ paddingLeft: `${(collection.level || 0) * 1.5 + 0.75}rem` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: collection.color + '30' }}
                    >
                      {collection.icon}
                    </div>
                    <span className="flex-1 text-left font-medium text-gray-900">
                      {collection.name}
                    </span>
                    {isSelected && (
                      <CheckIcon className="w-5 h-5 text-brand-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
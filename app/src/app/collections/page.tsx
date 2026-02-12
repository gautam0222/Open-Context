'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import CollectionTree from '@/components/Collections/CollectionTree';
import CollectionModal from '@/components/Collections/CollectionModal';
import {
  PlusIcon,
  FolderIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CollectionStats {
  documentCount: number;
  totalWords: number;
  lastUpdated: number | null;
}

interface CollectionNode {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  parent_id?: string | null;
  children: CollectionNode[];
  stats: CollectionStats;
}

interface SelectedCollection extends CollectionNode {
  // Ensure stats is always present
}

interface Document {
  id: string;
  title: string;
  url: string;
  word_count: number;
  created_at: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionNode[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<SelectedCollection | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionDocuments = async (collectionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/collections/${collectionId}`);
      const data = await response.json();
      
      // Ensure stats exists with default values
      const collectionWithStats: SelectedCollection = {
        ...data.collection,
        children: [],
        stats: data.stats || {
          documentCount: 0,
          totalWords: 0,
          lastUpdated: null,
        },
      };
      
      setSelectedCollection(collectionWithStats);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load collection documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const handleSelectCollection = (id: string) => {
    loadCollectionDocuments(id);
  };

  const handleCreateCollection = () => {
    setEditingCollection(null);
    setParentId(null);
    setShowModal(true);
  };

  const handleCreateChild = (parentCollectionId: string) => {
    setEditingCollection(null);
    setParentId(parentCollectionId);
    setShowModal(true);
  };

  const handleEditCollection = (id: string) => {
    const findCollection = (collections: CollectionNode[]): CollectionNode | null => {
      for (const col of collections) {
        if (col.id === id) return col;
        if (col.children && col.children.length > 0) {
          const found = findCollection(col.children);
          if (found) return found;
        }
      }
      return null;
    };

    const collection = findCollection(collections);
    if (collection) {
      setEditingCollection(collection);
      setShowModal(true);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection? Documents will not be deleted.')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/collections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Collection deleted');
      loadCollections();
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete collection');
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!selectedCollection) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/collections/${selectedCollection.id}/documents/${documentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Remove failed');

      toast.success('Document removed from collection');
      loadCollectionDocuments(selectedCollection.id);
      loadCollections();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove document');
    }
  };

  return (
    <MainLayout
      title="Collections"
      description="Organize your documents into collections"
      headerActions={
        <button onClick={handleCreateCollection} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Collection
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar - Collections Tree */}
        <aside className="lg:col-span-1">
          <div className="card p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FolderIcon className="w-5 h-5" />
                Collections
              </h3>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-10 rounded" />
                ))}
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">No collections yet</p>
                <button onClick={handleCreateCollection} className="btn-primary text-sm">
                  Create First Collection
                </button>
              </div>
            ) : (
              <CollectionTree
                collections={collections}
                selectedId={selectedCollection?.id}
                onSelect={handleSelectCollection}
                onCreateChild={handleCreateChild}
                onEdit={handleEditCollection}
                onDelete={handleDeleteCollection}
              />
            )}
          </div>
        </aside>

        {/* Main Content - Collection Documents */}
        <div className="lg:col-span-3">
          {selectedCollection ? (
            <div className="card p-6 h-full overflow-y-auto">
              {/* Collection Header - FIXED */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: selectedCollection.color + '30' }}
                >
                  {selectedCollection.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedCollection.name}
                  </h2>
                  {selectedCollection.description && (
                    <p className="text-gray-600 mb-3">{selectedCollection.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{selectedCollection.stats.documentCount} documents</span>
                    <span>•</span>
                    <span>{selectedCollection.stats.totalWords.toLocaleString()} words</span>
                  </div>
                </div>
                <button
                  onClick={() => handleEditCollection(selectedCollection.id)}
                  className="btn-ghost"
                >
                  Edit
                </button>
              </div>

              {/* Documents List */}
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No documents yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add documents to this collection from the Library
                  </p>
                  <Link href="/library" className="btn-primary">
                    Browse Library
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                    >
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/library/${doc.id}`}
                          className="font-medium text-gray-900 hover:text-brand-600 line-clamp-1 block"
                        >
                          {doc.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">
                          {doc.word_count.toLocaleString()} words •{' '}
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-error-600 hover:bg-error-50 rounded transition"
                        title="Remove from collection"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <FolderIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Select a Collection
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose a collection from the sidebar to view its documents, or create a new one to get started.
                </p>
                <button onClick={handleCreateCollection} className="btn-primary">
                  <PlusIcon className="w-4 h-4" />
                  Create Collection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collection Modal */}
      <CollectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          loadCollections();
          setShowModal(false);

          toast.success('🎉 Collection created!', {
      icon: '📁',
    });
        }}
        editingCollection={editingCollection}
        parentId={parentId}
      />
    </MainLayout>
  );
}
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { generateTableOfContents, injectTOCIds, TOCItem } from '@/lib/toc';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  UserIcon,
  GlobeAltIcon,
  HashtagIcon,
  BookOpenIcon,
  ListBulletIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  url: string;
  title: string;
  content: string;
  excerpt: string | null;
  author: string | null;
  site_name: string | null;
  word_count: number | null;
  created_at: number;
}

interface Chunk {
  id: string;
  content: string;
  chunk_index: number;
}

interface RelatedDoc {
  id: string;
  title: string;
  url: string;
  similarity: number;
  word_count: number | null;
}

interface Note {
  id: string;
  content: string;
  created_at: number;
  updated_at: number | null;
}

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [relatedDocs, setRelatedDocs] = useState<RelatedDoc[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [toc, setTOC] = useState<TOCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTOC, setShowTOC] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [readingProgress, setReadingProgress] = useState(0);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    loadDocument();
    loadRelatedDocs();
    loadNotes();
  }, [documentId]);

  useEffect(() => {
    if (document?.content) {
      const generatedTOC = generateTableOfContents(document.content);
      setTOC(generatedTOC);
    }
  }, [document]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const scrollTop = window.scrollY;
      const scrollHeight = element.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/full`);
      
      if (!response.ok) throw new Error('Document not found');
      
      const data = await response.json();
      setDocument(data.document);
      setChunks(data.chunks || []);
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.error('Failed to load document');
      router.push('/library');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedDocs = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/related`);
      const data = await response.json();
      setRelatedDocs(data.related || []);
    } catch (error) {
      console.error('Failed to load related documents:', error);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/notes`);
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent }),
      });

      if (response.ok) {
        toast.success('Note added!');
        setNewNoteContent('');
        setShowNoteInput(false);
        loadNotes();
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Note deleted');
        loadNotes();
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${document?.title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Document deleted');
        router.push('/library');
      }
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const scrollToHeading = (id: string) => {
    const element = window.document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const readingTime = document?.word_count ? Math.ceil(document.word_count / 200) : 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!document) {
    return (
      <MainLayout>
        <div className="card p-12 text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <p className="text-gray-600 mb-6">This document may have been deleted.</p>
          <Link href="/library" className="btn-primary">
            Back to Library
          </Link>
        </div>
      </MainLayout>
    );
  }

  const contentWithTOC = toc.length > 0 ? injectTOCIds(document.content, toc) : document.content;

  return (
    <MainLayout>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-64 right-0 h-1 bg-gray-100 z-50">
        <div
          className="h-full bg-brand-600 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/library" className="btn-ghost">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Library
          </Link>

          <div className="flex items-center gap-2">
            {/* Font Controls */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="px-2 py-1 text-sm hover:bg-white rounded transition"
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize(Math.min(20, fontSize + 2))}
                className="px-2 py-1 text-sm hover:bg-white rounded transition"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setFontFamily('sans')}
                className={`px-3 py-1 text-sm rounded transition ${
                  fontFamily === 'sans' ? 'bg-white font-medium' : ''
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily('serif')}
                className={`px-3 py-1 text-sm rounded transition font-serif ${
                  fontFamily === 'serif' ? 'bg-white font-medium' : ''
                }`}
              >
                Serif
              </button>
            </div>
            
            <button
              onClick={() => setShowTOC(!showTOC)}
              className="btn-ghost"
              title="Toggle table of contents"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              Original
            </a>
                <a
              href={`http://localhost:3001/api/export/documents/${documentId}/markdown`}
              download
              className="btn-secondary"
              onClick={() => toast.success('Downloading...')}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </a>

            <button onClick={handleDelete} className="btn-ghost text-error-600 hover:bg-error-50">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Table of Contents */}
            {showTOC && toc.length > 0 && (
              <div className="card p-5 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ListBulletIcon className="w-5 h-5" />
                  Contents
                </h3>
                <nav className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
                  {toc.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToHeading(item.id)}
                      className="block w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded transition"
                      style={{ paddingLeft: `${item.level * 8}px` }}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Metadata Card */}
            <div className="card p-5 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Document Info</h3>
              
              <div className="space-y-3 text-sm">
                {document.site_name && (
                  <div className="flex items-start gap-2">
                    <GlobeAltIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">Source</div>
                      <div className="text-gray-900">{document.site_name}</div>
                    </div>
                  </div>
                )}

                {document.author && (
                  <div className="flex items-start gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">Author</div>
                      <div className="text-gray-900">{document.author}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Captured</div>
                    <div className="text-gray-900">{formatDate(document.created_at)}</div>
                  </div>
                </div>

                {document.word_count && (
                  <div className="flex items-start gap-2">
                    <BookOpenIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">Reading Time</div>
                      <div className="text-gray-900">
                        {readingTime} min ({document.word_count.toLocaleString()} words)
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <HashtagIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Chunks</div>
                    <div className="text-gray-900">{chunks.length} pieces</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <PencilSquareIcon className="w-5 h-5" />
                  Notes
                </h3>
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="btn-ghost text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              {showNoteInput && (
                <div className="mb-4">
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write a note..."
                    className="input min-h-[80px] resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleAddNote} className="btn-primary text-sm flex-1">
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowNoteInput(false);
                        setNewNoteContent('');
                      }}
                      className="btn-ghost text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {notes.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No notes yet</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="p-3 bg-yellow-50 rounded-lg group relative">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.content}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(note.created_at)}
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-error-600 opacity-0 group-hover:opacity-100 transition"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Related Documents */}
            {relatedDocs.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Related Documents</h3>
                <div className="space-y-3">
                  {relatedDocs.map((related) => (
                    <Link
                      key={related.id}
                      href={`/library/${related.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition group"
                    >
                      <div className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-brand-600 mb-1">
                        {related.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{(related.similarity * 100).toFixed(0)}% similar</span>
                        {related.word_count && (
                          <>
                            <span>•</span>
                            <span>{related.word_count} words</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <article className="lg:col-span-3" ref={contentRef}>
            <div className="card p-8 md:p-12">
              {/* Title */}
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {document.title || 'Untitled'}
              </h1>

              {/* Excerpt */}
              {document.excerpt && (
                <p className="text-xl text-gray-600 mb-8 leading-relaxed border-l-4 border-brand-500 pl-6 italic">
                  {document.excerpt}
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-gray-200 mb-8" />

              {/* Content */}
              <div
                className={`prose prose-lg max-w-none ${
                  fontFamily === 'serif' ? 'font-serif' : ''
                }`}
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
              >
                {contentWithTOC ? (
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: contentWithTOC.replace(/\n/g, '<br />'),
                    }}
                  />
                ) : (
                  <p className="text-gray-500 italic">No content available</p>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </MainLayout>
  );
}
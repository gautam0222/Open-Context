'use client';

import { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import FileUpload from '@/components/Upload/FileUpload';
import Link from 'next/link';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function UploadPage() {
  const [uploadComplete, setUploadComplete] = useState(false);

  return (
    <MainLayout
      title="Upload Files"
      description="Upload PDFs, Word docs, and text files to your knowledge base"
    >
      <div className="w-full mx-auto">
        {!uploadComplete ? (
          <>
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <CloudArrowUpIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Multiple Formats</h3>
                <p className="text-sm text-gray-600">
                  Support for PDF, DOCX, TXT, and Markdown files
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <SparklesIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Auto-Processing</h3>
                <p className="text-sm text-gray-600">
                  Automatic text extraction, chunking, and embedding generation
                </p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">OCR Support</h3>
                <p className="text-sm text-gray-600">
                  Scanned PDFs? No problem! We'll extract text using OCR
                </p>
              </div>
            </div>

            {/* Upload Component */}
            <FileUpload onComplete={() => setUploadComplete(true)} />

            {/* Tips */}
            <div className="mt-8 p-6 bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl border border-brand-200">
              <h3 className="font-semibold text-gray-900 mb-3">💡 Tips for Best Results</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>PDFs:</strong> Text-based PDFs work best. Scanned PDFs will use OCR (slower but works!)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>DOCX:</strong> Word documents are converted perfectly with formatting preserved</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Text Files:</strong> TXT and MD files are processed instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Batch Upload:</strong> Upload up to 20 files at once for faster processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>File Size:</strong> Max 50MB per file. Larger files will be rejected</span>
                </li>
              </ul>
            </div>

            {/* Alternative Methods */}
            <div className="mt-8 card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Other Ways to Add Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/library"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-400 hover:bg-brand-50 transition group"
                >
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-semibold text-gray-900 group-hover:text-brand-600">
                    Browser Extension
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Capture web pages with one click
                  </div>
                </Link>

                <Link
                  href="/settings"
                  className="p-4 border border-gray-200 rounded-lg hover:border-brand-400 hover:bg-brand-50 transition group"
                >
                  <div className="text-2xl mb-2">📥</div>
                  <div className="font-semibold text-gray-900 group-hover:text-brand-600">
                    Import from Apps
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Import from Pocket, Instapaper, bookmarks
                  </div>
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Files Uploaded Successfully! 🎉
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your files have been processed and are now searchable. Embeddings have been generated automatically.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setUploadComplete(false)}
                className="btn-secondary"
              >
                Upload More Files
              </button>
              <Link href="/library" className="btn-primary">
                View in Library →
              </Link>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>💡 Next Steps:</strong> Try searching for content from your uploaded files or chat with them using AI Chat!
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
'use client';

import { useState, useRef } from 'react';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

export default function FileUpload({ onComplete }: { onComplete?: () => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'docx', 'txt', 'md'].includes(ext || '');
    });

    if (droppedFiles.length === 0) {
      toast.error('Please upload PDF, DOCX, TXT, or MD files only');
      return;
    }

    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = newFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const uploadFile = async (uploadFile: UploadedFile, index: number) => {
    // Update status to uploading
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'uploading', progress: 0 };
      return updated;
    });

    const formData = new FormData();
    formData.append('file', uploadFile.file);

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update to success
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'success',
          progress: 100,
          result,
        };
        return updated;
      });

      toast.success(`✅ ${uploadFile.file.name} uploaded!`);
    } catch (error) {
      // Update to error
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        };
        return updated;
      });

      toast.error(`❌ Failed to upload ${uploadFile.file.name}`);
    }
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i);
      }
    }

    if (onComplete) {
      onComplete();
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'md':
        return '📋';
      default:
        return '📁';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand-600 bg-brand-50'
            : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
        }`}
      >
        <CloudArrowUpIcon className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-brand-600' : 'text-gray-400'}`} />
        <p className="text-lg font-semibold text-gray-900 mb-2">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-600 mb-4">or click to browse</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>Supported:</span>
          <span className="px-2 py-1 bg-gray-100 rounded">PDF</span>
          <span className="px-2 py-1 bg-gray-100 rounded">DOCX</span>
          <span className="px-2 py-1 bg-gray-100 rounded">TXT</span>
          <span className="px-2 py-1 bg-gray-100 rounded">MD</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Max 50MB per file</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Files ({files.length})
            </h3>
            <div className="flex gap-2">
              <button onClick={clearAll} className="btn-ghost text-sm">
                Clear All
              </button>
              <button
                onClick={uploadAll}
                disabled={files.every(f => f.status !== 'pending')}
                className="btn-primary text-sm"
              >
                Upload All
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl">{getFileIcon(uploadFile.file.name)}</div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(uploadFile.file.size)}
                  </div>

                  {uploadFile.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-600 transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadFile.status === 'error' && (
                    <div className="text-xs text-error-600 mt-1">
                      {uploadFile.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {uploadFile.status === 'success' && (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  )}
                  {uploadFile.status === 'error' && (
                    <ExclamationCircleIcon className="w-5 h-5 text-error-600" />
                  )}
                  {uploadFile.status === 'uploading' && (
                    <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  )}

                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
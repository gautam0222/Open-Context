'use client';

import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { compressImage, validateImageFile } from '@/utils/imageUpload';
import toast from 'react-hot-toast';

interface CoverImageUploadProps {
  currentCover: string | null;
  onUpload: (coverData: string) => void;
  onRemove: () => void;
}

export default function CoverImageUpload({
  currentCover,
  onUpload,
  onRemove,
}: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCover);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);

    try {
      // Compress with wider aspect ratio for cover
      const compressedImage = await compressImage(file, 1200, 400, 0.85);
      setPreviewUrl(compressedImage);
      onUpload(compressedImage);
      toast.success('Cover image updated! 🎨');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative group">
      {/* Cover Image Preview */}
      <div className="h-48 w-full rounded-t-2xl overflow-hidden bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500">
        {previewUrl && (
          <img src={previewUrl} alt="Cover" className="w-full h-full object-cover" />
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition flex items-center gap-2"
        >
          <PhotoIcon className="w-5 h-5" />
          {previewUrl ? 'Change Cover' : 'Upload Cover'}
        </button>

        {previewUrl && (
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2"
          >
            <XMarkIcon className="w-5 h-5" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
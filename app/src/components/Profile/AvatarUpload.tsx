'use client';

import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { compressImage, validateImageFile } from '@/utils/imageUpload';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  currentAvatar: string | null;
  onUpload: (avatarData: string) => void;
  onRemove: () => void;
}

export default function AvatarUpload({ currentAvatar, onUpload, onRemove }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);

    try {
      // Compress image
      const compressedImage = await compressImage(file, 400, 400, 0.85);
      setPreviewUrl(compressedImage);
      onUpload(compressedImage);
      toast.success('Avatar updated! ✨');
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
    <div className="flex items-center gap-4">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
              ?
            </div>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
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
          className="btn-secondary"
        >
          <PhotoIcon className="w-4 h-4" />
          {previewUrl ? 'Change Avatar' : 'Upload Avatar'}
        </button>

        {previewUrl && (
          <button onClick={handleRemove} disabled={uploading} className="btn-ghost text-red-600">
            <XMarkIcon className="w-4 h-4" />
            Remove
          </button>
        )}

        <p className="text-xs text-gray-500">
          JPG, PNG, GIF or WebP. Max 5MB.
        </p>
      </div>
    </div>
  );
}
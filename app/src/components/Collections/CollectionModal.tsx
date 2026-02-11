'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCollection?: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string;
  } | null;
  parentId?: string | null;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const PRESET_ICONS = [
  '📁', '📂', '📚', '📖', '📝', '📄', '📋', '📌',
  '🎯', '⭐', '💼', '🎨', '🔬', '💡', '🚀', '🎓',
  '💻', '📱', '🌐', '🔧', '⚙️', '🎵', '🎬', '📷',
];

export default function CollectionModal({
  isOpen,
  onClose,
  onSuccess,
  editingCollection,
  parentId,
}: CollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('📁');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCollection) {
      setName(editingCollection.name);
      setDescription(editingCollection.description || '');
      setColor(editingCollection.color);
      setIcon(editingCollection.icon);
    } else {
      setName('');
      setDescription('');
      setColor('#6366f1');
      setIcon('📁');
    }
  }, [editingCollection, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    setLoading(true);

    try {
      const url = editingCollection
        ? `http://localhost:3001/api/collections/${editingCollection.id}`
        : 'http://localhost:3001/api/collections';

      const method = editingCollection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          icon,
          parent_id: parentId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save collection');
      }

      toast.success(
        editingCollection ? 'Collection updated!' : 'Collection created!'
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Save collection error:', error);
      toast.error('Failed to save collection');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {editingCollection ? 'Edit Collection' : 'New Collection'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AI Research, Work Projects, Reading List"
                className="input w-full"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this collection about?"
                rows={3}
                className="input w-full resize-none"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_ICONS.map((presetIcon) => (
                  <button
                    key={presetIcon}
                    type="button"
                    onClick={() => setIcon(presetIcon)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition ${
                      icon === presetIcon
                        ? 'bg-brand-100 ring-2 ring-brand-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {presetIcon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={`w-10 h-10 rounded-lg transition ${
                      color === presetColor ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: presetColor }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Preview:</div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: color + '30' }}
                >
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {name || 'Collection Name'}
                  </div>
                  {description && (
                    <div className="text-sm text-gray-600 line-clamp-1">
                      {description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : editingCollection ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  FolderIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export interface SearchFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  collections: string[];
  fileTypes: string[];
  sortBy: 'relevance' | 'date' | 'title' | 'size';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  collections: Array<{ id: string; name: string }>;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  collections,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCollection = (collectionId: string) => {
    const newCollections = filters.collections.includes(collectionId)
      ? filters.collections.filter(id => id !== collectionId)
      : [...filters.collections, collectionId];
    updateFilter('collections', newCollections);
  };

  const toggleFileType = (fileType: string) => {
    const newTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter(t => t !== fileType)
      : [...filters.fileTypes, fileType];
    updateFilter('fileTypes', newTypes);
  };

  const resetFilters = () => {
    onFiltersChange({
      dateRange: 'all',
      collections: [],
      fileTypes: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const activeFiltersCount =
    (filters.dateRange !== 'all' ? 1 : 0) +
    filters.collections.length +
    filters.fileTypes.length;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn-secondary relative ${isOpen ? 'bg-brand-50 border-brand-300' : ''}`}
      >
        <FunnelIcon className="w-4 h-4" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Advanced Filters</h3>
              <div className="flex items-center gap-2">
                <button onClick={resetFilters} className="text-sm text-brand-600 hover:text-brand-700">
                  Reset
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value)}
                className="input w-full"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Collections */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FolderIcon className="w-4 h-4 inline mr-1" />
                Collections
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {collections.length === 0 ? (
                  <p className="text-sm text-gray-500">No collections</p>
                ) : (
                  collections.map((collection) => (
                    <label
                      key={collection.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.collections.includes(collection.id)}
                        onChange={() => toggleCollection(collection.id)}
                        className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">{collection.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* File Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentIcon className="w-4 h-4 inline mr-1" />
                File Types
              </label>
              <div className="space-y-2">
                {['PDF', 'DOCX', 'TXT', 'HTML', 'MD'].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.fileTypes.includes(type)}
                      onChange={() => toggleFileType(type)}
                      className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="input"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="size">Size</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => updateFilter('sortOrder', e.target.value)}
                  className="input"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="btn-primary w-full"
            >
              Apply Filters
            </button>
          </div>
        </>
      )}
    </div>
  );
}
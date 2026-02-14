'use client';

import { ReactNode } from 'react';

interface MainLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

export default function MainLayout({
  title,
  description,
  children,
  headerActions,
}: MainLayoutProps) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Page Header - NO TOP PADDING */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
          </div>
        </div>
      </header>

      {/* Main Content - FULL WIDTH */}
      <main className="flex-1 w-full">
        <div className="px-6 py-6 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
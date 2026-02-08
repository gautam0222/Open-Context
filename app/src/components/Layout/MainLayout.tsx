'use client';

import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
}

export default function MainLayout({
  children,
  title,
  description,
  headerActions,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="pl-64">
        <Header title={title} description={description} actions={headerActions} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
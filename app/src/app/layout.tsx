import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Open Context - AI-Powered Knowledge Management',
  description: 'Capture, organize, and explore your knowledge with AI',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#ffffff',
          colorText: '#111827',
        },
      }}
    >
      <html lang="en">
        <body className="antialiased">
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#111827',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
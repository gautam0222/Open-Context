'use client';

import { useEffect, useState } from 'react';
import OnboardingModal from './Onboarding/OnboardingModal';
import { Toaster } from 'react-hot-toast';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
    
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = async () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);

    // Check if user wants sample content
    const shouldImportSamples = localStorage.getItem('import_sample_content');
    
    if (shouldImportSamples === 'true') {
      // Import sample content
      try {
        const response = await fetch('http://localhost:3001/api/import/samples', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Imported ${data.imported} sample articles`);
          
          // Show success message
          setTimeout(() => {
            alert(`🎉 Welcome! We've added ${data.imported} sample articles to get you started. Check out the Library!`);
            window.location.href = '/library';
          }, 500);
        }
      } catch (error) {
        console.error('Failed to import samples:', error);
      } finally {
        localStorage.removeItem('import_sample_content');
      }
    }
  };

  const handleOnboardingClose = () => {
    if (confirm('Skip onboarding? You can always access it later from Settings.')) {
      localStorage.setItem('onboarding_completed', 'true');
      setShowOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
}
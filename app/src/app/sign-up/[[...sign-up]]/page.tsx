import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Join Open Context
          </h1>
          <p className="text-lg text-gray-600">
            Start building your knowledge base today
          </p>
        </div>
        
        <div className="scale-110">
          <SignUp 
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-2xl rounded-2xl',
                headerTitle: 'text-2xl',
                headerSubtitle: 'text-base',
                socialButtonsBlockButton: 'text-base py-3',
                formButtonPrimary: 'bg-brand-600 hover:bg-brand-700 text-base py-3',
                formFieldInput: 'text-base py-3',
                footerActionLink: 'text-brand-600 hover:text-brand-700',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
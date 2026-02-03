import { SignInForm } from '../SignInForm';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/" className="text-lg font-bold hover:underline">
          ← BACK TO HOME
        </Link>
        <div className="text-lg font-bold">TAGSCAN LOGIN</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">LOGIN</h1>
            <p className="text-lg">Access the attendance tracking system</p>
          </div>
          
          <div className="border-4 border-black p-8">
            <SignInForm />
          </div>
        </div>
      </main>
    </div>
  );
}

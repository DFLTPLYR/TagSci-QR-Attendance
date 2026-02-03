import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <div className="text-lg font-bold">TAGSCAN</div>
        <nav className="flex gap-6">
          <Link to="/about" className="hover:underline font-bold">About this App</Link>
          <Link to="/concerns" className="hover:underline font-bold">Concerns</Link>
          <Link to="/login" className="hover:underline font-bold">Login</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-4xl">
          <h1 className="text-6xl font-black mb-6">TAGSCAN</h1>
          <h2 className="text-2xl font-bold mb-8">Enhanced Attendance Monitoring System</h2>
          <p className="text-lg mb-12">Built by Technology. Built for every Sayanista.</p>
          
          <div className="text-xl font-bold mb-8">Sync. Scan. Study. Repeat.</div>
          
          <Link 
            to="/login"
            className="inline-block px-8 py-4 bg-black text-white font-black text-lg hover:bg-gray-800 transition-colors"
          >
            GET STARTED
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black p-6 text-center">
        <p className="text-sm font-bold">Made by Klyde</p>
      </footer>
    </div>
  );
}

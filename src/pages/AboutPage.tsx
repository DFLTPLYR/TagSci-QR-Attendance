import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/" className="text-lg font-bold hover:underline">← BACK TO HOME</Link>
        <div className="text-lg font-bold">ABOUT THIS APP</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black mb-6">ABOUT TAGSCAN</h1>
            <p className="text-xl">Enhanced Attendance Monitoring System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-4">WHAT IS TAGSCAN?</h2>
              <p className="mb-4">
                TAGSCAN is a modern QR code-based attendance tracking system designed specifically 
                for educational institutions. It provides a fast, accurate, and secure way to 
                monitor student attendance.
              </p>
              <p>
                Built by Technology. Built for every Sayanista.
              </p>
            </div>

            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-4">KEY FEATURES</h2>
              <ul className="space-y-2">
                <li>• QR Code Generation & Scanning</li>
                <li>• Real-time Attendance Tracking</li>
                <li>• Offline Capability</li>
                <li>• Comprehensive Reports</li>
                <li>• Session Management</li>
                <li>• Secure Data Encryption</li>
              </ul>
            </div>
          </div>

          <div className="border-4 border-black p-8 mb-8">
            <h2 className="text-3xl font-black mb-6 text-center">HOW IT WORKS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl mb-4">1️⃣</div>
                <h3 className="text-xl font-black mb-2">GENERATE</h3>
                <p className="text-sm">Create unique QR codes for each student with their information</p>
              </div>
              
              <div className="text-center">
                <div className="text-5xl mb-4">2️⃣</div>
                <h3 className="text-xl font-black mb-2">SCAN</h3>
                <p className="text-sm">Students scan their QR codes during attendance sessions</p>
              </div>
              
              <div className="text-center">
                <div className="text-5xl mb-4">3️⃣</div>
                <h3 className="text-xl font-black mb-2">TRACK</h3>
                <p className="text-sm">View real-time attendance data and generate reports</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black mb-4">SYNC. SCAN. STUDY. REPEAT.</h2>
            <p className="text-lg mb-8">
              Experience the future of attendance tracking with TAGSCAN's innovative approach 
              to student monitoring and data management.
            </p>
            
            <Link 
              to="/login"
              className="inline-block px-8 py-4 bg-black text-white font-black text-lg hover:bg-gray-800 transition-colors"
            >
              START USING TAGSCAN
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black p-6 text-center">
        <p className="text-sm font-bold">Made by Klyde</p>
      </footer>
    </div>
  );
}

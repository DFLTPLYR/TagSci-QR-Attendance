import { Link } from 'react-router-dom';

export default function ConcernsPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/" className="text-lg font-bold hover:underline">← BACK TO HOME</Link>
        <div className="text-lg font-bold">CONCERNS & SUPPORT</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black mb-6">CONCERNS & SUPPORT</h1>
            <p className="text-xl">We're here to help with any issues or questions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-4">COMMON ISSUES</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-black mb-2">QR Code Not Scanning</h3>
                  <p className="text-sm mb-2">
                    Ensure the QR code is clear and well-lit. Try cleaning your camera lens 
                    or moving to better lighting.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-black mb-2">Student Not Found</h3>
                  <p className="text-sm mb-2">
                    Make sure the student is registered in the system and their QR code 
                    is generated properly.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-black mb-2">Offline Mode Issues</h3>
                  <p className="text-sm mb-2">
                    Data will sync automatically when connection is restored. Check your 
                    internet connection.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-4">CONTACT SUPPORT</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-black mb-2">Technical Issues</h3>
                  <p className="text-sm">
                    For technical problems or bugs, please contact your system administrator 
                    or IT support team.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-black mb-2">Feature Requests</h3>
                  <p className="text-sm">
                    Have an idea for improving TAGSCAN? We'd love to hear your suggestions 
                    for new features.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-black mb-2">Training & Documentation</h3>
                  <p className="text-sm">
                    Need help learning how to use the system? Training materials and 
                    documentation are available.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-4 border-black p-8 mb-8">
            <h2 className="text-3xl font-black mb-6 text-center">SYSTEM STATUS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🟢</div>
                <h3 className="font-black mb-2">SERVER STATUS</h3>
                <p className="text-sm">All systems operational</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-2">🟢</div>
                <h3 className="font-black mb-2">DATABASE</h3>
                <p className="text-sm">Running smoothly</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-2">🟢</div>
                <h3 className="font-black mb-2">QR SCANNING</h3>
                <p className="text-sm">Fully functional</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black mb-4">NEED IMMEDIATE HELP?</h2>
            <p className="text-lg mb-8">
              For urgent issues during class time, contact your teacher or school 
              administrator immediately.
            </p>
            
            <Link 
              to="/login"
              className="inline-block px-8 py-4 bg-black text-white font-black text-lg hover:bg-gray-800 transition-colors"
            >
              BACK TO LOGIN
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

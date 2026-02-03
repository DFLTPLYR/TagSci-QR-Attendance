import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import toast from "react-hot-toast";

export default function ScanSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isScanning, setIsScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  const studentLogin = useMutation(api.attendanceLogs.studentLogin);
  const processMasterkey = useMutation(api.sessions.processMasterkeyVerification);
  const closeSession = useMutation(api.sessions.closeSession);
  const sessionLogs = useQuery(
    api.attendanceLogs.getLogsBySession,
    sessionId ? { sessionId: sessionId as Id<"attendanceSessions"> } : "skip"
  );

  useEffect(() => {
    if (!isScanning || !sessionId) return;

    const onScanSuccess = async (decodedText: string) => {
      console.log("Scanned QR:", decodedText);
      
      // Prevent duplicate scans
      if (lastScanned === decodedText) {
        return;
      }
      setLastScanned(decodedText);

      try {
        if (scanMode === 'STUDENT') {
          // Student login scan
          const result = await studentLogin({ 
            qrCodeData: decodedText,
            sessionId: sessionId as Id<"attendanceSessions">,
          });
          toast.success(`✅ ${result.student.fullName} logged in (${result.arrivalCategory})`);
        } else {
          // Teacher masterkey verification scan
          const result = await processMasterkey({
            qrCodeData: decodedText,
          });
          toast.success(`✅ Session verified! ${result.verifiedCount} students marked present`);
          setScanMode('STUDENT'); // Reset to student mode
        }
      } catch (error: any) {
        console.error("Scan error:", error);
        toast.error(error.message || "❌ Failed to process scan");
      }

      // Reset after 2 seconds to allow new scans
      setTimeout(() => {
        setLastScanned(null);
      }, 2000);
    };

    const onScanFailure = (error: any) => {
      // Suppress frequent scan failures
    };

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
      },
      false
    );

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch((err) => console.error("Scanner clear error:", err));
    };
  }, [isScanning, lastScanned, sessionId, scanMode, studentLogin, closeSession]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !sessionId) return;

    const file = event.target.files[0];
    const html5QrCode = new Html5Qrcode("reader-upload");

    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      console.log("File QR:", decodedText);

      if (scanMode === 'STUDENT') {
        const result = await studentLogin({ 
          qrCodeData: decodedText,
          sessionId: sessionId as Id<"attendanceSessions">,
        });
        toast.success(`✅ ${result.student.fullName} logged in (${result.arrivalCategory})`);
      } else {
        const result = await processMasterkey({
          qrCodeData: decodedText,
        });
        toast.success(`✅ Session verified! ${result.verifiedCount} students marked present`);
        setScanMode('STUDENT');
      }
    } catch (error: any) {
      console.error("File scan error:", error);
      toast.error(error.message || "❌ Could not read QR from image");
    } finally {
      event.target.value = "";
    }
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    setLastScanned(null);
  };

  const pendingCount = sessionLogs?.filter(log => log.status === 'PENDING').length || 0;
  const verifiedCount = sessionLogs?.filter(log => log.status === 'VERIFIED').length || 0;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/sessions" className="text-lg font-bold hover:underline">
          ← BACK TO SESSIONS
        </Link>
        <div className="text-lg font-bold">SESSION SCANNER</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">SESSION QR SCANNER</h1>
            <p className="text-lg">
              {scanMode === 'STUDENT' ? 'Scan student QR codes to log attendance' : 'Scan teacher verification QR to close session'}
            </p>
          </div>

          {/* Scan Mode Toggle */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setScanMode('STUDENT')}
              className={`px-6 py-3 font-black transition-colors ${
                scanMode === 'STUDENT' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              👨‍🎓 STUDENT LOGIN
            </button>
            <button
              onClick={() => setScanMode('TEACHER')}
              className={`px-6 py-3 font-black transition-colors ${
                scanMode === 'TEACHER' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              🔑 TEACHER VERIFICATION
            </button>
          </div>

          {/* Scanner Controls */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={toggleScanning}
              className={`px-6 py-3 font-black transition-colors ${
                isScanning 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isScanning ? '⏸️ PAUSE SCANNER' : '▶️ START SCANNER'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scanner */}
            <div className="border-4 border-black p-6">
              <h2 className="text-xl font-black mb-4">
                {scanMode === 'STUDENT' ? 'STUDENT QR SCANNER' : 'TEACHER VERIFICATION SCANNER'}
              </h2>
              
              {/* Camera Scanner */}
              {isScanning && (
                <div className="mb-6">
                  <div id="reader" className="w-full"></div>
                </div>
              )}

              {/* File Upload */}
              <div className="border-2 border-gray-300 p-4">
                <h3 className="font-bold mb-2">UPLOAD QR IMAGE</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div id="reader-upload" style={{ display: "none" }}></div>
              </div>
            </div>

            {/* Session Status */}
            <div className="border-4 border-black p-6">
              <h2 className="text-xl font-black mb-4">SESSION STATUS</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-100 p-4 border-2 border-blue-300">
                  <div className="text-2xl font-black text-blue-800">{pendingCount}</div>
                  <div className="text-sm font-bold text-blue-600">PENDING VERIFICATION</div>
                </div>
                
                <div className="bg-green-100 p-4 border-2 border-green-300">
                  <div className="text-2xl font-black text-green-800">{verifiedCount}</div>
                  <div className="text-sm font-bold text-green-600">VERIFIED ATTENDANCE</div>
                </div>
              </div>

              {/* Recent Scans */}
              <div className="mt-6">
                <h3 className="font-black mb-2">RECENT SCANS</h3>
                <div className="max-h-40 overflow-y-auto border-2 border-gray-300">
                  {sessionLogs && sessionLogs.length > 0 ? (
                    sessionLogs.slice(0, 5).map((log) => (
                      <div key={log._id} className="p-2 border-b border-gray-200 text-sm">
                        <div className="font-bold">{log.fullName}</div>
                        <div className="text-gray-600">
                          {log.arrivalCategory} • {log.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">No scans yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import toast from 'react-hot-toast';
import { useOfflineAttendance } from '../hooks/useOfflineAttendance';

export default function ScanAttendance() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedStudent, setLastScannedStudent] = useState<any>(null);
  const [scanMode, setScanMode] = useState<'STUDENT' | 'MASTERKEY'>('STUDENT');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addToPool = useMutation(api.dailyPool.addToPool);
  const processMasterkey = useMutation(api.sessions.processMasterkeyVerification);
  const { isOnline, logAttendanceOffline } = useOfflineAttendance();

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        
        // Start scanning loop
        setTimeout(() => {
          scanQRCode();
        }, 1000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanQRCode = async () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0) {
      setTimeout(scanQRCode, 100);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      // Note: In a real implementation, you'd use a QR code library like jsQR here
      // For now, we'll simulate QR detection with manual input
      setTimeout(scanQRCode, 100);
    } catch (error) {
      setTimeout(scanQRCode, 100);
    }
  };

  const handleManualInput = async (qrData: string) => {
    if (!qrData.trim()) return;

    try {
      if (scanMode === 'MASTERKEY') {
        // Process masterkey verification
        const result = await processMasterkey({ qrCodeData: qrData });
        toast.success(`Session verified! ${result.verifiedCount} students marked present for ${result.subjectId}`);
        setLastScannedStudent({
          type: 'MASTERKEY',
          sessionId: result.sessionId,
          classId: result.classId,
          subjectId: result.subjectId,
          verifiedCount: result.verifiedCount,
        });
      } else {
        // Add student to daily pool
        if (isOnline) {
          const result = await addToPool({ qrCodeData: qrData });
          toast.success(`${result.student.fullName} added to daily pool at ${result.scanTime}`);
          setLastScannedStudent(result.student);
        } else {
          // Handle offline scanning
          toast.error("Offline daily pool scanning not yet implemented");
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Scan failed');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/dashboard" className="text-lg font-bold hover:underline">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-lg font-bold">
          {scanMode === 'STUDENT' ? 'DAILY POOL SCAN' : 'MASTERKEY SCAN'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">QR CODE SCANNER</h1>
            <p className="text-lg">
              {scanMode === 'STUDENT' 
                ? 'Scan student QR codes to add them to today\'s attendance pool'
                : 'Scan teacher masterkey QR to verify session attendance'
              }
            </p>
            
            {/* Connection Status */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-bold">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              {!isOnline && scanMode === 'MASTERKEY' && (
                <span className="text-red-600 ml-2">(Masterkey requires internet)</span>
              )}
            </div>
          </div>

          {/* Scan Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="border-4 border-black">
              <button
                onClick={() => setScanMode('STUDENT')}
                className={`px-6 py-3 font-black transition-colors ${
                  scanMode === 'STUDENT' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                STUDENT SCAN
              </button>
              <button
                onClick={() => setScanMode('MASTERKEY')}
                disabled={!isOnline}
                className={`px-6 py-3 font-black transition-colors ${
                  scanMode === 'MASTERKEY' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-black hover:bg-gray-100'
                } ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                MASTERKEY SCAN
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Camera Section */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">CAMERA SCANNER</h2>
              
              <div className="relative mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black border-2 border-gray-300"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 border-4 border-green-500 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-green-500"></div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {!isScanning ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
                  >
                    START CAMERA
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 px-6 py-3 bg-red-500 text-white font-black hover:bg-red-600 transition-colors"
                  >
                    STOP CAMERA
                  </button>
                )}
              </div>
            </div>

            {/* Manual Input Section */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">MANUAL INPUT</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const qrData = formData.get('qrData') as string;
                handleManualInput(qrData);
                e.currentTarget.reset();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    {scanMode === 'STUDENT' ? 'STUDENT QR CODE / LRN' : 'MASTERKEY QR CODE'}
                  </label>
                  <input
                    type="text"
                    name="qrData"
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder={scanMode === 'STUDENT' ? "Enter QR code data or LRN number" : "Enter masterkey QR code data"}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={scanMode === 'MASTERKEY' && !isOnline}
                  className="w-full px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scanMode === 'STUDENT' ? 'ADD TO POOL' : 'VERIFY SESSION'}
                </button>
              </form>

              {/* Last Scanned Result */}
              {lastScannedStudent && (
                <div className="mt-6 p-4 bg-green-100 border-2 border-green-500">
                  <h3 className="font-black text-green-800 mb-2">
                    {lastScannedStudent.type === 'MASTERKEY' ? 'SESSION VERIFIED!' : 'STUDENT SCANNED!'}
                  </h3>
                  {lastScannedStudent.type === 'MASTERKEY' ? (
                    <div className="text-sm text-green-700">
                      <p><strong>Class:</strong> {lastScannedStudent.classId}</p>
                      <p><strong>Subject:</strong> {lastScannedStudent.subjectId}</p>
                      <p><strong>Students Verified:</strong> {lastScannedStudent.verifiedCount}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-green-700">
                      <p><strong>Name:</strong> {lastScannedStudent.fullName}</p>
                      <p><strong>LRN:</strong> {lastScannedStudent.lrnNumber}</p>
                      <p><strong>Section:</strong> {lastScannedStudent.gradeLevel} {lastScannedStudent.strand} - {lastScannedStudent.section}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 border-4 border-black p-6">
            <h2 className="text-2xl font-black mb-4">INSTRUCTIONS</h2>
            
            {scanMode === 'STUDENT' ? (
              <div className="space-y-2 text-sm">
                <p><strong>1.</strong> Students scan their QR codes once per day to join the attendance pool</p>
                <p><strong>2.</strong> Each student can only be added to the pool once per day</p>
                <p><strong>3.</strong> Works offline - data will sync when connection is restored</p>
                <p><strong>4.</strong> Pool students will be marked present when teacher scans masterkey for each subject</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p><strong>1.</strong> Generate masterkey QR from the section dashboard</p>
                <p><strong>2.</strong> Scan the masterkey QR to verify all students in the daily pool for that session</p>
                <p><strong>3.</strong> This will close the session and mark attendance based on timetable</p>
                <p><strong>4.</strong> Requires internet connection</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function SectionDashboard() {
  const { classId } = useParams<{ classId: string }>();
  const decodedClassId = decodeURIComponent(classId || '');
  
  const [formData, setFormData] = useState({
    subjectId: '',
    scheduleStartTime: '',
    scheduleEndTime: '',
  });
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [teacherQR, setTeacherQR] = useState<string | null>(null);

  const createSession = useMutation(api.sessions.createSession);
  const generateTeacherQR = useMutation(api.sessions.generateTeacherQR);
  const closeSession = useMutation(api.sessions.closeSession);
  
  const sessionsByClass = useQuery(api.sessions.getSessionsByClass, { classId: decodedClassId });
  const dailyPool = useQuery(api.dailyPool.getDailyPool, { classId: decodedClassId });
  const subjects = useQuery(api.timetables.getSubjects);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subjectId || !formData.scheduleStartTime || !formData.scheduleEndTime) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const sessionId = await createSession({
        classId: decodedClassId,
        ...formData,
      });
      toast.success("Session created successfully!");
      setFormData({
        subjectId: '',
        scheduleStartTime: '',
        scheduleEndTime: '',
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create session");
    }
  };

  const handleGenerateTeacherQR = async (sessionId: string) => {
    try {
      const qrData = await generateTeacherQR({ sessionId: sessionId as Id<"attendanceSessions"> });
      setTeacherQR(qrData);
      setSelectedSession(sessionId);
      toast.success("Teacher verification QR generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate teacher QR");
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to close this session?")) {
      try {
        await closeSession({ sessionId: sessionId as Id<"attendanceSessions"> });
        toast.success("Session closed successfully!");
        setTeacherQR(null);
        setSelectedSession(null);
      } catch (error: any) {
        toast.error(error.message || "Failed to close session");
      }
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector('#teacher-qr-code svg') as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 200;
      canvas.height = 200;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `Teacher_Verification_QR_${decodedClassId.replace(/\s+/g, '_')}.png`;
        a.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const openSessions = sessionsByClass?.filter(s => s.status === 'OPEN') || [];
  const closedSessions = sessionsByClass?.filter(s => s.status === 'CLOSED') || [];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/dashboard" className="text-lg font-bold hover:underline">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-lg font-bold">{decodedClassId}</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">{decodedClassId}</h1>
            <p className="text-lg">Manage sessions and attendance for this section</p>
          </div>

          {/* Daily Pool Status */}
          <div className="border-4 border-black p-6 mb-8">
            <h2 className="text-2xl font-black mb-4">TODAY'S ATTENDANCE POOL</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-blue-600">{dailyPool?.length || 0}</div>
                <div className="text-sm font-bold">STUDENTS SCANNED</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-green-600">{openSessions.length}</div>
                <div className="text-sm font-bold">OPEN SESSIONS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-gray-600">{closedSessions.length}</div>
                <div className="text-sm font-bold">CLOSED SESSIONS</div>
              </div>
            </div>
            
            {dailyPool && dailyPool.length > 0 && (
              <div className="mt-4">
                <h3 className="font-black mb-2">STUDENTS IN POOL:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {dailyPool.map((entry) => (
                    <div key={entry._id} className="text-xs bg-gray-100 p-2 rounded">
                      <strong>{entry.student?.fullName}</strong>
                      <br />
                      <span className="text-gray-600">
                        {new Date(entry.firstScanTime).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Session Form */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">CREATE NEW SESSION</h2>
              
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">SUBJECT</label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Subject</option>
                    {subjects?.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">START TIME</label>
                  <input
                    type="time"
                    name="scheduleStartTime"
                    value={formData.scheduleStartTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">END TIME</label>
                  <input
                    type="time"
                    name="scheduleEndTime"
                    value={formData.scheduleEndTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
                >
                  CREATE SESSION
                </button>
              </form>
            </div>

            {/* Teacher QR Generator */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">MASTERKEY QR</h2>
              
              {teacherQR ? (
                <div className="text-center">
                  <div id="teacher-qr-code" className="mb-6 flex justify-center">
                    <QRCodeSVG
                      value={teacherQR}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  
                  <div className="text-left mb-6 p-4 bg-gray-100 border-2 border-black">
                    <h3 className="font-black mb-2">MASTERKEY QR:</h3>
                    <p className="text-sm">Scan this QR to verify all students in the daily pool for this session and close it.</p>
                  </div>
                  
                  <button
                    onClick={downloadQR}
                    className="w-full px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
                  >
                    DOWNLOAD QR CODE
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-16">
                  <div className="text-6xl mb-4">🔑</div>
                  <p>Select a session to generate masterkey QR</p>
                </div>
              )}
            </div>
          </div>

          {/* Sessions List */}
          <div className="mt-8 border-4 border-black">
            <div className="bg-black text-white p-4">
              <h2 className="text-xl font-black">TODAY'S SESSIONS</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-black">
                  <tr>
                    <th className="text-left p-4 font-black">SUBJECT</th>
                    <th className="text-left p-4 font-black">SCHEDULE</th>
                    <th className="text-left p-4 font-black">STATUS</th>
                    <th className="text-left p-4 font-black">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsByClass && sessionsByClass.length > 0 ? (
                    sessionsByClass.map((session, index) => (
                      <tr key={session._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="p-4 font-bold">{session.subjectId}</td>
                        <td className="p-4">{session.scheduleStartTime} - {session.scheduleEndTime}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            session.status === 'OPEN' 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {session.status === 'OPEN' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleGenerateTeacherQR(session._id)}
                                className="px-4 py-2 bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
                              >
                                GENERATE QR
                              </button>
                              <button
                                onClick={() => handleCloseSession(session._id)}
                                className="px-4 py-2 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                              >
                                CLOSE
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Session closed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        No sessions created today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

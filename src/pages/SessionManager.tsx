import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function SessionManager() {
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    scheduleStartTime: '',
    scheduleEndTime: '',
  });
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [teacherQR, setTeacherQR] = useState<string | null>(null);

  const createSession = useMutation(api.sessions.createSession);
  const closeSession = useMutation(api.sessions.closeSession);
  const generateTeacherQR = useMutation(api.sessions.generateTeacherQR);
  const openSessions = useQuery(api.sessions.getOpenSessions);
  const subjects = useQuery(api.timetables.getSubjects);
  const classes = useQuery(api.timetables.getClasses);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.classId || !formData.subjectId || !formData.scheduleStartTime || !formData.scheduleEndTime) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const sessionId = await createSession(formData);
      toast.success("Attendance session created successfully!");
      setFormData({
        classId: '',
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
        a.download = `Teacher_Verification_QR.png`;
        a.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/dashboard" className="text-lg font-bold hover:underline">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-lg font-bold">SESSION MANAGER</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">ATTENDANCE SESSIONS</h1>
            <p className="text-lg">Create and manage attendance sessions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Session Form */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">CREATE NEW SESSION</h2>
              
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">CLASS</label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Class</option>
                    {classes?.map(classId => (
                      <option key={classId} value={classId}>{classId}</option>
                    ))}
                  </select>
                </div>

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
              <h2 className="text-2xl font-black mb-6">TEACHER VERIFICATION QR</h2>
              
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
                    <h3 className="font-black mb-2">VERIFICATION QR:</h3>
                    <p className="text-sm">Scan this QR to close the session and verify all pending attendance.</p>
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
                  <p>Select a session to generate teacher verification QR</p>
                </div>
              )}
            </div>
          </div>

          {/* Open Sessions */}
          <div className="mt-8 border-4 border-black">
            <div className="bg-black text-white p-4">
              <h2 className="text-xl font-black">OPEN SESSIONS ({openSessions?.length || 0})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-black">
                  <tr>
                    <th className="text-left p-4 font-black">CLASS</th>
                    <th className="text-left p-4 font-black">SUBJECT</th>
                    <th className="text-left p-4 font-black">SCHEDULE</th>
                    <th className="text-left p-4 font-black">STATUS</th>
                    <th className="text-left p-4 font-black">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {openSessions && openSessions.length > 0 ? (
                    openSessions.map((session, index) => (
                      <tr key={session._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="p-4 font-bold">{session.classId}</td>
                        <td className="p-4">{session.subjectId}</td>
                        <td className="p-4">{session.scheduleStartTime} - {session.scheduleEndTime}</td>
                        <td className="p-4">
                          <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold">
                            {session.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleGenerateTeacherQR(session._id)}
                            className="px-4 py-2 bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors mr-2"
                          >
                            GENERATE QR
                          </button>
                          <Link
                            to={`/scan-session/${session._id}`}
                            className="px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                          >
                            SCAN STUDENTS
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No open sessions
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

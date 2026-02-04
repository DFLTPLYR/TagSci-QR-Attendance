import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SignOutButton } from '../SignOutButton';
import { useOfflineAttendance } from '../hooks/useOfflineAttendance';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const user = useQuery(api.auth.loggedInUser);
  const todayPoolCount = useQuery(api.dailyPool.getTodayPoolCount);
  const { isOnline, pendingSyncCount, getTodayAttendanceOffline } = useOfflineAttendance();
  const [localTodayCount, setLocalTodayCount] = useState(0);

  useEffect(() => {
    const loadLocalAttendance = async () => {
      const localAttendance = await getTodayAttendanceOffline();
      setLocalTodayCount(localAttendance.length);
    };

    loadLocalAttendance();

    // Refresh local count every 5 seconds
    const interval = setInterval(loadLocalAttendance, 5000);
    return () => clearInterval(interval);
  }, [getTodayAttendanceOffline]);

  // Use local count when offline, server count when online
  const displayCount = isOnline ? (todayPoolCount || 0) : localTodayCount;

  // Section-based navigation data
  const sectionsByGradeAndStrand = {
    'Grade 11': {
      'STEM': ['Ampersand', 'Epsilon', 'Caret', 'Obelus', 'Tilde', 'Vinculum'],
      'HUMSS': ['Antonio Luna', 'Gregorio Del Pilar', 'Jacinto Zamora', 'Jose Burgos', 'Mariano Gomez', 'Melchora Aquino'],
      'ABM': ['Andrew Tan', 'Cecilio Pedro', 'Socorro Ramos'],
      'A&D': ['BenCab']
    },
    'Grade 12': {
      'STEM': ['Zirconium', 'Chromium', 'Gadolinium', 'Titanium', 'Platinum', 'Vanadium'],
      'HUMSS': ['Andres Bonifacio', 'Apolinario Mabini', 'Manuel Quezon', 'Isaac Tolentino', 'Jose Rizal'],
      'ABM': ['Henry Sy', 'Mariano Que', 'Jaime Zobel'],
      'A&D': ['Roberto Ong']
    }
  };

  // Generate section navigation items
  const generateSectionNavigation = () => {
    const sections = [];
    for (const [grade, strands] of Object.entries(sectionsByGradeAndStrand)) {
      for (const [strand, sectionList] of Object.entries(strands)) {
        for (const section of sectionList) {
          const classId = `${grade} ${strand} - ${section}`;
          sections.push({
            classId,
            grade,
            strand,
            section,
          });
        }
      }
    }
    return sections;
  };

  const sections = generateSectionNavigation();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold">TAGSCAN</div>
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs font-bold">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {user?.email ? user.email : "Anonymous"}</span>
          {pendingSyncCount > 0 && (
            <span className="text-xs bg-yellow-200 px-2 py-1 rounded font-bold">
              {pendingSyncCount} pending sync
            </span>
          )}
          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4">DASHBOARD</h1>
          <p className="text-lg">Choose a section to manage attendance</p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-sm font-bold">
                Today's Pool: {displayCount} students
                {!isOnline && localTodayCount > 0 && (
                  <span className="text-orange-600 ml-2">(offline data)</span>
                )}
              </p>
            </div>
          </div>
          {!isOnline && (
            <p className="text-sm text-orange-600 mt-1">
              Working offline - data will sync when connection is restored
            </p>
          )}
        </div>

        {/* Section-based Navigation */}
        <div className="w-full max-w-7xl">
          <h2 className="text-2xl font-black mb-6 text-center">SELECT SECTION</h2>

          {/* Grade 11 Sections */}
          <div className="mb-8">
            <h3 className="text-xl font-black mb-4 text-center bg-blue-100 py-2">GRADE 11</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sections.filter(s => s.grade === 'Grade 11').map((section) => (
                <Link
                  key={section.classId}
                  to={`/section/${encodeURIComponent(section.classId)}`}
                  className={`group border-4 duration-300 border-black p-4 transition-colors ${isOnline
                    ? 'hover:bg-black hover:text-white'
                    : 'opacity-50 cursor-not-allowed bg-gray-100'
                    }`}
                  onClick={(e) => {
                    if (!isOnline) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎓</div>
                    <h4 className="font-black text-sm mb-1">{section.strand}</h4>
                    <p className="text-xs">{section.section}</p>
                    {!isOnline && (
                      <p className="text-xs mt-2 text-red-600">
                        Requires internet
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Grade 12 Sections */}
          <div className="mb-8">
            <h3 className="text-xl font-black mb-4 text-center bg-green-100 py-2">GRADE 12</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sections.filter(s => s.grade === 'Grade 12').map((section) => (
                <Link
                  key={section.classId}
                  to={`/section/${encodeURIComponent(section.classId)}`}
                  className={`group border-4 duration-300 border-black p-4 transition-colors ${isOnline
                    ? 'hover:bg-black hover:text-white'
                    : 'opacity-50 cursor-not-allowed bg-gray-100'
                    }`}
                  onClick={(e) => {
                    if (!isOnline) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎓</div>
                    <h4 className="font-black text-sm mb-1">{section.strand}</h4>
                    <p className="text-xs">{section.section}</p>
                    {!isOnline && (
                      <p className="text-xs mt-2 text-red-600">
                        Requires internet
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Management Tools */}
        <div className="w-full max-w-6xl my-12">
          <h2 className="text-2xl font-black mb-6 text-center">MANAGEMENT TOOLS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Daily Pool Scan */}
            <Link
              to="/scan"
              className="group border-4 border-black p-6 duration-300 hover:bg-black hover:text-white transition-colors"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">📱</div>
                <h2 className="text-xl font-black mb-2">DAILY SCAN</h2>
                <p className="text-sm">Add students to daily pool</p>
                {!isOnline && (
                  <p className="text-xs mt-2 text-orange-600 group-hover:text-orange-200">
                    Works offline
                  </p>
                )}
              </div>
            </Link>

            {/* Generate QR IDs */}
            <Link
              to="/generate"
              className={`group border-4 border-black p-6 duration-300 transition-colors ${isOnline
                ? 'hover:bg-black hover:text-white'
                : 'opacity-50 cursor-not-allowed bg-gray-100'
                }`}
              onClick={(e) => {
                if (!isOnline) {
                  e.preventDefault();
                }
              }}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">⚡</div>
                <h2 className="text-xl font-black mb-2">GENERATE QR IDS</h2>
                <p className="text-sm">Create QR codes for new students</p>
                {!isOnline && (
                  <p className="text-xs mt-2 text-red-600">
                    Requires internet connection
                  </p>
                )}
              </div>
            </Link>

            {/* View Logs */}
            <Link
              to="/logs"
              className="group border-4 border-black p-6 duration-300 hover:bg-black hover:text-white transition-colors"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">📊</div>
                <h2 className="text-xl font-black mb-2">VIEW LOGS</h2>
                <p className="text-sm">View attendance records and reports</p>
                {!isOnline && (
                  <p className="text-xs mt-2 text-orange-600 group-hover:text-orange-200">
                    Shows local data when offline
                  </p>
                )}
              </div>
            </Link>

            {/* Student Progress */}
            <Link
              to="/progress"
              className={`group border-4 border-black p-6 duration-300 transition-colors ${isOnline
                ? 'hover:bg-black hover:text-white'
                : 'opacity-50 cursor-not-allowed bg-gray-100'
                }`}
              onClick={(e) => {
                if (!isOnline) {
                  e.preventDefault();
                }
              }}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">📈</div>
                <h2 className="text-xl font-black mb-2">ANALYTICS</h2>
                <p className="text-sm">Student progress and trends</p>
                {!isOnline && (
                  <p className="text-xs mt-2 text-red-600">
                    Requires internet connection
                  </p>
                )}
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

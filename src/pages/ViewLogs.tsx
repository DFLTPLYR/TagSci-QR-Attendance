import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useOfflineAttendance } from '../hooks/useOfflineAttendance';
import { LocalAttendanceEntry } from '../services/database';

export default function ViewLogs() {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    subjectId: '',
    classId: '',
    studentName: '',
    status: '',
    arrivalCategory: '',
  });
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    newArrivalCategory: '',
    reason: '',
  });

  const { isOnline, getTodayAttendanceOffline } = useOfflineAttendance();
  const [localLogs, setLocalLogs] = useState<LocalAttendanceEntry[]>([]);
  
  const filteredLogs = useQuery(
    api.attendanceLogs.getFilteredLogs,
    isOnline ? filters : "skip"
  );
  const subjects = useQuery(api.timetables.getSubjects);
  const classes = useQuery(api.timetables.getClasses);
  const modifyStatus = useMutation(api.attendanceLogs.modifyAttendanceStatus);

  useEffect(() => {
    const loadLocalLogs = async () => {
      if (!isOnline) {
        const logs = await getTodayAttendanceOffline();
        setLocalLogs(logs);
      }
    };
    
    loadLocalLogs();
  }, [isOnline, getTodayAttendanceOffline]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      subjectId: '',
      classId: '',
      studentName: '',
      status: '',
      arrivalCategory: '',
    });
  };

  const handleEditClick = (log: any) => {
    setEditingLog(log);
    setEditForm({
      newArrivalCategory: log.arrivalCategory,
      reason: '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.reason.trim()) {
      alert("Please provide a reason for the modification");
      return;
    }

    try {
      await modifyStatus({
        logId: editingLog._id,
        newStatus: "MODIFIED",
        newArrivalCategory: editForm.newArrivalCategory as any,
        reason: editForm.reason,
      });
      
      setEditingLog(null);
      setEditForm({ newArrivalCategory: '', reason: '' });
      alert("Attendance status updated successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to update attendance status");
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Use filtered logs when online, local logs when offline
  const displayLogs = isOnline ? filteredLogs : localLogs;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/dashboard" className="text-lg font-bold hover:underline">
          ← BACK TO DASHBOARD
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold">ATTENDANCE LOGS</div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs font-bold">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">ATTENDANCE RECORDS</h1>
            <p className="text-lg">View and manage attendance logs</p>
            {!isOnline && (
              <p className="text-sm text-orange-600 mt-1">
                Showing local data - will sync when connection is restored
              </p>
            )}
          </div>

          {/* Filters - Only show when online */}
          {isOnline && (
            <div className="border-4 border-black p-6 mb-8">
              <h2 className="text-2xl font-black mb-4">FILTERS</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-2">FROM DATE</label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">TO DATE</label>
                  <input
                    type="date"
                    name="dateTo"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">SUBJECT</label>
                  <select
                    name="subjectId"
                    value={filters.subjectId}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">All Subjects</option>
                    {subjects?.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">CLASS</label>
                  <select
                    name="classId"
                    value={filters.classId}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">All Classes</option>
                    {classes?.map(classId => (
                      <option key={classId} value={classId}>{classId}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">STUDENT NAME</label>
                  <input
                    type="text"
                    name="studentName"
                    value={filters.studentName}
                    onChange={handleFilterChange}
                    placeholder="Search by name..."
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">STATUS</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">PENDING</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="MODIFIED">MODIFIED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">ARRIVAL</label>
                  <select
                    name="arrivalCategory"
                    value={filters.arrivalCategory}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">All Categories</option>
                    <option value="EARLY">EARLY</option>
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
              >
                CLEAR FILTERS
              </button>
            </div>
          )}

          {/* Attendance Table */}
          <div className="border-4 border-black">
            <div className="bg-black text-white p-4">
              <h2 className="text-xl font-black">
                ATTENDANCE RECORDS ({displayLogs?.length || 0} entries)
                {!isOnline && <span className="text-yellow-300 ml-2">[OFFLINE MODE]</span>}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-black">
                  <tr>
                    <th className="text-left p-4 font-black">NAME</th>
                    <th className="text-left p-4 font-black">CLASS</th>
                    <th className="text-left p-4 font-black">LRN</th>
                    {isOnline && <th className="text-left p-4 font-black">SUBJECT</th>}
                    <th className="text-left p-4 font-black">LOGIN TIME</th>
                    {isOnline && <th className="text-left p-4 font-black">LOGOUT TIME</th>}
                    <th className="text-left p-4 font-black">CATEGORY</th>
                    <th className="text-left p-4 font-black">STATUS</th>
                    {isOnline && <th className="text-left p-4 font-black">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayLogs && displayLogs.length > 0 ? (
                    displayLogs.map((log: any, index: number) => (
                      <tr key={('_id' in log ? log._id : log.id) || index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="p-4 font-bold">{log.fullName}</td>
                        <td className="p-4">{log.gradeLevel} {log.strand} - {log.section}</td>
                        <td className="p-4">{log.lrnNumber}</td>
                        {isOnline && (
                          <td className="p-4">{log.session?.subjectId || 'N/A'}</td>
                        )}
                        <td className="p-4">{formatTimestamp(log.loginTimestamp || log.timestamp)}</td>
                        {isOnline && (
                          <td className="p-4">
                            {log.logoutTimestamp ? formatTimestamp(log.logoutTimestamp) : '-'}
                          </td>
                        )}
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            log.arrivalCategory === 'EARLY' ? 'bg-blue-200 text-blue-800' :
                            log.arrivalCategory === 'PRESENT' ? 'bg-green-200 text-green-800' :
                            log.arrivalCategory === 'LATE' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {log.arrivalCategory || 'PRESENT'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            log.status === 'VERIFIED' ? 'bg-green-200 text-green-800' :
                            log.status === 'MODIFIED' ? 'bg-orange-200 text-orange-800' :
                            log.synced === false ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {log.status || (log.synced === false ? 'PENDING' : 'SYNCED')}
                          </span>
                        </td>
                        {isOnline && (
                          <td className="p-4">
                            <button
                              onClick={() => handleEditClick(log)}
                              className="px-3 py-1 bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors text-xs"
                            >
                              EDIT
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isOnline ? 9 : 6} className="p-8 text-center text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-black mb-4">EDIT ATTENDANCE STATUS</h3>
            
            <div className="mb-4">
              <p><strong>Student:</strong> {editingLog.fullName}</p>
              <p><strong>Current Status:</strong> {editingLog.arrivalCategory}</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">NEW STATUS</label>
                <select
                  value={editForm.newArrivalCategory}
                  onChange={(e) => setEditForm({...editForm, newArrivalCategory: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  <option value="EARLY">EARLY</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">REASON FOR CHANGE</label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  placeholder="Explain why this change is being made..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                >
                  UPDATE
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="flex-1 px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

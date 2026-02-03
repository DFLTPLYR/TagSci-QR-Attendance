import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StudentProgress() {
  const [filters, setFilters] = useState({
    subjectId: '',
    studentId: '',
    dateFrom: '',
    dateTo: '',
  });

  const subjects = useQuery(api.timetables.getSubjects);
  const students = useQuery(api.students.getAllStudents);
  const filteredLogs = useQuery(
    api.attendanceLogs.getFilteredLogs,
    {
      subjectId: filters.subjectId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      subjectId: '',
      studentId: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Process data for chart
  const processChartData = () => {
    if (!filteredLogs) return null;

    // Filter by student if selected
    let logs = filteredLogs;
    if (filters.studentId) {
      logs = logs.filter(log => log.studentId === filters.studentId);
    }

    // Only include verified logs
    const verifiedLogs = logs.filter(log => log.status === 'VERIFIED');

    // Group by date
    const dateGroups: { [date: string]: any[] } = {};
    verifiedLogs.forEach(log => {
      const timestamp = log.loginTimestamp || log.timestamp || Date.now();
      const date = new Date(timestamp).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(log);
    });

    // Sort dates
    const sortedDates = Object.keys(dateGroups).sort();

    // Calculate attendance rate for each date
    const attendanceData = sortedDates.map(date => {
      const dayLogs = dateGroups[date];
      const presentCount = dayLogs.filter(log => 
        log.arrivalCategory === 'EARLY' || 
        log.arrivalCategory === 'PRESENT' || 
        log.arrivalCategory === 'LATE'
      ).length;
      const totalSessions = dayLogs.length;
      return totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
    });

    return {
      labels: sortedDates.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: 'Attendance Rate (%)',
          data: attendanceData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartData = processChartData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Student Attendance Progress',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
        },
      },
    },
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!filteredLogs) return null;

    let logs = filteredLogs;
    if (filters.studentId) {
      logs = logs.filter(log => log.studentId === filters.studentId);
    }

    const verifiedLogs = logs.filter(log => log.status === 'VERIFIED');
    const totalSessions = verifiedLogs.length;
    const presentCount = verifiedLogs.filter(log => 
      log.arrivalCategory === 'EARLY' || 
      log.arrivalCategory === 'PRESENT' || 
      log.arrivalCategory === 'LATE'
    ).length;
    const earlyCount = verifiedLogs.filter(log => log.arrivalCategory === 'EARLY').length;
    const lateCount = verifiedLogs.filter(log => log.arrivalCategory === 'LATE').length;

    return {
      totalSessions,
      presentCount,
      earlyCount,
      lateCount,
      attendanceRate: totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0,
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/dashboard" className="text-lg font-bold hover:underline">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-lg font-bold">STUDENT PROGRESS</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">ATTENDANCE ANALYTICS</h1>
            <p className="text-lg">Track student attendance patterns and progress</p>
          </div>

          {/* Filters */}
          <div className="border-4 border-black p-6 mb-8">
            <h2 className="text-2xl font-black mb-4">FILTERS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                <label className="block text-sm font-bold mb-2">STUDENT</label>
                <select
                  name="studentId"
                  value={filters.studentId}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">All Students</option>
                  {students?.map(student => (
                    <option key={student._id} value={student._id}>{student.fullName}</option>
                  ))}
                </select>
              </div>

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
            </div>

            <button
              onClick={clearFilters}
              className="px-6 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors font-bold"
            >
              CLEAR FILTERS
            </button>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="border-4 border-black p-4 text-center">
                <div className="text-2xl font-black text-blue-600">{stats.totalSessions}</div>
                <div className="text-sm font-bold">TOTAL SESSIONS</div>
              </div>
              <div className="border-4 border-black p-4 text-center">
                <div className="text-2xl font-black text-green-600">{stats.presentCount}</div>
                <div className="text-sm font-bold">PRESENT</div>
              </div>
              <div className="border-4 border-black p-4 text-center">
                <div className="text-2xl font-black text-yellow-600">{stats.earlyCount}</div>
                <div className="text-sm font-bold">EARLY</div>
              </div>
              <div className="border-4 border-black p-4 text-center">
                <div className="text-2xl font-black text-orange-600">{stats.lateCount}</div>
                <div className="text-sm font-bold">LATE</div>
              </div>
              <div className="border-4 border-black p-4 text-center">
                <div className="text-2xl font-black text-purple-600">{stats.attendanceRate.toFixed(1)}%</div>
                <div className="text-sm font-bold">ATTENDANCE RATE</div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="border-4 border-black p-6">
            <h2 className="text-2xl font-black mb-6">ATTENDANCE TREND</h2>
            
            {chartData && chartData.labels.length > 0 ? (
              <div className="h-96">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <p>No attendance data available for the selected filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

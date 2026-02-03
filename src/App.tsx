import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ConcernsPage from './pages/ConcernsPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SectionDashboard from './pages/SectionDashboard';
import SessionManager from './pages/SessionManager';
import TimetableManager from './pages/TimetableManager';
import ScanAttendance from './pages/ScanAttendance';
import ScanSession from './pages/ScanSession';
import GenerateQR from './pages/GenerateQR';
import ViewLogs from './pages/ViewLogs';
import StudentProgress from './pages/StudentProgress';

function App() {
  const user = useQuery(api.auth.loggedInUser);

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/concerns" element={<ConcernsPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          {user ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/section/:classId" element={<SectionDashboard />} />
              <Route path="/sessions" element={<SessionManager />} />
              <Route path="/timetables" element={<TimetableManager />} />
              <Route path="/scan" element={<ScanAttendance />} />
              <Route path="/scan-session/:sessionId" element={<ScanSession />} />
              <Route path="/generate" element={<GenerateQR />} />
              <Route path="/logs" element={<ViewLogs />} />
              <Route path="/progress" element={<StudentProgress />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
            border: '2px solid #000',
            fontWeight: 'bold',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Sonner for SignInForm */}
      <SonnerToaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#000',
            border: '2px solid #000',
            fontWeight: 'bold',
          },
        }}
      />
    </>
  );
}

export default App;

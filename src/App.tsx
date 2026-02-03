import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Authenticated, ConvexReactClient, Unauthenticated, useConvexAuth, useQuery } from 'convex/react';
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
import { useEffect } from 'react';
import { syncService } from './services/syncService';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
function App() {
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    // Initialize sync service with Convex client
    syncService.setConvexClient(convex);
    if (isAuthenticated) {
      // Start periodic sync when authenticated
      syncService.startPeriodicSync().catch((e) => { console.log("error found: ", e) });
    }
  }, [isAuthenticated]);

  // Route wrappers
  const ProtectedRoute = ({ children, redirectTo = "/dashboard" }) => (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated><Navigate to={redirectTo} replace /></Unauthenticated>
    </>
  );
  const PublicRoute = ({ children, redirectTo = "/dashboard" }) => (
    <>
      <Unauthenticated>{children}</Unauthenticated>
      <Authenticated><Navigate to={redirectTo} replace /></Authenticated>
    </>
  );

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/concerns" element={<ConcernsPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />


          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="/section/:classId" element={<ProtectedRoute><SectionDashboard /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><SessionManager /></ProtectedRoute>} />
          <Route path="/timetables" element={<ProtectedRoute><TimetableManager /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><ScanAttendance /></ProtectedRoute>} />
          <Route path="/scan-session/:sessionId" element={<ProtectedRoute><ScanSession /></ProtectedRoute>} />
          <Route path="/generate" element={<ProtectedRoute><GenerateQR /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><ViewLogs /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><StudentProgress /></ProtectedRoute>} />

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

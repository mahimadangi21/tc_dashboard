import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from 'react-error-boundary';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GridView from './pages/GridView';
import Trainees from './pages/Trainees';
import TraineeDetail from './pages/TraineeDetail';
import Analytics from './pages/Analytics';
import Tasks from './pages/Tasks';

function App() {
  return (
    <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
      <div style={{ padding: '2rem', color: 'crimson', background: '#fff', minHeight: '100vh' }}>
        <h2>Application crashed. Please refresh.</h2>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px', marginTop: '1rem' }}>{error?.message}</pre>
        <button onClick={resetErrorBoundary} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Try Again</button>
      </div>
    )}>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grid"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <GridView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainees"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Trainees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainees/:id"
            element={
              <ProtectedRoute allowedRoles={['admin', 'trainee', 'student']}>
                <TraineeDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Tasks />
              </ProtectedRoute>
            }
          />

          {/* Legacy fallback redirects for old student paths */}
          <Route path="/students" element={<Navigate to="/trainees" replace />} />
          <Route path="/students/:id" element={<TraineeDetailRedirect />} />

          {/* Root Redirect handler based on user role */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RootRedirect />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

// Redirect old /students/:id path to modern /trainees/:id path
const TraineeDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/trainees/${id}`} replace />;
};

// Route the root URL to the role-specific landing page
const RootRedirect = () => {
  const role = localStorage.getItem('role');
  const traineeId = localStorage.getItem('trainee_id') || localStorage.getItem('student_id');

  if (role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  } else if ((role === 'trainee' || role === 'student') && traineeId) {
    return <Navigate to={`/trainees/${traineeId}`} replace />;
  }
  return <Navigate to="/login" replace />;
};


export default App;

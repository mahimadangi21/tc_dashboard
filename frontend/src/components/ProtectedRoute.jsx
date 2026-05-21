import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Handle both trainee and student role checks for compatibility
  const normalizedRole = role === 'student' ? 'trainee' : role;
  const normalizedAllowedRoles = allowedRoles?.map(r => r === 'student' ? 'trainee' : r);

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
    if (normalizedRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else {
      const traineeId = localStorage.getItem('trainee_id') || localStorage.getItem('student_id');
      if (traineeId) {
        return <Navigate to={`/trainees/${traineeId}`} replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
